import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

// GET /api/v1/analytics/executive
router.get('/executive', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      metrics: {
        activeAgents: 14,
        totalVisitsToday: 48,
        meetingsHeldToday: 36,
        highIntentDeals: 18,
        aiAutomationsFired: 94,
        pipelineValue: 485000000, // ₹48.5 Cr
        avgMeetingDurationMinutes: 24.6,
        avgAgentQualityScore: 91.2,
      },
      funnel: [
        { stage: 'Inquiries Received', count: 120, conversion: '100%' },
        { stage: 'Ground Visits Dispatched', count: 48, conversion: '40%' },
        { stage: 'Meetings Completed', count: 36, conversion: '75%' },
        { stage: 'High Intent Qualified', count: 24, conversion: '66.7%' },
        { stage: 'Site Visits Scheduled', count: 18, conversion: '75%' },
        { stage: 'Deals Closed', count: 6, conversion: '33.3%' },
      ],
      demandHeatmap: [
        { sector: 'Sector 62 Noida', demandIndex: 94, topUnit: '3BHK', avgBudget: '₹95L - ₹1.1Cr' },
        { sector: 'Sector 142 Noida', demandIndex: 88, topUnit: '3BHK+S', avgBudget: '₹1.3Cr - ₹1.6Cr' },
        { sector: 'Sector 150 Sports City', demandIndex: 79, topUnit: '4BHK Luxury', avgBudget: '₹2.1Cr - ₹2.8Cr' },
        { sector: 'Greater Noida West', demandIndex: 72, topUnit: '2BHK', avgBudget: '₹55L - ₹70L' },
      ],
      agentLeaderboard: [
        { id: 'agt-aman-01', name: 'Aman Sharma', visits: 6, deals: 2, score: 94, pipeline: '₹2.8 Cr' },
        { id: 'agt-rohit-03', name: 'Rohit Singhania', visits: 5, deals: 2, score: 96, pipeline: '₹3.2 Cr' },
        { id: 'agt-priya-02', name: 'Priya Mehta', visits: 5, deals: 1, score: 88, pipeline: '₹1.9 Cr' },
      ]
    }
  });
});

export default router;
