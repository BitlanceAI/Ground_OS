import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getWhatsAppProvider } from '../../adapters/whatsapp.adapter';

const router = Router();
const whatsappProvider = getWhatsAppProvider();

// POST /api/v1/whatsapp/send
router.post('/send', async (req: AuthenticatedRequest, res: Response) => {
  const { to, message, mediaUrl, templateName, params } = req.body;
  
  let result;
  if (mediaUrl) {
    result = await whatsappProvider.sendImage(to || '+919876500112', mediaUrl, message);
  } else if (templateName) {
    result = await whatsappProvider.sendTemplate(to || '+919876500112', templateName, params || []);
  } else {
    result = await whatsappProvider.sendMessage(to || '+919876500112', message || 'Hello from Lifestyle Homes');
  }

  res.json({ success: true, result });
});

// GET /api/v1/whatsapp/threads
router.get('/threads', (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 'wa-001',
        customerName: 'Rajesh Kumar',
        phone: '+91 98765 00112',
        unread: false,
        lastMessage: 'Here is your personalized Lifestyle Palms 3BHK unit comparison sheet.',
        lastActivity: '11:05 AM',
        aiContext: {
          intent: 'VERY_HIGH',
          suggestedReply: 'Confirm site visit for Saturday 11:00 AM with Google Calendar invite.',
        }
      },
      {
        id: 'wa-002',
        customerName: 'Pooja Gupta',
        phone: '+91 99110 33445',
        unread: true,
        lastMessage: 'Can you share the price list for Tower 4?',
        lastActivity: '10:12 AM',
        aiContext: {
          intent: 'HIGH',
          suggestedReply: 'Send Tower 4 premium inventory brochure with payment schedule.',
        }
      }
    ]
  });
});

export default router;
