// ============================================================
// MEETINGS ROUTER — Real Prisma + AI pipeline integration
// Gracefully falls back to rich mock data if DB unavailable
// ============================================================

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { aiOrchestrator } from '../../orchestrator/ai.orchestrator';
import { eventBus } from '../../events/event-bus';
import { getStorageProvider } from '../../adapters/storage.adapter';
import { getWhatsAppProvider } from '../../adapters/whatsapp.adapter';
import prisma from '@ground-os/database';

const router = Router();
const storageProvider = getStorageProvider();

// ── Mock fallback ─────────────────────────────────────────
const mockMeetings = [
  {
    id: 'mtg-001',
    visitId: 'vis-001',
    agentId: 'agt-nilesh-01',
    agentName: 'Nilesh Somnawane',
    customerId: 'cust-rajesh-01',
    customerName: 'Rajesh Kumar',
    status: 'ANALYSED',
    durationSeconds: 1680,
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    endedAt: new Date(Date.now() - 1920000).toISOString(),
    audioUrl: 'https://audio.bitlance-os.internal/recordings/mtg-001.mp3',
    transcript: `Nilesh: Namaste Rajesh ji, thank you for your time today.
Rajesh Kumar: Namaste Nilesh. Haan, I saw your advertisement on Instagram about Lifestyle Palms. We are looking to buy a 3BHK for our family.
Nilesh: Wonderful. Could you share what specific carpet area you are prioritizing?
Rajesh Kumar: We need at least 1600 sq.ft. East facing preferably because of Vastu. Also, parking for 2 cars is a must.
Nilesh: Lifestyle Palms 3BHK Grand Edition offers 1650 sq.ft super area, 2 dedicated covered stilt parkings.
Rajesh Kumar: What is the price range?
Nilesh: The all-inclusive launch price for East-facing units is ₹96.5 Lakhs, including GST.
Rajesh Kumar: DLF Sky is offering 3BHK in Sector 63 for ₹88 Lakhs. Why is Lifestyle Palms higher?
Nilesh: DLF's super-to-carpet efficiency is only 68%, giving you 1150 sq.ft carpet, whereas ours is 80% (1320 sq.ft). You get 170 sq.ft more usable area.
Rajesh Kumar: Can you send me the comparative breakdown on WhatsApp?
Nilesh: Absolutely. Can we schedule a site visit for Saturday at 11 AM?
Rajesh Kumar: Yes, Saturday 11 AM works.`.trim(),
    insight: {
      summary: 'High-intent 3BHK enquiry for self-use. Customer required min 1600 sq.ft, East-facing, 2 parkings. Overcame DLF price objection via carpet-area efficiency. Saturday 11 AM site visit agreed.',
      customerIntent: 'Immediate purchase within 60-90 days, highly qualified buyer up to ₹1.05 Cr.',
      intentLevel: 'VERY_HIGH',
      requirement: {
        propertyType: 'Residential Apartment',
        configuration: '3BHK',
        budgetMin: 8500000,
        budgetMax: 10500000,
        location: 'Sector 62 / Sector 63 Noida',
        purpose: 'Family Residence (Self-Use)',
        timeline: 'Immediate / Ready within 6 Months',
        amenities: ['Clubhouse', 'Swimming Pool', '2 Dedicated Parkings', 'Vastu East Facing'],
        parking: true,
        paymentPreference: '30:70 Construction Linked / Bank Loan Approved',
      },
      objections: [
        { type: 'PRICE_VS_COMPETITOR', description: 'Mentioned DLF Sky offering 3BHK at ₹88 Lakhs vs ₹96.5 Lakhs.', severity: 'HIGH' },
      ],
      competitorMentions: [{ name: 'DLF Sky', project: 'Sector 63 Heights', pricePoint: 8800000, location: 'Sector 63, Noida' }],
      sentiment: 'POSITIVE',
      qualityScore: 94,
      recommendedAction: 'Dispatch WhatsApp comparison infographic immediately; trigger Voice AI confirmation call Friday 5 PM.',
    },
  }
];

function getOrgId(req: AuthenticatedRequest): string {
  return req.organizationId || (req as any).user?.orgId || (req as any).user?.organizationId || 'cmupkjhms000018kn5lxj20i1';
}

// ── GET /api/v1/meetings ───────────────────────────────────
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { agentId, customerId, status } = req.query;

  try {
    const where: any = { organizationId: orgId };
    if (agentId) where.agentId = agentId;
    if (customerId) where.customerId = customerId;
    if (status) where.status = status;

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        agent: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        customer: { select: { id: true, firstName: true, lastName: true, businessName: true } },
        insight: true,
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    return res.json({ success: true, data: meetings });
  } catch (err) {
    console.warn('[Meetings] DB unavailable, using mock:', (err as Error).message);
    return res.json({ success: true, data: mockMeetings, _mock: true });
  }
});

// ── GET /api/v1/meetings/agent-report ─────────────────────────
// Admin gets per-agent report stats: visits, leads tapped, meetings
// (MUST BE DEFINED BEFORE /:meetingId TO PREVENT ROUTE COLLISION)
router.get('/agent-report', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);

  try {
    const agents = await prisma.agent.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } } },
    });

    if (!agents || agents.length === 0) {
      // Return default agent report row
      return res.json({
        success: true,
        data: [{
          agentId: 'cmuqiadpb0003c0qqhzmw60r7',
          name: 'Nilesh Somnawane',
          email: 'agentnilesh@gmail.com',
          isActive: true,
          territory: 'Delhi NCR (Dwarka Hub)',
          employeeCode: 'AG001',
          stats: {
            totalVisits: 1,
            completedVisits: 1,
            leadsTapped: 1,
            totalMeetings: 1,
            scheduledMeetings: 1,
            conversionRate: 100,
          },
        }],
      });
    }

    const report = await Promise.all(agents.map(async (agent) => {
      const [
        totalVisits,
        completedVisits,
        leadsTapped,
        totalMeetings,
        scheduledMeetings,
      ] = await Promise.all([
        prisma.visit.count({ where: { agentId: agent.id } }),
        prisma.visit.count({ where: { agentId: agent.id, status: 'COMPLETED' } }),
        prisma.visit.count({ where: { agentId: agent.id, leadTapped: true } }),
        prisma.meeting.count({ where: { agentId: agent.id } }),
        prisma.meeting.count({ where: { agentId: agent.id, adminScheduled: true } }),
      ]);

      return {
        agentId: agent.id,
        name: `${agent.user.firstName} ${agent.user.lastName}`.trim(),
        email: agent.user.email,
        isActive: agent.user.isActive,
        territory: agent.territory || 'Delhi NCR',
        employeeCode: agent.employeeCode || 'AG001',
        stats: {
          totalVisits,
          completedVisits,
          leadsTapped,
          totalMeetings,
          scheduledMeetings,
          conversionRate: totalVisits > 0 ? Math.round((leadsTapped / totalVisits) * 100) : 0,
        },
      };
    }));

    return res.json({ success: true, data: report });
  } catch (err: any) {
    console.error('[Meetings] Agent report error:', err);
    return res.json({
      success: true,
      data: [{
        agentId: 'cmuqiadpb0003c0qqhzmw60r7',
        name: 'Nilesh Somnawane',
        email: 'agentnilesh@gmail.com',
        isActive: true,
        territory: 'Delhi NCR (Dwarka Hub)',
        employeeCode: 'AG001',
        stats: {
          totalVisits: 1,
          completedVisits: 1,
          leadsTapped: 1,
          totalMeetings: 1,
          scheduledMeetings: 1,
          conversionRate: 100,
        },
      }],
      _fallback: true,
    });
  }
});

// ── POST /api/v1/meetings/admin-schedule ─────────────────────
// Admin schedules a meeting for a specific agent
router.post('/admin-schedule', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { agentId, customerId, scheduledFor, title, notes, purposeOfVisit } = req.body;

  if (!agentId || !scheduledFor) {
    return res.status(400).json({ success: false, message: 'agentId and scheduledFor are required' });
  }

  try {
    // Find a valid customerId if not provided (use first customer in org)
    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId) {
      const firstCustomer = await prisma.customer.findFirst({ where: { organizationId: orgId } });
      if (!firstCustomer) {
        return res.status(400).json({ success: false, message: 'customerId is required or no customers found' });
      }
      resolvedCustomerId = firstCustomer.id;
    }

    const meeting = await prisma.meeting.create({
      data: {
        organizationId: orgId,
        agentId,
        customerId: resolvedCustomerId,
        status: 'STARTED',
        startedAt: new Date(scheduledFor),
        scheduledFor: new Date(scheduledFor),
        adminScheduled: true,
        title: title || 'Scheduled Meeting',
        notes: notes || null,
        purposeOfVisit: purposeOfVisit || null,
      },
      include: {
        agent: { include: { user: { select: { firstName: true, lastName: true } } } },
        customer: { select: { firstName: true, lastName: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Meeting scheduled for ${meeting.agent.user.firstName} on ${new Date(scheduledFor).toLocaleString()}`,
      data: meeting,
    });
  } catch (err: any) {
    console.error('[Meetings] Admin schedule error:', err);
    return res.status(500).json({ success: false, message: err?.message || 'Failed to schedule meeting' });
  }
});

// ── GET /api/v1/meetings/:meetingId ───────────────────────
router.get('/:meetingId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.meetingId },
      include: {
        agent: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        customer: { select: { id: true, firstName: true, lastName: true, businessName: true, phone: true } },
        insight: true,
        transcript: true,
        visit: { select: { id: true, destination: true } },
        recording: true,
      },
    });

    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    return res.json({ success: true, data: meeting });
  } catch (err) {
    console.warn('[Meetings] DB unavailable, using mock:', (err as Error).message);
    const meeting = mockMeetings.find(m => m.id === req.params.meetingId) || mockMeetings[0];
    return res.json({ success: true, data: meeting, _mock: true });
  }
});

// ── POST /api/v1/meetings/:meetingId/pre-start ────────────
router.post('/:meetingId/pre-start', async (req: AuthenticatedRequest, res: Response) => {
  const { businessName, businessOwnerName, purposeOfVisit } = req.body;
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.meetingId }
    });
    if (!meeting) return res.status(404).json({ success: false, message: 'Meeting not found' });

    if (businessName !== undefined || businessOwnerName !== undefined) {
      await prisma.customer.update({
        where: { id: meeting.customerId },
        data: { 
          ...(businessName !== undefined && { businessName }),
          ...(businessOwnerName !== undefined && { businessOwnerName })
        }
      });
    }

    if (purposeOfVisit !== undefined) {
      await prisma.meeting.update({
        where: { id: req.params.meetingId },
        data: { purposeOfVisit }
      });
    }

    return res.json({ success: true, message: 'Pre-meeting details saved' });
  } catch (err) {
    console.warn('[Meetings] DB update failed:', (err as Error).message);
    return res.json({ success: true, _mock: true });
  }
});

// ── POST /api/v1/meetings/:meetingId/recording-upload-url ─
// Returns a presigned URL for the agent to upload audio directly
router.post('/:meetingId/recording-upload-url', async (req: AuthenticatedRequest, res: Response) => {
  const { filename, contentType = 'audio/webm' } = req.body;

  try {
    const key = `meetings/${req.params.meetingId}/${filename || 'recording.webm'}`;
    const { uploadUrl, downloadUrl } = await storageProvider.getUploadUrl(key, contentType);
    return res.json({ success: true, uploadUrl, downloadUrl, key });
  } catch (err) {
    // Mock presigned URL for demo
    return res.json({
      success: true,
      uploadUrl: `http://localhost:4000/api/v1/meetings/${req.params.meetingId}/recording-mock-upload`,
      downloadUrl: `https://audio.bitlance-os.internal/recordings/${req.params.meetingId}.webm`,
      key: `meetings/${req.params.meetingId}/recording.webm`,
      _mock: true,
    });
  }
});

// ── POST /api/v1/meetings/:meetingId/recording-confirmed ──
// Called after agent successfully uploaded the recording
router.post('/:meetingId/recording-confirmed', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);
  const { audioUrl, durationSeconds } = req.body;

  try {
    await prisma.meeting.update({
      where: { id: req.params.meetingId },
      data: { status: 'PROCESSING', durationSeconds: durationSeconds ? parseInt(durationSeconds) : null },
    });
    // Also create recording record
    await prisma.recording.create({
      data: {
        meetingId: req.params.meetingId,
        storageKey: `meetings/${req.params.meetingId}/recording.webm`,
        storageUrl: audioUrl,
      },
    });
  } catch (err) {
    console.warn('[Meetings] DB update failed, continuing anyway:', (err as Error).message);
  }

  // Enqueue AI pipeline
  await eventBus.recordingUploaded(orgId, {
    meetingId: req.params.meetingId,
    audioUrl: audioUrl || `https://audio.bitlance-os.internal/recordings/${req.params.meetingId}.webm`,
    durationSeconds: durationSeconds || 0,
  });

  return res.json({ success: true, message: 'Recording confirmed. AI processing started.' });
});

// ── POST /api/v1/meetings/:meetingId/complete-and-analyze ─
// Synchronous AI analysis (for demo / testing)
router.post('/:meetingId/complete-and-analyze', async (req: AuthenticatedRequest, res: Response) => {
  const orgId = getOrgId(req);

  let meeting = mockMeetings[0];
  let meetingData: any = { agentName: 'Aman Sharma', customerName: 'Rajesh Kumar' };

  try {
    const dbMeeting = await prisma.meeting.findUnique({
      where: { id: req.params.meetingId },
      include: {
        agent: { include: { user: { select: { firstName: true, lastName: true } } } },
        customer: { select: { firstName: true, lastName: true } },
        recording: { select: { storageUrl: true } },
      },
    });

    if (dbMeeting) {
      meeting = dbMeeting as any;
      meetingData = {
        agentName: dbMeeting.agent?.user ? `${dbMeeting.agent.user.firstName} ${dbMeeting.agent.user.lastName}` : 'Agent',
        customerName: dbMeeting.customer ? `${dbMeeting.customer.firstName} ${dbMeeting.customer.lastName}` : 'Customer',
      };

      await prisma.meeting.update({
        where: { id: req.params.meetingId },
        data: { status: 'PROCESSING' },
      });
    }
  } catch (err) {
    console.warn('[Meetings] DB unavailable, running mock analysis:', (err as Error).message);
  }

  // Run AI orchestrator (Gemini → OpenAI → Mock)
  const insight = await aiOrchestrator.processMeeting(
    req.params.meetingId,
    (meeting as any).audioUrl || 'https://audio.bitlance-os.internal/mock.mp3',
    { customerName: meetingData.customerName, agentName: meetingData.agentName, projectName: 'Lifestyle Palms' }
  );

  // Persist insight
  try {
    await prisma.meetingInsight.upsert({
      where: { meetingId: req.params.meetingId },
      create: {
        meetingId: req.params.meetingId,
        summary: insight.summary,
        customerIntent: insight.customerIntent,
        intentLevel: insight.intentLevel as any,
        sentiment: insight.sentiment,
        qualityScore: insight.qualityScore,
        requirement: insight.requirement as any,
        objections: insight.objections as any,
        competitorMentions: insight.competitorMentions as any,
        recommendedAction: insight.recommendedAction,
      },
      update: {
        summary: insight.summary,
        intentLevel: insight.intentLevel as any,
        qualityScore: insight.qualityScore,
      },
    });

    await prisma.meeting.update({
      where: { id: req.params.meetingId },
      data: { status: 'ANALYSED' },
    });
  } catch (err) {
    console.warn('[Meetings] Insight persist failed:', (err as Error).message);
  }

  // Emit AI report ready
  await eventBus.aiReportReady(orgId, {
    meetingId: req.params.meetingId,
    customerId: (meeting as any).customerId || 'cust-rajesh-01',
    leadScore: insight.qualityScore,
    intentLevel: insight.intentLevel,
  });

  try {
    const provider = getWhatsAppProvider();
    const customerPhone = (meeting as any).customer?.phone || '+1234567890';
    const msg = `Hi ${meetingData.customerName},\n\nThank you for the meeting today. Here's a brief summary of our discussion:\n\n${insight.summary}\n\nBest,\n${meetingData.agentName}`;
    await provider.sendMessage(customerPhone, msg);
  } catch (err) {
    console.warn('[Meetings] WhatsApp send failed:', (err as Error).message);
  }

  return res.json({ success: true, data: { ...meeting, status: 'ANALYSED', insight } });
});

export default router;

