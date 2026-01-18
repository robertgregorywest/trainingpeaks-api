#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { TrainingPeaksClient } from '../index.js';
import { createMcpServer } from './server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function main() {
  const app = express();
  app.use(express.json());

  const client = new TrainingPeaksClient();
  const server = createMcpServer(client);

  // Create the HTTP transport
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
  });

  // Connect server to transport
  await server.connect(transport);

  // Health check / info endpoint
  app.get('/', (_req, res) => {
    res.json({
      name: 'trainingpeaks-mcp',
      version: '0.1.0',
      status: 'running',
      mcp_endpoint: '/mcp',
      usage: 'POST JSON-RPC requests to /mcp',
    });
  });

  // MCP endpoint info for GET requests
  app.get('/mcp', (_req, res) => {
    res.json({
      error: 'Method not allowed',
      message: 'MCP endpoint only accepts POST requests with JSON-RPC payload',
      example: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
        },
        body: {
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 1,
        },
      },
    });
  });

  // Handle MCP requests at /mcp endpoint
  app.post('/mcp', async (req, res) => {
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('Error handling MCP request:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error',
        },
        id: req.body?.id ?? null,
      });
    }
  });

  // Handle cleanup on exit
  process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await client.close();
    process.exit(0);
  });

  app.listen(PORT, () => {
    console.log(`TrainingPeaks MCP HTTP server running on port ${PORT}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  });
}

main().catch((error) => {
  console.error('Failed to start HTTP server:', error);
  process.exit(1);
});
