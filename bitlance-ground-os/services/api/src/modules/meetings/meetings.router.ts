import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { aiOrchestrator } from '../../orchestrator/ai.orchestrator';

const router = Router();

const mockMeetings = [
  {
    id: 'mtg-001',
    visitId: 'vis-001',
    agentId: 'agt-aman-01',
    agentName: 'Aman Sharma',
    customerId: 'cust-rajesh-01',
    customerName: 'Rajesh Kumar',
    status: 'ANALYSED',
    durationSeconds: 1680, // 28 mins
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    endedAt: new Date(Date.now() - 1920000).toISOString(),
    audioUrl: 'https://audio.bitlance-os.internal/recordings/mtg-001.mp3',
    audioWaveform: [12, 45, 67, 89, 45, 23, 78, 90, 85, 43, 67, 98, 76, 54, 32, 65, 87, 92, 45, 67],
    transcript: `
Aman: Namaste Rajesh ji, thank you for your time today.
Rajesh Kumar: Namaste Aman. Haan, I saw your advertisement on Instagram about Lifestyle Palms. We are looking to buy a 3BHK for our family.
Aman: Wonderful. Could you share what specific carpet area or configuration you are prioritizing?
Rajesh Kumar: We need at least 1600 sq.ft. East facing preferably because of Vastu. Also, parking for 2 cars is a must.
Aman: Lifestyle Palms 3BHK Grand Edition offers 1650 sq.ft super area with 1320 sq.ft carpet area, including 2 dedicated covered stilt parkings.
Rajesh Kumar: What is the price range?
Aman: The all-inclusive launch price for East-facing units on 7th floor is ₹96.5 Lakhs, including GST, club membership, and parking.
Rajesh Kumar: Hmm, DLF Sky is offering 3BHK in Sector 63 for ₹88 Lakhs. Why is Lifestyle Palms higher?
Aman: Great question Rajesh ji. DLF's super-to-carpet efficiency is only 68%, giving you 1150 sq.ft carpet, whereas ours is 80% (1320 sq.ft). You get 170 sq.ft more usable area, plus RERA delivery is Q1 next year.
Rajesh Kumar: Ah, that makes sense. Can you send me the comparative breakdown on WhatsApp?
Aman: Absolutely, I will send you a personalized unit comparison right after this meeting. Can we schedule a site visit for Saturday at 11 AM?
Rajesh Kumar: Yes, Saturday 11 AM works for me and my wife.
    `.trim(),
    insight: {
      summary: 'High-intent 3BHK enquiry for self-use. Customer required min 1600 sq.ft, East-facing, and 2 parkings. Overcame DLF price objection via carpet-area efficiency metric. Saturday 11 AM site visit tentatively agreed.',
      customerIntent: 'Immediate purchase (within 60-90 days), highly qualified buyer with budget up to ₹1.05 Cr.',
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
        {
          type: 'PRICE_VS_COMPETITOR',
          description: 'Mentioned DLF Sky offering 3BHK at ₹88 Lakhs vs ₹96.5 Lakhs.',
          severity: 'HIGH',
        }
      ],
      competitorMentions: [
        {
          name: 'DLF Sky',
          project: 'Sector 63 Heights',
          pricePoint: 8800000,
          location: 'Sector 63, Noida',
        }
      ],
      sentiment: 'POSITIVE',
      qualityScore: 94,
      coachingNotes: 'Flawless objection handling using usable carpet efficiency calculation. Promptly secured site visit micro-commitment.',
      recommendedAction: 'Dispatch WhatsApp comparison infographic immediately; trigger automated Voice AI confirmation call Friday 5 PM.',
    }
  }
];

// GET /api/v1/meetings
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockMeetings });
});

// GET /api/v1/meetings/:meetingId
router.get('/:meetingId', (req: AuthenticatedRequest, res: Response) => {
  const meeting = mockMeetings.find(m => m.id === req.params.meetingId) || mockMeetings[0];
  res.json({ success: true, data: meeting });
});

// POST /api/v1/meetings/start
router.post('/start', (req: AuthenticatedRequest, res: Response) => {
  const { visitId, customerId, agentId } = req.body;
  const newMeeting = {
    id: `mtg-${Date.now()}`,
    visitId: visitId || 'vis-001',
    agentId: agentId || 'agt-aman-01',
    agentName: 'Aman Sharma',
    customerId: customerId || 'cust-rajesh-01',
    customerName: 'Rajesh Kumar',
    status: 'RECORDING',
    durationSeconds: 0,
    startedAt: new Date().toISOString(),
    transcript: '',
    insight: null,
  };
  mockMeetings.unshift(newMeeting as any);
  res.status(201).json({ success: true, data: newMeeting });
});

// POST /api/v1/meetings/:meetingId/complete-and-analyze
router.post('/:meetingId/complete-and-analyze', async (req: AuthenticatedRequest, res: Response) => {
  const meeting = mockMeetings.find(m => m.id === req.params.meetingId) || mockMeetings[0];
  meeting.status = 'PROCESSING';

  // Process through AI Orchestrator
  const insight = await aiOrchestrator.processMeeting(meeting.id, 'https://audio.bitlance-os.internal/mock.mp3', {
    customerName: meeting.customerName,
    agentName: meeting.agentName,
    projectName: 'Lifestyle Palms',
  });

  meeting.status = 'ANALYSED';
  meeting.insight = insight as any;

  res.json({ success: true, data: meeting });
});

export default router;
