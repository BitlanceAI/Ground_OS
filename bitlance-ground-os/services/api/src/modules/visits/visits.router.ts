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

// ── Mock fallback data ─────────────────────────────────────
const mockVisits = [
  {
    id: 'vis-001',
    agentId: 'agt-aman-01',
    agentName: 'Aman Sharma',
    customerId: 'cust-rajesh-01',
    customerName: 'Rajesh Kumar',
    businessName: 'Rajesh Electronics & Appliances',
    destination: {
      address: 'Shop 14, Galaxy Plaza, Sector 62, Noida',
      latitude: 28.5355,
      longitude: 77.3910,
    },
    status: 'IN_MEETING',
    scheduledAt: new Date(Date.now() - 3600000).toISOString(),
    arrivedAt: new Date(Date.now() - 2400000).toISOString(),
    meetingStartedAt: new Date(Date.now() - 2000000).toISOString(),
    meetingId: 'mtg-001',
    geofenceVerified: true,
    distanceAtCheckInMeters: 8,
    purpose: '3BHK Buyer Consultation & Floorplan Walkthrough',
    notes: 'Inquired via WhatsApp Meta campaign. Looking for self-use property.',
  },
  {
    id: 'vis-002',
    agentId: 'agt-priya-02',
    agentName: 'Priya Mehta',
    customerId: 'cust-pooja-02',
    customerName: 'Pooja Gupta',
    businessName: 'Fintech Solutions',
    destination: {
      address: 'Tower 4, Advant Navis, Sector 142, Noida',
      latitude: 28.5390,
      longitude: 77.3820,
    },
    status: 'EN_ROUTE',
    scheduledAt: new Date(Date.now() + 1800000).toISOString(),
    geofenceVerified: false,
    purpose: 'Luxury High-Rise Presentation & ROI Breakdown',
  }
];

// ── Helpers ────────────────────────────────────────────────
function getOrgId(req: AuthenticatedRequest): string {
  return (req as any).user?.orgId || 'org-demo-001';
}

// ── GET /api/v1/visits ─────────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { agentId, status, date } = req.query;

  try {
    const where: any = { organizationId: orgId };
    if (agentId) where.agentId = agentId;
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
    console.warn('[Visits] DB unavailable, using mock data:', (err as Error).message);
    const filtered = agentId ? mockVisits.filter(v => v.agentId === agentId) : mockVisits;
    return res.json({ success: true, data: filtered, _mock: true });
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

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    return res.json({ success: true, data: visit });
  } catch (err) {
    console.warn('[Visits] DB unavailable, using mock:', (err as Error).message);
    const visit = mockVisits.find(v => v.id === req.params.visitId) || mockVisits[0];
    return res.json({ success: true, data: visit, _mock: true });
  }
});

// ── POST /api/v1/visits (Create visit) ────────────────────
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { agentId, customerId, scheduledAt, purpose, notes, destinationLat, destinationLng, destinationAddress } = req.body;

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
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

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
    console.warn('[Visits] Arrive failed, mock response:', (err as Error).message);
    return res.json({
      success: true,
      data: { ...mockVisits[0], status: 'ARRIVED', arrivedAt: new Date().toISOString() },
      geofenceVerified: true,
      distanceAtCheckInMeters: 12,
      _mock: true,
    });
  }
});

// ── POST /api/v1/visits/:visitId/start-meeting ────────────
router.post('/:visitId/start-meeting', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);

  try {
    const visit = await prisma.visit.findUnique({ where: { id: req.params.visitId } });
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

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
    console.warn('[Visits] Start meeting failed, mock response:', (err as Error).message);
    return res.json({
      success: true,
      data: {
        visit: { ...mockVisits[0], status: 'MEETING_STARTED' },
        meeting: { id: 'mtg-mock-001', status: 'STARTED' },
      },
      _mock: true,
    });
  }
});

// ── POST /api/v1/visits/:visitId/status ───────────────────
router.post('/:visitId/status', async (req: AuthenticatedRequest, res: Response) => {
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
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

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
    console.warn('[Visits] Status update, mock:', (err as Error).message);
    return res.json({ success: true, data: { ...mockVisits[0], status }, _mock: true });
  }
});

export default router;
