import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { aiOrchestrator } from '../../orchestrator/ai.orchestrator';

const router = Router();

// GET /api/v1/ai/feed (AI Priority Feed)
router.get('/feed', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'feed-1',
        type: 'HIGH_INTENT',
        priority: 'CRITICAL',
        title: 'High-Intent 3BHK Lead Ready for Closing',
        body: 'Rajesh Kumar completed 28m meeting with Aman Sharma. Intent score: 91/100. Budget verified at ₹95L.',
        customerId: 'cust-rajesh-01',
        agentId: 'agt-aman-01',
        actionLabel: 'View Meeting Report',
        actionRoute: '/meetings/mtg-001/report',
        timestamp: '12m ago',
      },
      {
        id: 'feed-2',
        type: 'FOLLOW_UP_RISK',
        priority: 'HIGH',
        title: 'Pending Follow-up on DLF Price Comparison',
        body: 'Customer raised ₹8.5L price gap against DLF Sky. Creative comparison sheet generated awaiting review.',
        customerId: 'cust-rajesh-01',
        agentId: 'agt-aman-01',
        actionLabel: 'Approve & Send Creative',
        actionRoute: '/creatives',
        timestamp: '25m ago',
      },
      {
        id: 'feed-3',
        type: 'MARKET_SIGNAL',
        priority: 'MEDIUM',
        title: 'Competitor Mention Spike: DLF Sky Sector 63',
        body: '3 different customers mentioned DLF discounts this morning. Suggested playbook: highlight 80% carpet efficiency.',
        actionLabel: 'View Market Intelligence',
        actionRoute: '/intelligence',
        timestamp: '1h ago',
      },
      {
        id: 'feed-4',
        type: 'AGENT_COACHING',
        priority: 'MEDIUM',
        title: 'Aman Sharma — Outstanding Objection Resolution',
        body: 'AI Audio Analysis scored Aman 94/100 for live carpet calculation during price objection.',
        agentId: 'agt-aman-01',
        actionLabel: 'View Agent Profile',
        actionRoute: '/agents/agt-aman-01',
        timestamp: '1h ago',
      }
    ]
  });
});

// POST /api/v1/ai/query (Global Ask Bitlance Bar)
router.post('/query', async (req: AuthenticatedRequest, res: Response) => {
  const { query } = req.body;
  
  // Sample smart responses based on natural language query
  let answer = 'Analyzing across all active ground operations...';
  if (query?.toLowerCase().includes('rajesh') || query?.toLowerCase().includes('3bhk')) {
    answer = 'Rajesh Kumar (Rajesh Electronics) has a 91/100 intent score for Lifestyle Palms 3BHK East Facing. Meeting concluded with Aman Sharma at 10:48 AM. Follow-up creative comparison sheet dispatched on WhatsApp.';
  } else if (query?.toLowerCase().includes('aman') || query?.toLowerCase().includes('agent')) {
    answer = 'Aman Sharma has completed 3 out of 6 visits today with a 92% meeting quality index. Currently at Rajesh Electronics, Sector 62.';
  } else {
    answer = `Bitlance Ground OS has detected 14 active visits, 6 high-intent deals in negotiation, and 0 stalled leads past 48h SLA. Query processed: "${query}"`;
  }

  res.json({
    success: true,
    query,
    answer,
    confidence: 0.96,
    sources: ['Meeting mtg-001', 'Live GPS Stream', 'WhatsApp thread wa-001'],
  });
});

export default router;
