// ============================================================
// BITLANCE GROUND OS — Real-time WebSocket Gateway
// Streams agent GPS coordinates, visit events, and live AI alerts
// ============================================================

import { WebSocketServer, WebSocket } from 'ws';

const PORT = parseInt(process.env.REALTIME_PORT || '4001', 10);
const wss = new WebSocketServer({ port: PORT });

console.log(`📡 Bitlance Ground OS Realtime Gateway running on ws://localhost:${PORT}`);

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🔌 Client connected to Realtime Gateway (Total: ${clients.size})`);

  // Send initial welcome & live state snapshot
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    serverTime: new Date().toISOString(),
    activeAgentsOnline: 14,
  }));

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data.type);

      // Broadcast agent location updates or events to all CRM dashboards
      if (data.type === 'AGENT_LOCATION_UPDATE' || data.type === 'VISIT_STATUS_CHANGED') {
        const payload = JSON.stringify(data);
        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(payload);
          }
        }
      }
    } catch (e) {
      console.error('Error handling WebSocket message', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🔌 Client disconnected (Total: ${clients.size})`);
  });
});

// Periodic simulated GPS heartbeat broadcast
setInterval(() => {
  if (clients.size === 0) return;
  const heartbeatPayload = JSON.stringify({
    type: 'LIVE_TELEMETRY_PULSE',
    timestamp: new Date().toISOString(),
    agents: [
      { id: 'agt-aman-01', lat: 28.5355 + (Math.random() - 0.5) * 0.0004, lng: 77.3910 + (Math.random() - 0.5) * 0.0004, status: 'IN_MEETING' },
      { id: 'agt-priya-02', lat: 28.5390 + (Math.random() - 0.5) * 0.0008, lng: 77.3820 + (Math.random() - 0.5) * 0.0008, status: 'EN_ROUTE' },
      { id: 'agt-rohit-03', lat: 28.5440 + (Math.random() - 0.5) * 0.0003, lng: 77.4010 + (Math.random() - 0.5) * 0.0003, status: 'ONLINE' },
    ]
  });

  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(heartbeatPayload);
    }
  }
}, 5000);
