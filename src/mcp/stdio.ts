#!/usr/bin/env node
import 'dotenv/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { TrainingPeaksClient } from '../index.js';
import { createMcpServer } from './server.js';

const execAsync = promisify(exec);

async function ensurePlaywrightChromium(): Promise<void> {
  console.error('[trainingpeaks-mcp] Ensuring Playwright Chromium is installed...');
  try {
    await execAsync('npx playwright install chromium');
  } catch (error) {
    console.error('[trainingpeaks-mcp] Warning: Failed to install Chromium:', error);
  }
}

async function main() {
  let client: TrainingPeaksClient;
  try {
    client = new TrainingPeaksClient();
  } catch (error) {
    console.error('[trainingpeaks-mcp] Failed to create client:', error);
    process.exit(1);
  }

  const server = createMcpServer(client);
  const transport = new StdioServerTransport();

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await client.close();
    process.exit(0);
  });

  console.error('[trainingpeaks-mcp] Connecting stdio transport...');
  await server.connect(transport);
  console.error('[trainingpeaks-mcp] Server connected.');

  // Install Playwright Chromium async after transport is live
  await ensurePlaywrightChromium();
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
