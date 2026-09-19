// ============================================================
// AGENTS ROUTER — Real Prisma + Redis pub/sub for live map
// Gracefully falls back to mock data if DB is unavailable
// ============================================================

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import prisma from '@ground-os/database';
import IORedis from 'ioredis';

const router = Router();

// ── Redis pub/sub for live location broadcast ──────────────
let redisPublisher: IORedis | null = null;

function getRedisPublisher(): IORedis | null {
  if (redisPublisher) return redisPublisher;
  try {
    redisPublisher = new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
    redisPublisher.on('error', (err) => {
      console.warn('[Agents] Redis pub/sub unavailable:', err.message);
    });
    return redisPublisher;
  } catch {
    return null;
  }
}

// ── Single Real Agent fallback ─────────────────────────
const mockAgents = [
  {
    id: 'agt-nilesh-01',
    name: 'Nilesh Somnawane',
    firstName: 'Nilesh',
    lastName: 'Somnawane',
    phone: '+91 98765 43210',
    email: 'nilesh@lifestylehomes.in',
    role: 'FIELD_SALES_EXECUTIVE',
    status: 'ONLINE',
    territory: 'Andheri West',
    lat: 19.1236,
    lng: 72.8371,
    location: {
      latitude: 19.1236,
      longitude: 72.8371,
      accuracy: 4.5,
      address: 'Andheri West, Mumbai',
      timestamp: new Date().toISOString(),
    },
    todayStats: {
      assignedVisits: 0,
      completedVisits: 0,
      meetingsHeld: 0,
      activeMeetingMinutes: 0,
      qualityScore: 92,
      distanceTravelledKm: 0,
    },
  }
];

function getOrgId(req: AuthenticatedRequest): string {
  return (req as any).user?.orgId || 'cmu6rccxv0000m5096k26az1d';
}

// ── GET /api/v1/agents ─────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { status } = req.query;

  try {
    const where: any = { organizationId: orgId };
    if (status) where.status = status;

    const agents = await prisma.agent.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true } },
      },
      orderBy: { user: { firstName: 'asc' } },
    });

    // Get today's stats for each agent
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agentsWithStats = await Promise.all(agents.map(async (agent) => {
      const [assignedVisits, completedVisits, meetingsHeld] = await Promise.all([
        prisma.visit.count({ where: { agentId: agent.id, scheduledAt: { gte: today } } }),
        prisma.visit.count({ where: { agentId: agent.id, scheduledAt: { gte: today }, status: 'COMPLETED' } }),
        prisma.meeting.count({ where: { agentId: agent.id, startedAt: { gte: today } } }),
      ]);

      return {
        id: agent.id,
        userId: agent.userId,
        name: `${agent.user.firstName} ${agent.user.lastName}`,
        firstName: agent.user.firstName,
        lastName: agent.user.lastName,
        territory: agent.territory || 'Andheri West',
        phone: agent.phone,
        email: agent.user.email,
        role: agent.user.role,
        status: agent.status || 'ONLINE',
        avatarUrl: agent.user.avatarUrl,
        lat: agent.currentLatitude || 19.1236,
        lng: agent.currentLongitude || 72.8371,
        location: agent.currentLatitude && agent.currentLongitude ? {
          latitude: agent.currentLatitude,
          longitude: agent.currentLongitude,
          timestamp: agent.lastSeenAt?.toISOString(),
        } : {
          latitude: 19.1236,
          longitude: 72.8371,
          timestamp: new Date().toISOString(),
        },
        todayStats: { assignedVisits, completedVisits, meetingsHeld },
      };
    }));

    if (agentsWithStats.length > 0) {
      return res.json({ success: true, data: agentsWithStats });
    }
    return res.json({ success: true, data: mockAgents });
  } catch (err) {
    console.warn('[Agents] DB unavailable, using default agent:', (err as Error).message);
    return res.json({ success: true, data: mockAgents, _mock: true });
  }
});

// ── GET /api/v1/agents/:agentId ───────────────────────────
router.get('/:agentId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const agent = await prisma.agent.findUnique({
      where: { id: req.params.agentId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true } },
      },
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Get today's visits route
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisits = await prisma.visit.findMany({
      where: { agentId: agent.id, scheduledAt: { gte: today } },
      include: { customer: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { scheduledAt: 'asc' },
    });

    return res.json({
      success: true,
      data: {
        id: agent.id,
        name: `${agent.user.firstName} ${agent.user.lastName}`,
        phone: agent.phone,
        email: agent.user.email,
        role: agent.user.role,
        status: agent.status || 'OFFLINE',
        location: agent.currentLatitude ? {
          latitude: agent.currentLatitude,
          longitude: agent.currentLongitude,
          timestamp: agent.lastSeenAt?.toISOString(),
        } : null,
        route: todayVisits.map(v => ({
          id: v.id,
          customer: `${v.customer.firstName} ${v.customer.lastName}`,
          status: v.status,
          scheduledAt: v.scheduledAt?.toISOString() || '',
        })),
      },
    });
  } catch (err) {
    console.warn('[Agents] DB unavailable, using mock:', (err as Error).message);
    const agent = mockAgents.find(a => a.id === req.params.agentId) || mockAgents[0];
    return res.json({ success: true, data: agent, _mock: true });
  }
});

// ── POST /api/v1/agents/:agentId/location ─────────────────
// Agent GPS heartbeat — persists to DB + broadcasts via Redis
router.post('/:agentId/location', async (req: AuthenticatedRequest, res: Response) => {
  const { latitude, longitude, accuracy, address } = req.body;
  const agentId = req.params.agentId;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'latitude and longitude required' });
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const acc = parseFloat(accuracy) || 5.0;

    // Persist to DB
  try {
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        currentLatitude: lat,
        currentLongitude: lng,
        lastSeenAt: new Date(),
        status: 'ONLINE',
      },
    });

    // Also record in AgentLocation history
    await prisma.agentLocation.create({
      data: {
        agentId,
        latitude: lat,
        longitude: lng,
        accuracy: acc,
      },
    });
  } catch (err) {
    // Non-fatal — update in-memory mock at least
    const agent = mockAgents.find(a => a.id === agentId);
    if (agent) {
      agent.location = { latitude: lat, longitude: lng, accuracy: acc, address: address || agent.location.address, timestamp: new Date().toISOString() };
    }
    console.warn('[Agents] DB unavailable for location update:', (err as Error).message);
  }

  // Broadcast to realtime gateway via Redis pub/sub
  const locationPayload = JSON.stringify({
    type: 'AGENT_LOCATION_UPDATE',
    agentId,
    latitude: lat,
    longitude: lng,
    accuracy: acc,
    address,
    timestamp: new Date().toISOString(),
  });

  try {
    const pub = getRedisPublisher();
    if (pub) {
      await pub.publish('agent-locations', locationPayload);
    }
  } catch {
    // Non-fatal
  }

  return res.json({ success: true, message: 'Location updated', data: { latitude: lat, longitude: lng, accuracy: acc, timestamp: new Date().toISOString() } });
});

// ── POST /api/v1/agents/:agentId/status ───────────────────
router.post('/:agentId/status', async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['OFFLINE', 'ONLINE', 'EN_ROUTE', 'AT_LOCATION', 'IN_MEETING'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status. Use: ${validStatuses.join(', ')}` });
  }

  try {
    const agent = await prisma.agent.update({
      where: { id: req.params.agentId },
      data: { status: status as any },
      select: { id: true, userId: true, status: true },
    });
    return res.json({ success: true, message: 'Status updated', data: agent });
  } catch (err) {
    console.warn('[Agents] Status update mock:', (err as Error).message);
    const agent = mockAgents.find(a => a.id === req.params.agentId);
    if (agent) agent.status = status;
    return res.json({ success: true, message: 'Status updated', data: agent, _mock: true });
  }
});

export default router;
