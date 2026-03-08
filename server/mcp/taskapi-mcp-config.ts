export function resolveTaskapiMcpUid(env: NodeJS.ProcessEnv = process.env) {
  const uid = env.TASKAPI_MCP_UID?.trim();

  if (!uid) {
    throw new Error(
      'TASKAPI_MCP_UID is required for the MCP server. Set it to the single-user owner uid.',
    );
  }

  return uid;
}
