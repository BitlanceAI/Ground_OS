// ============================================================
// VISITS ROUTER — Real Prisma + visit state machine
// Gracefully falls back to mock data if DB is unavailable
// ============================================================

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getMapsProvider } from '../../adapters/maps.adapter';
import { eventBus } from '../../events/event-bus';
import prisma from '@ground-os/database';

const router = Router();
const mapsProvider = getMapsProvider();

// ── Helpers ────────────────────────────────────────────────
function getOrgId(req: AuthenticatedRequest): string {
  return req.organizationId || (req as any).user?.orgId || (req as any).user?.organizationId || 'cmupkjhms000018kn5lxj20i1';
}

// ── GET /api/v1/visits ─────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { agentId, status, date } = req.query;

  try {
    const where: any = { organizationId: orgId };
    const userRole = (req as any).user?.role;
    const userAgentId = (req as any).user?.agentId;

    if (userRole === 'AGENT' && userAgentId) {
      where.agentId = userAgentId;
    } else if (agentId) {
      where.agentId = agentId;
    }
    if (status) where.status = status;
    if (date) {
      const day = new Date(date as string);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      where.scheduledAt = { gte: day, lt: nextDay };
    }

    const visits = await prisma.visit.findMany({
      where,
      include: {
        agent: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        customer: { select: { id: true, firstName: true, lastName: true, businessName: true, phone: true } },
        meetings: { select: { id: true, status: true, durationSeconds: true }, take: 1 },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 50,
    });

    return res.json({ success: true, data: visits });
  } catch (err) {
    console.error('[Visits] DB error:', (err as Error).message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── GET /api/v1/visits/:visitId ────────────────────────────
router.get('/:visitId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const visit = await prisma.visit.findUnique({
      where: { id: req.params.visitId },
      include: {
        agent: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        customer: { select: { id: true, firstName: true, lastName: true, businessName: true, phone: true, email: true } },
        meetings: true,
        visitEvents: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!visit || visit.organizationId !== req.organizationId) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    return res.json({ success: true, data: visit });
  } catch (err) {
    console.error('[Visits] DB error:', (err as Error).message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /api/v1/visits (Create visit) ────────────────────
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  let { agentId, customerId, scheduledAt, purpose, notes, destinationLat, destinationLng, destinationAddress } = req.body;
  if (!agentId && (req as any).user?.agentId) {
    agentId = (req as any).user.agentId;
  }

  if (!agentId || !customerId || !scheduledAt) {
    return res.status(400).json({ success: false, message: 'agentId, customerId, and scheduledAt are required' });
  }

  try {
    const visit = await prisma.visit.create({
      data: {
        organizationId: orgId,
        agentId,
        customerId,
        scheduledAt: new Date(scheduledAt),
        notes,
        destinationLat: destinationLat ? parseFloat(destinationLat) : null,
        destinationLng: destinationLng ? parseFloat(destinationLng) : null,
        destination: destinationAddress || null,
        status: 'ASSIGNED',
      },
    });

    // Emit event
    await eventBus.agentAssigned(orgId, {
      agentId,
      customerId,
      visitId: visit.id,
      scheduledAt: visit.scheduledAt?.toISOString() || new Date().toISOString(),
    });

    return res.status(201).json({ success: true, data: visit });
  } catch (err) {
    console.error('[Visits] Create failed:', (err as Error).message);
    return res.status(500).json({ success: false, message: 'Failed to create visit' });
  }
});

// ── POST /api/v1/visits/:visitId/arrive ───────────────────
// Called by Agent PWA when agent arrives at destination
router.post('/:visitId/arrive', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { latitude, longitude, accuracy } = req.body;

  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.visitId } });
    if (!visit || visit.organizationId !== orgId) return res.status(404).json({ success: false, message: 'Visit not found' });

    // Geofence check
    let geofenceVerified = false;
    let distanceAtCheckInMeters: number | null = null;

    if (visit.destinationLat && visit.destinationLng && latitude && longitude) {
      const distance = await mapsProvider.calculateDistance(
        { lat: parseFloat(latitude), lng: parseFloat(longitude) },
        { lat: visit.destinationLat, lng: visit.destinationLng }
      );
      distanceAtCheckInMeters = distance;
      geofenceVerified = distance <= 200; // 200m geofence radius
      if (!geofenceVerified) {
        return res.status(403).json({ success: false, message: 'Geofence check failed' });
      }
    } else {
      // No destination set — auto-verify
      geofenceVerified = true;
    }

    const updated = await prisma.visit.update({
      where: { id: req.params.visitId },
      data: {
        status: 'ARRIVED',
        arrivedAt: new Date(),
        arrivalLatitude: latitude ? parseFloat(latitude) : null,
        arrivalLongitude: longitude ? parseFloat(longitude) : null,
      },
    });

    // Record event
    await prisma.visitEvent.create({
      data: {
        visitId: visit.id,
        type: 'ARRIVED',
        payload: { geofenceVerified, distanceAtCheckInMeters, latitude, longitude, accuracy },
      },
    });

    // Emit domain event
    await eventBus.agentArrived(orgId, {
      agentId: visit.agentId,
      visitId: visit.id,
      latitude: parseFloat(latitude) || 0,
      longitude: parseFloat(longitude) || 0,
    });

    return res.json({ success: true, data: updated, geofenceVerified, distanceAtCheckInMeters });
  } catch (err) {
    console.error('[Visits] Arrive failed:', (err as Error).message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /api/v1/visits/:visitId/start-meeting ────────────
router.post('/:visitId/start-meeting', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);

  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.visitId } });
    if (!visit || visit.organizationId !== orgId) return res.status(404).json({ success: false, message: 'Visit not found' });

    // Create meeting record
    const meeting = await prisma.meeting.create({
      data: {
        organizationId: orgId,
        visitId: visit.id,
        agentId: visit.agentId,
        customerId: visit.customerId,
        status: 'STARTED',
        startedAt: new Date(),
      },
    });

    // Update visit
    await prisma.visit.update({
      where: { id: req.params.visitId },
      data: { status: 'MEETING_STARTED' },
    });

    // Record visit event
    await prisma.visitEvent.create({
      data: { visitId: visit.id, type: 'MEETING_STARTED', payload: { meetingId: meeting.id } },
    });

    // Emit event
    await eventBus.meetingStarted(orgId, {
      meetingId: meeting.id,
      agentId: visit.agentId,
      customerId: visit.customerId,
      visitId: visit.id,
    });

    return res.json({ success: true, data: { visit: { ...visit, status: 'MEETING_STARTED' }, meeting } });
  } catch (err) {
    console.error('[Visits] Start meeting failed:', (err as Error).message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ── POST /api/v1/visits/:visitId/status ───────────────────
router.post('/:visitId/status', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { status } = req.body;
  const validTransitions: Record<string, string[]> = {
    ASSIGNED: ['EN_ROUTE', 'CANCELLED'],
    EN_ROUTE: ['ARRIVED', 'CANCELLED'],
    ARRIVED: ['MEETING_STARTED', 'CANCELLED'],
    MEETING_STARTED: ['MEETING_ENDED'],
    MEETING_ENDED: ['AI_PROCESSING', 'COMPLETED'],
    AI_PROCESSING: ['REPORT_READY'],
    REPORT_READY: ['COMPLETED'],
  };

  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.visitId } });
    if (!visit || visit.organizationId !== orgId) return res.status(404).json({ success: false, message: 'Visit not found' });

    const allowed = validTransitions[visit.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${visit.status} to ${status}. Allowed: ${allowed.join(', ')}`,
      });
    }

    const updated = await prisma.visit.update({
      where: { id: req.params.visitId },
      data: { status },
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Visits] Status update failed:', (err as Error).message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


// ── PATCH /api/v1/visits/:visitId/tap-lead ─────────────────
// Agent marks a client as "lead tapped" — toggles leadTapped boolean
router.patch('/:visitId/tap-lead', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);

  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.visitId } });
    if (!visit || visit.organizationId !== orgId) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const newTapped = !visit.leadTapped;
    const updated = await prisma.visit.update({
      where: { id: req.params.visitId },
      data: {
        leadTapped: newTapped,
        leadTappedAt: newTapped ? new Date() : null,
      },
    });

    return res.json({
      success: true,
      leadTapped: newTapped,
      message: newTapped ? 'Lead marked as tapped!' : 'Lead tap removed',
      data: updated,
    });
  } catch (err) {
    console.error('[Visits] Tap lead failed:', (err as Error).message);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;

