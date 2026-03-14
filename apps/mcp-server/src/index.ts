/**
 * DesignBase MCP Server
 *
 * Two transports in one process:
 *   - stdio  → Claude Desktop (spawned as child process)
 *   - HTTP/SSE → Cursor and other web LLM clients (port 3334)
 *
 * Env vars:
 *   MCP_API_BASE_URL  — URL of the Next.js web app (default: http://localhost:3000)
 *   MCP_TOKEN         — DesignSystem.mcpToken for auth
 *   MCP_SYSTEM_ID     — DesignSystem.id
 *   PORT              — HTTP port for SSE transport (default: 3334)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { registerTools } from './tools/index.js';

// ── Server factory ───────────────────────────────────────────────────────────

function createMcpServer() {
  const server = new McpServer({
    name: 'designbase',
    version: '1.0.0',
  });
  registerTools(server);
  return server;
}

// ── Detect transport mode ────────────────────────────────────────────────────
// If stdin is a TTY or --http flag is passed, use HTTP/SSE.
// Otherwise default to stdio (Claude Desktop model).

const useHttp =
  process.argv.includes('--http') ||
  process.env.MCP_TRANSPORT === 'http';

if (useHttp) {
  // ── HTTP/SSE transport ─────────────────────────────────────────────────────
  const PORT = parseInt(process.env.PORT ?? '3334', 10);
  const app = express();
  app.use(express.json());

  // Map of sessionId → SSEServerTransport
  const sessions = new Map<string, SSEServerTransport>();

  app.get('/mcp/sse', async (req, res) => {
    // Validate bearer token
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token || token !== process.env.MCP_TOKEN) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const server = createMcpServer();
    const transport = new SSEServerTransport('/mcp/messages', res);
    const sessionId = transport.sessionId;
    sessions.set(sessionId, transport);

    res.on('close', () => {
      sessions.delete(sessionId);
    });

    await server.connect(transport);
  });

  app.post('/mcp/messages', async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = sessions.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    await transport.handlePostMessage(req, res, req.body);
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', transport: 'http' });
  });

  app.listen(PORT, () => {
    console.log(`DesignBase MCP server listening on port ${PORT} (HTTP/SSE)`);
  });
} else {
  // ── Stdio transport ────────────────────────────────────────────────────────
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Process stays alive via stdio
}
