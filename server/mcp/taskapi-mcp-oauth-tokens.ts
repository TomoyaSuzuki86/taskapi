import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  InvalidGrantError,
  InvalidTokenError,
} from '@modelcontextprotocol/sdk/server/auth/errors.js';

type TaskapiMcpTokenType = 'access' | 'refresh';

type TaskapiMcpJwtClaims = {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  client_id: string;
  scope: string;
  type: TaskapiMcpTokenType;
};

type IssueTaskapiMcpTokenOptions = {
  issuer: string;
  audience: string;
  subject: string;
  clientId: string;
  scope: string;
  type: TaskapiMcpTokenType;
  lifetimeSeconds: number;
  secret: string;
  now?: number;
};

type VerifyTaskapiMcpTokenOptions = {
  token: string;
  expectedType: TaskapiMcpTokenType;
  issuer: string;
  audience: string;
  secret: string;
  now?: number;
};

export function issueTaskapiMcpToken(options: IssueTaskapiMcpTokenOptions) {
  const issuedAt = options.now ?? Math.floor(Date.now() / 1000);
  const claims: TaskapiMcpJwtClaims = {
    iss: options.issuer,
    sub: options.subject,
    aud: options.audience,
    exp: issuedAt + options.lifetimeSeconds,
    iat: issuedAt,
    client_id: options.clientId,
    scope: options.scope,
    type: options.type,
  };

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const signingInput = `${base64UrlEncodeJson(header)}.${base64UrlEncodeJson(claims)}`;
  const signature = signTaskapiMcpToken(signingInput, options.secret);

  return `${signingInput}.${signature}`;
}

export function verifyTaskapiMcpToken(options: VerifyTaskapiMcpTokenOptions) {
  const [encodedHeader, encodedClaims, encodedSignature] =
    options.token.split('.');

  if (!encodedHeader || !encodedClaims || !encodedSignature) {
    throw invalidToken('Malformed token.');
  }

  const signingInput = `${encodedHeader}.${encodedClaims}`;
  const expectedSignature = signTaskapiMcpToken(signingInput, options.secret);

  if (
    !safeEqual(
      Buffer.from(encodedSignature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8'),
    )
  ) {
    throw invalidToken('Invalid token signature.');
  }

  const claims = parseTaskapiMcpClaims(encodedClaims);
  const now = options.now ?? Math.floor(Date.now() / 1000);

  if (claims.type !== options.expectedType) {
    throw invalidGrant('Invalid token type.');
  }

  if (claims.iss !== options.issuer) {
    throw invalidToken('Unexpected token issuer.');
  }

  if (claims.aud !== options.audience) {
    throw invalidToken('Unexpected token audience.');
  }

  if (claims.exp <= now) {
    throw invalidToken('Token has expired.');
  }

  return claims;
}

function signTaskapiMcpToken(input: string, secret: string) {
  return createHmac('sha256', secret).update(input).digest('base64url');
}

function base64UrlEncodeJson(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function parseTaskapiMcpClaims(encodedClaims: string): TaskapiMcpJwtClaims {
  let value: unknown;

  try {
    value = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8'));
  } catch {
    throw invalidToken('Malformed token payload.');
  }

  if (typeof value !== 'object' || value === null) {
    throw invalidToken('Malformed token payload.');
  }

  const claims = value as Record<string, unknown>;
  const requiredStringFields = ['iss', 'sub', 'aud', 'client_id', 'scope', 'type'];

  for (const field of requiredStringFields) {
    if (typeof claims[field] !== 'string' || claims[field].length === 0) {
      throw invalidToken(`Token field ${field} is invalid.`);
    }
  }

  if (typeof claims.exp !== 'number' || typeof claims.iat !== 'number') {
    throw invalidToken('Token timestamps are invalid.');
  }

  if (claims.type !== 'access' && claims.type !== 'refresh') {
    throw invalidToken('Token type is invalid.');
  }

  return claims as unknown as TaskapiMcpJwtClaims;
}

function safeEqual(left: Buffer, right: Buffer) {
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}

function invalidToken(message: string) {
  return new InvalidTokenError(message);
}

function invalidGrant(message: string) {
  return new InvalidGrantError(message);
}
