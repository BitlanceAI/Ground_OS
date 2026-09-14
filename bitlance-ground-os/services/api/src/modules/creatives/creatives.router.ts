import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getCreativeProvider } from '../../adapters/creative.adapter';

const router = Router();
const creativeProvider = getCreativeProvider();

const mockCreatives = [
  {
    id: 'crt-001',
    customerId: 'cust-rajesh-01',
    customerName: 'Rajesh Kumar',
    projectName: 'Lifestyle Palms',
    type: 'COMPUTED_COMPARISON_CARD',
    headline: 'Lifestyle Palms vs DLF Sky: Usable Carpet Space Analysis',
    bodyCopy: 'Hi Rajesh ji, why Lifestyle Palms gives you 170 sq.ft more usable carpet space at ₹96.5L compared to DLF Sky 1150 sq.ft at ₹88L. Real usable cost is ₹7,310/sq.ft vs ₹7,652/sq.ft.',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    status: 'APPROVED_AND_SENT',
    generatedAt: '11:02 AM',
    sentAt: '11:05 AM',
    channel: 'WHATSAPP',
    metrics: {
      delivered: true,
      read: true,
      linkClicks: 2,
    }
  },
  {
    id: 'crt-002',
    customerId: 'cust-pooja-02',
    customerName: 'Pooja Gupta',
    projectName: 'Lifestyle Grande',
    type: 'PENTHOUSE_EXCLUSIVE_BROCHURE',
    headline: 'Exclusive 3BHK + Servant Suites at Lifestyle Grande',
    bodyCopy: 'Private lift lobbies, 3-side open ventilation, and 75,000 sq.ft clubhouse in Sector 142.',
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    status: 'DRAFT_AWAITING_APPROVAL',
    generatedAt: '10:30 AM',
    channel: 'WHATSAPP',
  }
];

// GET /api/v1/creatives
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockCreatives });
});

// POST /api/v1/creatives/generate
router.post('/generate', async (req: AuthenticatedRequest, res: Response) => {
  const { customerName, projectName, unitType, priceRange, objection } = req.body;
  const generated = await creativeProvider.generateBrochureCard({
    customerName: customerName || 'Rajesh Kumar',
    projectName: projectName || 'Lifestyle Palms',
    unitType: unitType || '3BHK Grand Edition',
    priceRange: priceRange || '₹96.5 Lakhs',
    objectionHighlight: objection || 'Carpet Area Efficiency',
  });

  const newCreative = {
    id: `crt-${Date.now()}`,
    customerName: customerName || 'Rajesh Kumar',
    projectName: projectName || 'Lifestyle Palms',
    type: 'AI_PERSONALIZED_CARD',
    headline: generated.headline,
    bodyCopy: generated.copyText,
    imageUrl: generated.assetUrl,
    status: 'READY_FOR_REVIEW',
    generatedAt: 'Just now',
    channel: 'WHATSAPP',
  };

  mockCreatives.unshift(newCreative as any);
  res.status(201).json({ success: true, data: newCreative });
});

// POST /api/v1/creatives/:id/approve-and-send
router.post('/:id/approve-and-send', (req: AuthenticatedRequest, res: Response) => {
  const creative = mockCreatives.find(c => c.id === req.params.id) || mockCreatives[0];
  creative.status = 'APPROVED_AND_SENT';
  (creative as any).sentAt = 'Just now';
  res.json({ success: true, message: 'Creative approved and dispatched to WhatsApp', data: creative });
});

export default router;
