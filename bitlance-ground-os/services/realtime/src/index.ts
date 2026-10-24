// ============================================================
// BITLANCE GROUND OS — Real-time WebSocket Gateway
// Direct in-memory WebSocket broadcasting with HTTP broadcast API
// Zero Redis dependency
// ============================================================

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const PORT = parseInt(process.env.REALTIME_PORT || '4001', 10);

interface ConnectedClient {
  ws: WebSocket;
  organizationId?: string;
  agentId?: string;
}

const clients = new Map<WebSocket, ConnectedClient>();

// ── Broadcast to all connected clients ─────────────────────
function broadcast(data: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const [ws, client] of clients) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      if (data.organizationId && client.organizationId && client.organizationId !== data.organizationId) {
        continue;
      }
      try {
        ws.send(payload);
      } catch {
        clients.delete(ws);
      }
    }
  }
}

// ── HTTP Server (serves /broadcast for backend API and /health) ─────
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // HTTP broadcast endpoint for services (e.g. api) to push events to WebSocket clients
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        broadcast(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, clients: clients.size }));
      } catch (err: any) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connectedClients: clients.size }));
    return;
  }

  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server });

// ── WebSocket connection handler ────────────────────────────
wss.on('connection', (ws) => {
  const client: ConnectedClient = { ws };
  clients.set(ws, client);
  console.log(`🔌 Client connected (Total: ${clients.size})`);

  // Send initial state snapshot
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    serverTime: new Date().toISOString(),
    activeAgentsOnline: clients.size,
  }));

  ws.on('message', (message: Buffer) => {
    try {
      const data = JSON.parse(message.toString());

      // Handle client auth/subscription
      if (data.type === 'AUTH') {
        const token = data.token;
        if (!token) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Token required' }));
          return;
        }
        try {
          const secret = process.env.JWT_SECRET || 'bitlance-ground-os-jwt-secret-key-development-mode-12345';
          const decoded = jwt.verify(token, secret) as any;
          client.organizationId = decoded.orgId || decoded.organizationId;
          client.agentId = decoded.sub || decoded.id;
          console.log(`[Realtime] Client authenticated: org=${client.organizationId}, agent=${client.agentId}`);
        } catch {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'Invalid token' }));
        }
        return;
      }

      // Require auth for other messages
      if (!client.organizationId) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Unauthenticated' }));
        return;
      }

      // Agent pushes location from PWA — forward to dashboard clients
      if (data.type === 'AGENT_LOCATION_UPDATE') {
        broadcast({ ...data, organizationId: client.organizationId }, ws);
        return;
      }

      // Visit status changes from Agent PWA
      if (data.type === 'VISIT_STATUS_CHANGED') {
        broadcast({ ...data, organizationId: client.organizationId }, ws);
        return;
      }
    } catch (err) {
      console.error('[Realtime] Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌 Client disconnected (Total: ${clients.size})`);
  });

  ws.on('error', (err) => {
    console.error('[Realtime] WS error:', err.message);
    clients.delete(ws);
  });
});

setInterval(() => {
  if (clients.size === 0) return;
  broadcast({ type: 'HEARTBEAT', timestamp: new Date().toISOString(), connectedClients: clients.size });
}, 5000);

server.listen(PORT, () => {
  console.log(`📡 Bitlance Ground OS Realtime Gateway running on ws://localhost:${PORT} and http://localhost:${PORT}`);
});
