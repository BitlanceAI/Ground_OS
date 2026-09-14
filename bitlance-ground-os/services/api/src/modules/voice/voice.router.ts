import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getVoiceProvider } from '../../adapters/voice.adapter';

const router = Router();
const voiceProvider = getVoiceProvider();

const mockVoiceCalls = [
  {
    id: 'vc-001',
    customerId: 'cust-rajesh-01',
    customerName: 'Rajesh Kumar',
    phone: '+91 98765 00112',
    status: 'COMPLETED',
    type: 'AUTOMATED_FOLLOWUP',
    durationSeconds: 112,
    scheduledFor: 'Tomorrow 11:30 AM',
    createdAt: new Date().toISOString(),
    recordingUrl: 'https://audio.bitlance-os.internal/calls/vc-001.mp3',
    transcript: 'AI: Namaste Rajesh ji, this is Aisha from Lifestyle Homes following up on your discussion with Aman. Are you still confirmed for the Saturday 11 AM site visit? Rajesh: Yes, we will be there.',
    sentiment: 'POSITIVE',
    eligibilityState: {
      eligible: true,
      rulesPassed: ['Inactivity > 48h or Follow-up Triggered', 'Consent Verified', 'DND Checked'],
    },
    postCallIntelligence: {
      intentConfirmed: true,
      siteVisitConfirmed: true,
      preferredSlot: 'Saturday 11:00 AM',
      sentimentScore: 92,
      nextAction: 'Send calendar invite & route directions via WhatsApp',
    }
  }
];

// GET /api/v1/voice/calls
router.get('/calls', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockVoiceCalls });
});

// POST /api/v1/voice/trigger
router.post('/trigger', async (req: AuthenticatedRequest, res: Response) => {
  const { customerPhone, customerName, prompt } = req.body;
  const result = await voiceProvider.initiateCall({
    to: customerPhone || '+919876500112',
    customerName: customerName || 'Rajesh Kumar',
    context: prompt || 'Confirm Saturday site visit and answer any questions regarding payment schedule.',
  });

  res.json({
    success: true,
    message: 'Voice AI call initiated',
    callId: result.callId,
    status: 'RINGING',
  });
});

export default router;
