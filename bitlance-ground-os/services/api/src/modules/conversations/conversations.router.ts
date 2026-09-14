import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();

const mockConversations = [
  {
    id: 'conv-001',
    customerId: 'cust-rajesh-01',
    customerName: 'Rajesh Kumar',
    channel: 'WHATSAPP',
    unreadCount: 0,
    lastMessageAt: '11:05 AM',
    lastMessageText: 'Here is your personalized Lifestyle Palms 3BHK unit comparison sheet.',
    messages: [
      {
        id: 'msg-1',
        sender: 'CUSTOMER',
        text: 'Hi, I saw your ad on Instagram. Can you send details for 3BHK flats in Noida?',
        timestamp: '09:42 AM',
        status: 'READ',
      },
      {
        id: 'msg-2',
        sender: 'SYSTEM_AI',
        text: 'Hello Rajesh ji! Thank you for contacting Lifestyle Homes. Our Senior Property Advisor Aman Sharma is nearby in Sector 62 and will be visiting you shortly with complete blueprints.',
        timestamp: '09:44 AM',
        status: 'DELIVERED',
      },
      {
        id: 'msg-3',
        sender: 'AGENT',
        text: 'Namaste Rajesh ji, it was great meeting you in person. As discussed, sending across the carpet area comparison and the 7th floor East-facing layout.',
        timestamp: '11:05 AM',
        status: 'SENT',
        mediaUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      }
    ]
  }
];

// GET /api/v1/conversations
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: mockConversations });
});

// GET /api/v1/conversations/:id
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const conv = mockConversations.find(c => c.id === req.params.id) || mockConversations[0];
  res.json({ success: true, data: conv });
});

export default router;
