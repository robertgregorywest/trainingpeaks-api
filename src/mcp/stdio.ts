#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TrainingPeaksClient } from '../index.js';
import { createMcpServer } from './server.js';

async function main() {
  console.error('[trainingpeaks-mcp] Starting...');

  let client: TrainingPeaksClient;
  try {
    client = new TrainingPeaksClient();
  } catch (error) {
    console.error('[trainingpeaks-mcp] Failed to create client:', error);
    process.exit(1);
  }

  const server = createMcpServer(client);
  const transport = new StdioServerTransport();

  process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await client.close();
    process.exit(0);
  });

  await server.connect(transport);
  console.error('[trainingpeaks-mcp] Server connected.');
}

main().catch((error) => {
  console.error('[trainingpeaks-mcp] Fatal:', error);
  process.exit(1);
});
