import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getMapsProvider } from '../../adapters/maps.adapter';

const router = Router();
const mapsProvider = getMapsProvider();

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
    notes: 'Inquired via WhatsApp Meta campaign at 09:42 AM. Looking for self-use property.',
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

// GET /api/v1/visits
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockVisits });
});

// GET /api/v1/visits/:visitId
router.get('/:visitId', (req: AuthenticatedRequest, res: Response) => {
  const visit = mockVisits.find(v => v.id === req.params.visitId) || mockVisits[0];
  res.json({ success: true, data: visit });
});

// POST /api/v1/visits/:visitId/verify-location
router.post('/:visitId/verify-location', async (req: AuthenticatedRequest, res: Response) => {
  const { latitude, longitude } = req.body;
  const visit = mockVisits.find(v => v.id === req.params.visitId);

  if (!visit) {
    return res.status(404).json({ success: false, error: 'Visit not found' });
  }

  const result = await mapsProvider.verifyGeofence(
    parseFloat(latitude),
    parseFloat(longitude),
    visit.destination.latitude,
    visit.destination.longitude,
    150 // 150m radius
  );

  if (result.verified) {
    visit.geofenceVerified = true;
    visit.distanceAtCheckInMeters = result.distanceMeters;
    visit.status = 'LOCATION_VERIFIED';
  }

  res.json({ success: true, verified: result.verified, result, visit });
});

// POST /api/v1/visits/:visitId/status
router.post('/:visitId/status', (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const visit = mockVisits.find(v => v.id === req.params.visitId);
  if (visit && status) {
    visit.status = status;
  }
  res.json({ success: true, data: visit });
});

export default router;
