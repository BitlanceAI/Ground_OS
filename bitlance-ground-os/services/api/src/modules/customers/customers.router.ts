import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

const mockCustomers = [
  {
    id: 'cust-rajesh-01',
    name: 'Rajesh Kumar',
    phone: '+91 98765 00112',
    email: 'rajesh@rajeshelectronics.in',
    businessName: 'Rajesh Electronics & Appliances',
    address: 'Shop 14, Galaxy Plaza, Sector 62, Noida',
    leadScore: 91,
    intentLevel: 'VERY_HIGH',
    status: 'NEGOTIATING',
    assignedAgentId: 'agt-aman-01',
    assignedAgentName: 'Aman Sharma',
    projectName: 'Lifestyle Palms Tower B',
    budgetRange: '₹85 L – ₹1.05 Cr',
    preferredUnit: '3BHK (1650 sq.ft, East Facing)',
    tags: ['Cash Flow Ready', 'Business Owner', 'Objection: Carpet Area', 'Met Competitor: DLF Sky'],
    timeline: [
      {
        id: 'ev-1',
        time: '09:42 AM',
        date: 'Today',
        type: 'WHATSAPP_INBOUND',
        title: 'Inbound WhatsApp Inquiry',
        description: 'Customer sent brochure enquiry from Meta Ads campaign: "Need 3BHK details with floor plan."',
        isAi: false,
      },
      {
        id: 'ev-2',
        time: '09:44 AM',
        date: 'Today',
        type: 'AI_RESPONSE',
        title: 'AI Ground Dispatcher Auto-Assignment',
        description: 'AI detected high buying urgency. Auto-assigned nearest field advisor Aman Sharma (ETA 25 min).',
        isAi: true,
      },
      {
        id: 'ev-3',
        time: '10:15 AM',
        date: 'Today',
        type: 'GEOFENCE_VERIFIED',
        title: 'Agent Arrived & Geofence Verified',
        description: 'Aman reached Rajesh Electronics. Distance to geofence: 8 meters. Location verified via GPS.',
        isAi: false,
      },
      {
        id: 'ev-4',
        time: '10:20 AM',
        date: 'Today',
        type: 'MEETING_RECORDING',
        title: 'In-Person Meeting Conducted (28m)',
        description: 'Meeting recorded with customer consent. Live audio streamed to Bitlance STT engine.',
        isAi: false,
      },
      {
        id: 'ev-5',
        time: '10:52 AM',
        date: 'Today',
        type: 'AI_MEETING_REPORT',
        title: 'AI Intelligence Report Generated',
        description: 'Intent: 91/100 (VERY HIGH). Budget: ₹95L confirmed. Objection identified: carpet ratio compared to DLF.',
        isAi: true,
      },
      {
        id: 'ev-6',
        time: '11:05 AM',
        date: 'Today',
        type: 'CREATIVE_GENERATED',
        title: 'Hyper-Personalized WhatsApp Creative Dispatched',
        description: 'AI Generated personalized 3BHK unit comparison sheet addressing carpet efficiency, approved and sent.',
        isAi: true,
      },
      {
        id: 'ev-7',
        time: '11:29 AM',
        date: 'Today',
        type: 'VOICE_SCHEDULED',
        title: 'Voice AI Follow-up Slot Scheduled',
        description: 'Scheduled dynamic Voice AI confirmation call for tomorrow 11:30 AM before site visit.',
        isAi: true,
      }
    ],
    requirements: {
      unitType: '3BHK',
      minAreaSqFt: 1550,
      maxAreaSqFt: 1800,
      facing: 'East / Park Facing',
      floorPreference: 'Middle (5th to 12th)',
      budgetMin: 8500000,
      budgetMax: 10500000,
      paymentMode: 'Self-Funded / Bank Loan (30:70)',
      possessionTimeline: 'Within 6 Months',
    }
  },
  {
    id: 'cust-pooja-02',
    name: 'Pooja Gupta',
    phone: '+91 99110 33445',
    email: 'pooja.g@fintechcorp.io',
    businessName: 'Fintech Solutions',
    address: 'Tower 4, Advant Navis, Sector 142, Noida',
    leadScore: 78,
    intentLevel: 'HIGH',
    status: 'QUALIFIED',
    assignedAgentId: 'agt-priya-02',
    assignedAgentName: 'Priya Mehta',
    projectName: 'Lifestyle Grande',
    budgetRange: '₹1.2 Cr – ₹1.4 Cr',
    preferredUnit: '3BHK + Servant',
    tags: ['IT Professional', 'High CIBIL', 'Weekend Site Visit'],
    timeline: [],
    requirements: {
      unitType: '3BHK + Servant',
      budgetMin: 12000000,
      budgetMax: 14000000,
    }
  }
];

// GET /api/v1/customers
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockCustomers });
});

// GET /api/v1/customers/:customerId
router.get('/:customerId', (req: AuthenticatedRequest, res: Response) => {
  const cust = mockCustomers.find(c => c.id === req.params.customerId) || mockCustomers[0];
  res.json({ success: true, data: cust });
});

// POST /api/v1/customers
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const newCust = {
    id: `cust-${Date.now()}`,
    ...req.body,
    leadScore: req.body.leadScore || 50,
    status: req.body.status || 'NEW',
    timeline: [],
  };
  mockCustomers.push(newCust);
  res.status(201).json({ success: true, data: newCust });
});

export default router;
