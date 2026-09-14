import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

const mockRequirements = [
  {
    id: 'req-001',
    customerId: 'cust-rajesh-01',
    customerName: 'Rajesh Kumar',
    unitType: '3BHK',
    minBudget: 8500000,
    maxBudget: 10500000,
    preferredLocation: 'Sector 62 Noida',
    facing: 'East Facing',
    parkingRequired: true,
    possessionTimeframe: '6 Months',
    status: 'ACTIVE_MATCHING',
    matchedInventoryCount: 4,
    createdAt: new Date().toISOString(),
  }
];

// GET /api/v1/requirements
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockRequirements });
});

// POST /api/v1/requirements
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const newReq = {
    id: `req-${Date.now()}`,
    ...req.body,
    status: 'ACTIVE_MATCHING',
    matchedInventoryCount: 3,
    createdAt: new Date().toISOString(),
  };
  mockRequirements.push(newReq);
  res.status(201).json({ success: true, data: newReq });
});

export default router;
