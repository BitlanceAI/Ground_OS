// ============================================================
// BITLANCE GROUND OS — Real-time WebSocket Gateway
// Subscribes to Redis pub/sub for real agent events
// Falls back to simulated telemetry when Redis unavailable
// ============================================================

import { WebSocketServer, WebSocket } from 'ws';
import IORedis from 'ioredis';
import jwt from 'jsonwebtoken';

const PORT = parseInt(process.env.REALTIME_PORT || '4001', 10);
const wss = new WebSocketServer({ port: PORT });

console.log(`📡 Bitlance Ground OS Realtime Gateway running on ws://localhost:${PORT}`);

interface ConnectedClient {
  ws: WebSocket;
  organizationId?: string;
  agentId?: string;
}

const clients = new Map<WebSocket, ConnectedClient>();

// ── Redis subscriber ────────────────────────────────────────
let subscriber: IORedis | null = null;
let usingMockTelemetry = false;

function initRedisSubscriber() {
  try {
    subscriber = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => times > 3 ? null : Math.min(times * 500, 2000),
    });

    subscriber.on('ready', () => {
      console.log('[Realtime] ✅ Redis connected — listening on agent-locations, visit-events channels');
      usingMockTelemetry = false;

      // Subscribe to all real-time channels
      subscriber!.subscribe('agent-locations', 'visit-events', 'meeting-events', 'ai-alerts', (err) => {
        if (err) {
          console.error('[Realtime] Redis subscribe error:', err);
          usingMockTelemetry = true;
        }
      });
    });

    subscriber.on('message', (channel: string, message: string) => {
      try {
        const data = JSON.parse(message);

        // Broadcast to all connected dashboard clients
        broadcast({ ...data, _channel: channel });
      } catch (err) {
        console.error('[Realtime] Failed to parse Redis message:', err);
      }
    });

    subscriber.on('error', (err) => {
      if (!usingMockTelemetry) {
        console.warn(`[Realtime] Redis unavailable — falling back to simulated telemetry: ${err.message}`);
        usingMockTelemetry = true;
      }
    });
  } catch (err) {
    console.warn('[Realtime] Could not connect to Redis, using mock telemetry:', (err as Error).message);
    usingMockTelemetry = true;
  }
}

// ── Broadcast to all connected clients ─────────────────────
function broadcast(data: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const [ws, client] of clients) {
    if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
      if (data.organizationId && client.organizationId !== data.organizationId) continue;
      try {
        ws.send(payload);
      } catch (err) {
        clients.delete(ws);
      }
    }
  }
}

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
    redisConnected: !usingMockTelemetry,
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
        } catch (err) {
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

// Initialize Redis
initRedisSubscriber();
