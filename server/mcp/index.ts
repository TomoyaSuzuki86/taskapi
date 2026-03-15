import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTaskapiMcpRuntime } from './taskapi-mcp-runtime';

async function main() {
  const server = createTaskapiMcpRuntime();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('taskapi MCP server running on stdio');
}

main().catch((error) => {
  console.error('taskapi MCP server failed:', error);
  process.exit(1);
});
