import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

const mockLeads = [
  {
    id: 'lead-001',
    customerName: 'Rajesh Kumar',
    phone: '+91 98765 00112',
    score: 91,
    intentLevel: 'VERY_HIGH',
    stage: 'NEGOTIATION',
    source: 'META_ADS_GROUND_DISPATCH',
    dealValue: 9800000,
    assignedAgent: 'Aman Sharma',
    projectInterest: 'Lifestyle Palms 3BHK',
    lastContactedAt: new Date().toISOString(),
  },
  {
    id: 'lead-002',
    customerName: 'Pooja Gupta',
    phone: '+91 99110 33445',
    score: 78,
    intentLevel: 'HIGH',
    stage: 'QUALIFIED',
    source: 'WHATSAPP_CAMPAIGN',
    dealValue: 13500000,
    assignedAgent: 'Priya Mehta',
    projectInterest: 'Lifestyle Grande 3BHK+S',
    lastContactedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'lead-003',
    customerName: 'Vikram Malhotra',
    phone: '+91 98333 44556',
    score: 64,
    intentLevel: 'MEDIUM',
    stage: 'SITE_VISIT_SCHEDULED',
    source: 'DIRECT_WALK_IN',
    dealValue: 8200000,
    assignedAgent: 'Rohit Singhania',
    projectInterest: 'Lifestyle Palms 2BHK',
    lastContactedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  }
];

// GET /api/v1/leads
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockLeads });
});

// GET /api/v1/leads/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const lead = mockLeads.find(l => l.id === req.params.id) || mockLeads[0];
  res.json({ success: true, data: lead });
});

// PATCH /api/v1/leads/:id/stage
router.patch('/:id/stage', (req: AuthenticatedRequest, res: Response) => {
  const { stage } = req.body;
  const lead = mockLeads.find(l => l.id === req.params.id);
  if (lead && stage) {
    lead.stage = stage;
  }
  res.json({ success: true, data: lead });
});

export default router;
