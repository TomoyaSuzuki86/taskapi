import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { Firestore } from 'firebase-admin/firestore';
import type {
  OAuthClientInformationFull,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import type { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/server/auth/clients.js';
import type {
  AuthorizationParams,
  OAuthServerProvider,
} from '@modelcontextprotocol/sdk/server/auth/provider.js';
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import {
  AccessDeniedError,
  InvalidClientError,
  InvalidGrantError,
  InvalidScopeError,
  ServerError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';
import {
  issueTaskapiMcpToken,
  verifyTaskapiMcpToken,
} from './taskapi-mcp-oauth-tokens';

const MCP_TOOLS_SCOPE = 'mcp:tools';
const AUTH_REQUEST_TTL_MS = 10 * 60 * 1000;
const AUTHORIZATION_CODE_TTL_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_LIFETIME_SECONDS = 60 * 60;
const REFRESH_TOKEN_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

type TaskapiMcpOAuthProviderOptions = {
  firestore: Firestore;
  issuerUrl: URL;
  resourceServerUrl: URL;
  ownerUid: string;
  approvalSecret: string;
  tokenSecret: string;
};

type PendingAuthorizationRequest = {
  id: string;
  clientId: string;
  clientName: string | null;
  redirectUri: string;
  state: string | null;
  scopes: string[];
  codeChallenge: string;
  resource: string;
  createdAt: number;
  expiresAt: number;
};

type AuthorizationCodeRecord = {
  code: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge: string;
  resource: string;
  ownerUid: string;
  createdAt: number;
  expiresAt: number;
  consumedAt: number | null;
};

export class TaskapiMcpOAuthProvider implements OAuthServerProvider {
  readonly clientsStore: OAuthRegisteredClientsStore;
  readonly skipLocalPkceValidation = false;

  private readonly firestore: Firestore;
  private readonly issuerUrl: URL;
  private readonly resourceServerUrl: URL;
  private readonly ownerUid: string;
  private readonly approvalSecret: string;
  private readonly tokenSecret: string;

  constructor(options: TaskapiMcpOAuthProviderOptions) {
    this.firestore = options.firestore;
    this.issuerUrl = options.issuerUrl;
    this.resourceServerUrl = options.resourceServerUrl;
    this.ownerUid = options.ownerUid;
    this.approvalSecret = options.approvalSecret;
    this.tokenSecret = options.tokenSecret;
    this.clientsStore = new FirestoreOAuthClientsStore(this.firestore);
  }

  async authorize(
    client: OAuthClientInformationFull,
    params: AuthorizationParams,
    res: Parameters<OAuthServerProvider['authorize']>[2],
  ) {
    if (
      params.scopes &&
      params.scopes.some((scope) => scope.trim().length === 0)
    ) {
      throw new InvalidScopeError('Invalid scope.');
    }

    const requestId = randomUUID();
    const now = Date.now();
    const pendingRequest: PendingAuthorizationRequest = {
      id: requestId,
      clientId: client.client_id,
      clientName: client.client_name ?? null,
      redirectUri: params.redirectUri,
      state: params.state ?? null,
      scopes: params.scopes?.length ? params.scopes : [MCP_TOOLS_SCOPE],
      codeChallenge: params.codeChallenge,
      resource: params.resource?.toString() ?? this.resourceServerUrl.href,
      createdAt: now,
      expiresAt: now + AUTH_REQUEST_TTL_MS,
    };

    await this.firestore
      .collection('taskapiMcpOauthAuthRequests')
      .doc(requestId)
      .set(pendingRequest);

    res.redirect(
      new URL(
        `/oauth/approve?request=${encodeURIComponent(requestId)}`,
        this.issuerUrl,
      ).toString(),
    );
  }

  async challengeForAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
  ) {
    const code = await this.readAuthorizationCode(client.client_id, authorizationCode);
    return code.codeChallenge;
  }

  async exchangeAuthorizationCode(
    client: OAuthClientInformationFull,
    authorizationCode: string,
    _codeVerifier?: string,
    redirectUri?: string,
    resource?: URL,
  ): Promise<OAuthTokens> {
    const codeRecord = await this.consumeAuthorizationCode(
      client.client_id,
      authorizationCode,
    );

    if (redirectUri && redirectUri !== codeRecord.redirectUri) {
      throw new InvalidGrantError('redirect_uri does not match the original request.');
    }

    if (resource && resource.toString() !== codeRecord.resource) {
      throw new InvalidGrantError('resource does not match the original request.');
    }

    return this.issueTokens(client.client_id, codeRecord.ownerUid, codeRecord.scopes);
  }

  async exchangeRefreshToken(
    client: OAuthClientInformationFull,
    refreshToken: string,
    scopes?: string[],
    resource?: URL,
  ): Promise<OAuthTokens> {
    const claims = verifyTaskapiMcpToken({
      token: refreshToken,
      expectedType: 'refresh',
      issuer: this.issuerUrl.href,
      audience: this.resourceServerUrl.href,
      secret: this.tokenSecret,
    });

    if (claims.client_id !== client.client_id) {
      throw new InvalidClientError('Refresh token was not issued to this client.');
    }

    if (resource && resource.toString() !== this.resourceServerUrl.href) {
      throw new InvalidGrantError('Invalid resource.');
    }

    const grantedScopes = claims.scope.split(' ').filter(Boolean);
    const requestedScopes = scopes?.length ? scopes : grantedScopes;

    if (!requestedScopes.every((scope) => grantedScopes.includes(scope))) {
      throw new InvalidScopeError('Requested scope exceeds the granted scope.');
    }

    return this.issueTokens(client.client_id, claims.sub, requestedScopes);
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const claims = verifyTaskapiMcpToken({
      token,
      expectedType: 'access',
      issuer: this.issuerUrl.href,
      audience: this.resourceServerUrl.href,
      secret: this.tokenSecret,
    });

    return {
      token,
      clientId: claims.client_id,
      scopes: claims.scope.split(' ').filter(Boolean),
      expiresAt: claims.exp,
      resource: new URL(claims.aud),
      extra: {
        uid: claims.sub,
      },
    };
  }

  async completeAuthorization(requestId: string, submittedSecret: string) {
    if (!safeSecretEquals(this.approvalSecret, submittedSecret)) {
      throw new AccessDeniedError('Approval secret was invalid.');
    }

    const pendingRequest = await this.readPendingAuthorizationRequest(requestId);
    const code = randomUUID();
    const now = Date.now();
    const codeRecord: AuthorizationCodeRecord = {
      code,
      clientId: pendingRequest.clientId,
      redirectUri: pendingRequest.redirectUri,
      scopes: pendingRequest.scopes,
      codeChallenge: pendingRequest.codeChallenge,
      resource: pendingRequest.resource,
      ownerUid: this.ownerUid,
      createdAt: now,
      expiresAt: now + AUTHORIZATION_CODE_TTL_MS,
      consumedAt: null,
    };

    await this.firestore.runTransaction(async (transaction) => {
      const requestRef = this.firestore
        .collection('taskapiMcpOauthAuthRequests')
        .doc(requestId);
      const requestSnapshot = await transaction.get(requestRef);

      if (!requestSnapshot.exists) {
        throw new InvalidGrantError('Authorization request was not found.');
      }

      transaction.set(
        this.firestore.collection('taskapiMcpOauthAuthCodes').doc(code),
        codeRecord,
      );
      transaction.delete(requestRef);
    });

    const redirectUrl = new URL(pendingRequest.redirectUri);
    redirectUrl.searchParams.set('code', code);

    if (pendingRequest.state) {
      redirectUrl.searchParams.set('state', pendingRequest.state);
    }

    return {
      redirectTo: redirectUrl.toString(),
      request: pendingRequest,
    };
  }

  async getPendingAuthorizationRequest(requestId: string) {
    return this.readPendingAuthorizationRequest(requestId);
  }

  private async issueTokens(
    clientId: string,
    subject: string,
    scopes: string[],
  ): Promise<OAuthTokens> {
    const scope = scopes.length > 0 ? scopes.join(' ') : MCP_TOOLS_SCOPE;

    return {
      access_token: issueTaskapiMcpToken({
        issuer: this.issuerUrl.href,
        audience: this.resourceServerUrl.href,
        subject,
        clientId,
        scope,
        type: 'access',
        lifetimeSeconds: ACCESS_TOKEN_LIFETIME_SECONDS,
        secret: this.tokenSecret,
      }),
      refresh_token: issueTaskapiMcpToken({
        issuer: this.issuerUrl.href,
        audience: this.resourceServerUrl.href,
        subject,
        clientId,
        scope,
        type: 'refresh',
        lifetimeSeconds: REFRESH_TOKEN_LIFETIME_SECONDS,
        secret: this.tokenSecret,
      }),
      token_type: 'bearer',
      expires_in: ACCESS_TOKEN_LIFETIME_SECONDS,
      scope,
    };
  }

  private async readPendingAuthorizationRequest(requestId: string) {
    const snapshot = await this.firestore
      .collection('taskapiMcpOauthAuthRequests')
      .doc(requestId)
      .get();

    if (!snapshot.exists) {
      throw new InvalidGrantError('Authorization request was not found.');
    }

    return parsePendingAuthorizationRequest(snapshot.data(), requestId);
  }

  private async readAuthorizationCode(clientId: string, code: string) {
    const snapshot = await this.firestore
      .collection('taskapiMcpOauthAuthCodes')
      .doc(code)
      .get();

    if (!snapshot.exists) {
      throw new InvalidGrantError('Authorization code was not found.');
    }

    const record = parseAuthorizationCodeRecord(snapshot.data(), code);

    if (record.clientId !== clientId) {
      throw new InvalidGrantError('Authorization code was not issued to this client.');
    }

    if (record.expiresAt <= Date.now()) {
      throw new InvalidGrantError('Authorization code has expired.');
    }

    if (record.consumedAt !== null) {
      throw new InvalidGrantError('Authorization code has already been used.');
    }

    return record;
  }

  private async consumeAuthorizationCode(clientId: string, code: string) {
    const codeRef = this.firestore.collection('taskapiMcpOauthAuthCodes').doc(code);

    return this.firestore.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(codeRef);

      if (!snapshot.exists) {
        throw new InvalidGrantError('Authorization code was not found.');
      }

      const record = parseAuthorizationCodeRecord(snapshot.data(), code);

      if (record.clientId !== clientId) {
        throw new InvalidGrantError(
          'Authorization code was not issued to this client.',
        );
      }

      if (record.expiresAt <= Date.now()) {
        throw new InvalidGrantError('Authorization code has expired.');
      }

      if (record.consumedAt !== null) {
        throw new InvalidGrantError('Authorization code has already been used.');
      }

      transaction.update(codeRef, {
        consumedAt: Date.now(),
      });

      return record;
    });
  }
}

class FirestoreOAuthClientsStore implements OAuthRegisteredClientsStore {
  constructor(private readonly firestore: Firestore) {}

  async getClient(clientId: string) {
    const snapshot = await this.firestore
      .collection('taskapiMcpOauthClients')
      .doc(clientId)
      .get();

    if (!snapshot.exists) {
      return undefined;
    }

    return parseOAuthClientInformation(snapshot.data(), clientId);
  }

  async registerClient(
    client: Omit<OAuthClientInformationFull, 'client_id' | 'client_id_issued_at'>,
  ) {
    const clientId = randomUUID();
    const record: OAuthClientInformationFull = {
      ...client,
      client_id: clientId,
      client_id_issued_at: Math.floor(Date.now() / 1000),
    };

    try {
      await this.firestore
        .collection('taskapiMcpOauthClients')
        .doc(clientId)
        .set(toFirestoreRecord(record) as FirebaseFirestore.DocumentData);
    } catch (error) {
      console.error('taskapi MCP OAuth client registration failed:', error);
      throw error;
    }

    return record;
  }
}

function parseOAuthClientInformation(
  value: FirebaseFirestore.DocumentData | undefined,
  clientId: string,
): OAuthClientInformationFull {
  if (!value || typeof value !== 'object') {
    throw new ServerError(`OAuth client ${clientId} is invalid.`);
  }

  const redirectUris = readStringArray(value.redirect_uris, 'redirect_uris');
  const tokenEndpointAuthMethod =
    typeof value.token_endpoint_auth_method === 'string'
      ? value.token_endpoint_auth_method
      : undefined;

  return {
    ...value,
    redirect_uris: redirectUris,
    token_endpoint_auth_method: tokenEndpointAuthMethod,
    client_id: readRequiredString(value.client_id, 'client_id'),
    client_id_issued_at: readRequiredNumber(
      value.client_id_issued_at,
      'client_id_issued_at',
    ),
    client_secret:
      typeof value.client_secret === 'string' ? value.client_secret : undefined,
    client_secret_expires_at:
      typeof value.client_secret_expires_at === 'number'
        ? value.client_secret_expires_at
        : undefined,
    client_name:
      typeof value.client_name === 'string' ? value.client_name : undefined,
    scope: typeof value.scope === 'string' ? value.scope : undefined,
    grant_types: Array.isArray(value.grant_types)
      ? readStringArray(value.grant_types, 'grant_types')
      : undefined,
    response_types: Array.isArray(value.response_types)
      ? readStringArray(value.response_types, 'response_types')
      : undefined,
    contacts: Array.isArray(value.contacts)
      ? readStringArray(value.contacts, 'contacts')
      : undefined,
  };
}

function parsePendingAuthorizationRequest(
  value: FirebaseFirestore.DocumentData | undefined,
  requestId: string,
): PendingAuthorizationRequest {
  if (!value || typeof value !== 'object') {
    throw new ServerError(`Authorization request ${requestId} is invalid.`);
  }

  const request: PendingAuthorizationRequest = {
    id: requestId,
    clientId: readRequiredString(value.clientId, 'clientId'),
    clientName: typeof value.clientName === 'string' ? value.clientName : null,
    redirectUri: readRequiredString(value.redirectUri, 'redirectUri'),
    state: typeof value.state === 'string' ? value.state : null,
    scopes: readStringArray(value.scopes, 'scopes'),
    codeChallenge: readRequiredString(value.codeChallenge, 'codeChallenge'),
    resource: readRequiredString(value.resource, 'resource'),
    createdAt: readRequiredNumber(value.createdAt, 'createdAt'),
    expiresAt: readRequiredNumber(value.expiresAt, 'expiresAt'),
  };

  if (request.expiresAt <= Date.now()) {
    throw new InvalidGrantError('Authorization request has expired.');
  }

  return request;
}

function parseAuthorizationCodeRecord(
  value: FirebaseFirestore.DocumentData | undefined,
  code: string,
): AuthorizationCodeRecord {
  if (!value || typeof value !== 'object') {
    throw new ServerError(`Authorization code ${code} is invalid.`);
  }

  return {
    code,
    clientId: readRequiredString(value.clientId, 'clientId'),
    redirectUri: readRequiredString(value.redirectUri, 'redirectUri'),
    scopes: readStringArray(value.scopes, 'scopes'),
    codeChallenge: readRequiredString(value.codeChallenge, 'codeChallenge'),
    resource: readRequiredString(value.resource, 'resource'),
    ownerUid: readRequiredString(value.ownerUid, 'ownerUid'),
    createdAt: readRequiredNumber(value.createdAt, 'createdAt'),
    expiresAt: readRequiredNumber(value.expiresAt, 'expiresAt'),
    consumedAt: value.consumedAt === null ? null : readNullableNumber(value.consumedAt),
  };
}

function readRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new ServerError(`${fieldName} is invalid.`);
  }

  return value;
}

function readStringArray(value: unknown, fieldName: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new ServerError(`${fieldName} is invalid.`);
  }

  return value as string[];
}

function readRequiredNumber(value: unknown, fieldName: string) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ServerError(`${fieldName} is invalid.`);
  }

  return value;
}

function readNullableNumber(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new ServerError('nullable number value is invalid.');
  }

  return value;
}

function safeSecretEquals(expected: string, actual: string) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

function toFirestoreRecord(value: unknown): unknown {
  if (value instanceof URL) {
    return value.href;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => toFirestoreRecord(item))
      .filter((item) => typeof item !== 'undefined');
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value).flatMap(([key, item]) => {
      const normalized = toFirestoreRecord(item);

      if (typeof normalized === 'undefined') {
        return [];
      }

      return [[key, normalized] as const];
    });

    return Object.fromEntries(entries);
  }

  if (typeof value === 'undefined') {
    return undefined;
  }

  return value;
}

export function renderApprovalPageHtml(options: {
  requestId: string;
  clientName: string | null;
  scopes: string[];
  errorMessage?: string;
}) {
  const title = options.clientName
    ? `Allow ${escapeHtml(options.clientName)} to access taskapi`
    : 'Allow access to taskapi';
  const scopes = options.scopes.length
    ? options.scopes.map((scope) => `<li>${escapeHtml(scope)}</li>`).join('')
    : `<li>${escapeHtml(MCP_TOOLS_SCOPE)}</li>`;
  const errorBlock = options.errorMessage
    ? `<p style="color:#b42318;margin:0 0 16px;">${escapeHtml(options.errorMessage)}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root { color-scheme: light; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: ui-sans-serif, system-ui, sans-serif;
        background: linear-gradient(180deg, #eef4ff 0%, #f7fafc 100%);
        display: grid;
        place-items: center;
        padding: 24px;
        color: #102a43;
      }
      .card {
        width: min(100%, 420px);
        background: rgba(255,255,255,0.92);
        border: 1px solid rgba(16,42,67,0.08);
        border-radius: 20px;
        box-shadow: 0 24px 60px rgba(16,42,67,0.12);
        padding: 24px;
      }
      h1 { margin: 0 0 12px; font-size: 22px; line-height: 1.2; }
      p { margin: 0 0 16px; line-height: 1.5; color: #486581; }
      ul { margin: 0 0 20px; padding-left: 20px; color: #243b53; }
      label { display:block; margin-bottom: 8px; font-weight: 600; }
      input {
        width: 100%;
        box-sizing: border-box;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid #bcccdc;
        font-size: 16px;
        margin-bottom: 16px;
      }
      button {
        width: 100%;
        border: 0;
        border-radius: 12px;
        padding: 12px 16px;
        background: #0f766e;
        color: white;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <h1>${title}</h1>
      <p>This MCP connection is protected by a single-user approval secret.</p>
      ${errorBlock}
      <p>Requested scopes:</p>
      <ul>${scopes}</ul>
      <p id="errorMessage" style="display:none;color:#b42318;margin:0 0 16px;"></p>
      <form id="approvalForm">
        <input type="hidden" name="requestId" value="${escapeHtml(options.requestId)}" />
        <label for="approvalSecret">Approval secret</label>
        <input id="approvalSecret" name="approvalSecret" type="password" autocomplete="current-password" required />
        <button type="submit">Authorize</button>
      </form>
    </main>
    <script>
      const form = document.getElementById('approvalForm');
      const errorMessage = document.getElementById('errorMessage');
      form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const response = await fetch('/oauth/approve', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            requestId: formData.get('requestId'),
            approvalSecret: formData.get('approvalSecret'),
          }),
        });
        const payload = await response.json();
        if (response.ok && payload.redirectTo) {
          window.location.href = payload.redirectTo;
          return;
        }
        if (errorMessage) {
          errorMessage.textContent = payload.error || 'Authorization failed.';
          errorMessage.style.display = 'block';
        }
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
