import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

// In-memory / Mock Agent Store
const mockAgents = [
  {
    id: 'agt-aman-01',
    name: 'Aman Sharma',
    phone: '+91 98765 43210',
    email: 'aman.sharma@lifestylehomes.com',
    role: 'FIELD_SALES_EXECUTIVE',
    status: 'IN_MEETING',
    location: {
      latitude: 28.5355,
      longitude: 77.3910,
      accuracy: 4.5,
      address: 'Rajesh Electronics, Sector 62, Noida',
      timestamp: new Date().toISOString(),
    },
    todayStats: {
      assignedVisits: 6,
      completedVisits: 3,
      meetingsHeld: 3,
      activeMeetingMinutes: 24,
      qualityScore: 92,
      distanceTravelledKm: 18.4,
    },
    route: [
      { id: 'v-1', customer: 'Vijay Verma', status: 'COMPLETED', time: '10:00 AM' },
      { id: 'v-2', customer: 'Rajesh Kumar', status: 'IN_PROGRESS', time: '11:15 AM' },
      { id: 'v-3', customer: 'Pooja Gupta', status: 'PENDING', time: '02:00 PM' },
      { id: 'v-4', customer: 'Deepak Rao', status: 'PENDING', time: '03:45 PM' },
    ],
    coachingInsight: {
      topStrength: 'Exceptional objection deflection on carpet area query',
      improvementArea: 'Ask for tentative possession timeline earlier in meeting',
      lastAudioReviewScore: 94,
    }
  },
  {
    id: 'agt-priya-02',
    name: 'Priya Mehta',
    phone: '+91 98111 22334',
    email: 'priya.mehta@lifestylehomes.com',
    role: 'FIELD_SALES_EXECUTIVE',
    status: 'EN_ROUTE',
    location: {
      latitude: 28.5390,
      longitude: 77.3820,
      accuracy: 6.0,
      address: 'Sector 63 Commercial Hub, Noida',
      timestamp: new Date().toISOString(),
    },
    todayStats: {
      assignedVisits: 5,
      completedVisits: 2,
      meetingsHeld: 2,
      activeMeetingMinutes: 0,
      qualityScore: 88,
      distanceTravelledKm: 12.1,
    },
  },
  {
    id: 'agt-rohit-03',
    name: 'Rohit Singhania',
    phone: '+91 98222 33445',
    email: 'rohit.s@lifestylehomes.com',
    role: 'SENIOR_ADVISOR',
    status: 'ONLINE',
    location: {
      latitude: 28.5440,
      longitude: 77.4010,
      accuracy: 5.0,
      address: 'Lifestyle Palms Sales Pavilion',
      timestamp: new Date().toISOString(),
    },
    todayStats: {
      assignedVisits: 4,
      completedVisits: 4,
      meetingsHeld: 4,
      activeMeetingMinutes: 0,
      qualityScore: 96,
      distanceTravelledKm: 22.0,
    },
  }
];

// GET /api/v1/agents
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockAgents });
});

// GET /api/v1/agents/:agentId
router.get('/:agentId', (req: AuthenticatedRequest, res: Response) => {
  const agent = mockAgents.find(a => a.id === req.params.agentId) || mockAgents[0];
  res.json({ success: true, data: agent });
});

// POST /api/v1/agents/:agentId/location (Agent location heartbeat)
router.post('/:agentId/location', (req: AuthenticatedRequest, res: Response) => {
  const { latitude, longitude, accuracy, address } = req.body;
  const agent = mockAgents.find(a => a.id === req.params.agentId);
  if (agent) {
    agent.location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      accuracy: parseFloat(accuracy) || 5.0,
      address: address || agent.location.address,
      timestamp: new Date().toISOString(),
    };
  }
  res.json({ success: true, message: 'Location updated', data: agent?.location });
});

// POST /api/v1/agents/:agentId/status
router.post('/:agentId/status', (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body;
  const agent = mockAgents.find(a => a.id === req.params.agentId);
  if (agent && status) {
    agent.status = status;
  }
  res.json({ success: true, message: 'Status updated', data: agent });
});

export default router;
