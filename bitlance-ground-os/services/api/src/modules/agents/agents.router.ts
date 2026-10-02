// ============================================================
// AGENTS ROUTER — Real Prisma + Redis pub/sub for live map
// Gracefully falls back to mock data if DB is unavailable
// ============================================================

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
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

async function getOrgId(req: AuthenticatedRequest): Promise<string> {
  if (req.organizationId) return req.organizationId;
  if ((req as any).user?.orgId) return (req as any).user.orgId;
  if ((req as any).user?.organizationId) return (req as any).user.organizationId;
  try {
    const firstOrg = await prisma.organization.findFirst();
    if (firstOrg) return firstOrg.id;
  } catch {}
  return 'cmupkjhms000018kn5lxj20i1';
}

// ── GET /api/v1/agents ─────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = await getOrgId(req);
  const { status } = req.query;

  try {
    const where: any = { organizationId: orgId };
    if (status) where.status = status;

    const agents = await prisma.agent.findMany({
      where,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true, isActive: true } },
      },
      orderBy: { user: { firstName: 'asc' } },
    });

    // Get stats for each agent
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const agentsWithStats = await Promise.all(agents.map(async (agent) => {
      const [
        assignedVisits,
        completedVisits,
        totalVisits,
        leadsTapped,
        meetingsHeld,
        scheduledMeetings,
        totalMeetings,
      ] = await Promise.all([
        prisma.visit.count({ where: { agentId: agent.id, scheduledAt: { gte: today } } }),
        prisma.visit.count({ where: { agentId: agent.id, status: 'COMPLETED' } }),
        prisma.visit.count({ where: { agentId: agent.id } }),
        prisma.visit.count({ where: { agentId: agent.id, leadTapped: true } }),
        prisma.meeting.count({ where: { agentId: agent.id, startedAt: { gte: today } } }),
        prisma.meeting.count({ where: { agentId: agent.id, adminScheduled: true } }),
        prisma.meeting.count({ where: { agentId: agent.id } }),
      ]);

      const conversionRate = totalVisits > 0 ? Math.round((leadsTapped / totalVisits) * 100) : 0;

      return {
        id: agent.id,
        userId: agent.userId,
        name: `${agent.user.firstName} ${agent.user.lastName}`.trim(),
        firstName: agent.user.firstName,
        lastName: agent.user.lastName,
        territory: agent.territory || 'Delhi NCR',
        phone: agent.phone || '+91 98765 43210',
        email: agent.user.email,
        role: agent.user.role,
        status: agent.status || 'ONLINE',
        isActive: agent.user.isActive ?? true,
        employeeCode: agent.employeeCode || 'AG001',
        avatarUrl: agent.user.avatarUrl,
        lat: agent.currentLatitude || 28.5921,
        lng: agent.currentLongitude || 77.0460,
        location: agent.currentLatitude && agent.currentLongitude ? {
          latitude: agent.currentLatitude,
          longitude: agent.currentLongitude,
          timestamp: agent.lastSeenAt?.toISOString() || new Date().toISOString(),
        } : {
          latitude: 28.5921,
          longitude: 77.0460,
          timestamp: new Date().toISOString(),
        },
        todayStats: {
          assignedVisits,
          completedVisits,
          totalVisits,
          leadsTapped,
          meetingsHeld,
          scheduledMeetings,
          totalMeetings,
          conversionRate,
        },
        stats: {
          totalVisits,
          completedVisits,
          leadsTapped,
          scheduledMeetings,
          totalMeetings,
          conversionRate,
        },
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

// ── POST /api/v1/agents (Create new field agent with login credentials) ────
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = await getOrgId(req);
  const { firstName, lastName, email, password, phone, territory, employeeCode } = req.body;

  if (!email || !password || !firstName) {
    return res.status(400).json({ success: false, message: 'First name, email, and password are required' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: `An account with email ${cleanEmail} already exists.` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        organizationId: orgId,
        email: cleanEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: (lastName || '').trim(),
        role: 'AGENT',
        isActive: true,
      },
    });

    const agent = await prisma.agent.create({
      data: {
        organizationId: orgId,
        userId: user.id,
        phone: phone ? phone.trim() : '+91 98765 43210',
        territory: territory ? territory.trim() : 'Delhi NCR',
        employeeCode: employeeCode ? employeeCode.trim() : `AG${String(Math.floor(100 + Math.random() * 900))}`,
        status: 'ONLINE',
        currentLatitude: 28.5921,
        currentLongitude: 77.0460,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Agent ${firstName} created successfully with login credentials`,
      data: {
        id: agent.id,
        userId: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: agent.phone,
        territory: agent.territory,
        employeeCode: agent.employeeCode,
        status: agent.status,
        isActive: user.isActive,
      },
    });
  } catch (err: any) {
    console.error('[Agents] Create error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to create agent' });
  }
});

// ── PUT /api/v1/agents/:agentId (Update agent details & credentials) ───
router.put('/:agentId', async (req: AuthenticatedRequest, res: Response) => {
  const { agentId } = req.params;
  const { firstName, lastName, email, password, phone, territory, employeeCode, isActive, status } = req.body;

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const userUpdate: any = {};
    if (firstName) userUpdate.firstName = firstName.trim();
    if (lastName !== undefined) userUpdate.lastName = lastName.trim();
    if (email) userUpdate.email = email.toLowerCase().trim();
    if (isActive !== undefined) userUpdate.isActive = Boolean(isActive);
    if (password && password.trim().length >= 4) {
      userUpdate.passwordHash = await bcrypt.hash(password.trim(), 10);
    }

    if (Object.keys(userUpdate).length > 0) {
      await prisma.user.update({
        where: { id: agent.userId },
        data: userUpdate,
      });
    }

    const agentUpdate: any = {};
    if (phone !== undefined) agentUpdate.phone = phone;
    if (territory !== undefined) agentUpdate.territory = territory;
    if (employeeCode !== undefined) agentUpdate.employeeCode = employeeCode;
    if (status !== undefined) agentUpdate.status = status;

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: agentUpdate,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true } },
      },
    });

    return res.json({
      success: true,
      message: 'Agent profile updated successfully',
      data: {
        id: updatedAgent.id,
        userId: updatedAgent.userId,
        name: `${updatedAgent.user.firstName} ${updatedAgent.user.lastName}`.trim(),
        firstName: updatedAgent.user.firstName,
        lastName: updatedAgent.user.lastName,
        email: updatedAgent.user.email,
        phone: updatedAgent.phone,
        territory: updatedAgent.territory,
        employeeCode: updatedAgent.employeeCode,
        status: updatedAgent.status,
        isActive: updatedAgent.user.isActive,
      },
    });
  } catch (err: any) {
    console.error('[Agents] Update error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to update agent' });
  }
});

// ── PATCH /api/v1/agents/:agentId/toggle-active (Pause or resume agent login) ───
router.patch('/:agentId/toggle-active', async (req: AuthenticatedRequest, res: Response) => {
  const { agentId } = req.params;

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const newActiveState = !agent.user.isActive;

    const updatedUser = await prisma.user.update({
      where: { id: agent.userId },
      data: { isActive: newActiveState },
    });

    if (!newActiveState) {
      await prisma.agent.update({
        where: { id: agentId },
        data: { status: 'OFFLINE' },
      });
    }

    return res.json({
      success: true,
      message: newActiveState ? 'Agent login access enabled' : 'Agent login access paused / revoked',
      isActive: updatedUser.isActive,
    });
  } catch (err: any) {
    console.error('[Agents] Toggle active error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to toggle agent access' });
  }
});

// ── DELETE /api/v1/agents/:agentId (Delete agent & credentials) ───
router.delete('/:agentId', async (req: AuthenticatedRequest, res: Response) => {
  const { agentId } = req.params;

  try {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { user: true },
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    const userId = agent.userId;

    await prisma.$transaction([
      prisma.agentLocation.deleteMany({ where: { agentId } }),
      prisma.visit.deleteMany({ where: { agentId } }),
      prisma.meeting.deleteMany({ where: { agentId } }),
      prisma.agent.delete({ where: { id: agentId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return res.json({
      success: true,
      message: `Agent ${agent.user.firstName} ${agent.user.lastName} successfully deleted.`,
    });
  } catch (err: any) {
    console.error('[Agents] Delete error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to delete agent' });
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
