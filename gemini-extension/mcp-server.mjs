import { startServer } from '@workflow-pack/mcp-server';

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
