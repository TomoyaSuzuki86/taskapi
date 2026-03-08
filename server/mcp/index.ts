import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TaskapiMutationUseCases } from '../../functions/src/application/taskapi-mutation-use-cases';
import { TaskapiQueryService } from '../../functions/src/application/taskapi-query-service';
import { getAdminFirestore } from '../api/firebase-admin';
import { resolveTaskapiMcpUid } from './taskapi-mcp-config';
import { createTaskapiMcpServer } from './taskapi-mcp-server';

async function main() {
  const firestore = getAdminFirestore();
  const server = createTaskapiMcpServer({
    uid: resolveTaskapiMcpUid(),
    mutationUseCases: new TaskapiMutationUseCases(firestore),
    queryService: new TaskapiQueryService(firestore),
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('taskapi MCP server running on stdio');
}

main().catch((error) => {
  console.error('taskapi MCP server failed:', error);
  process.exit(1);
});
