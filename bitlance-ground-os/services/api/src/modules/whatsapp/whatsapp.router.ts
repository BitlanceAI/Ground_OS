import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getWhatsAppProvider } from '../../adapters/whatsapp.adapter';

const router = Router();
const whatsappProvider = getWhatsAppProvider();

// GET /api/v1/whatsapp/status
router.get('/status', (_req, res: Response) => {
  const provider = process.env.WHATSAPP_PROVIDER || 'mock';
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const hasToken = Boolean(process.env.WHATSAPP_ACCESS_TOKEN);
  const wabaId = process.env.WHATSAPP_WABA_ID;

  res.json({
    success: true,
    provider,
    phoneNumberId: phoneId || null,
    wabaId: wabaId || null,
    configured: provider === 'meta' ? (hasToken && Boolean(phoneId)) : true,
  });
});

// POST /api/v1/whatsapp/send
router.post('/send', async (req: AuthenticatedRequest, res: Response) => {
  const { to, numbers, message, mediaUrl, templateName, params } = req.body;
  const provider = getWhatsAppProvider();

  const recipientList: string[] = Array.isArray(numbers) && numbers.length > 0
    ? numbers
    : [to || '+919876500112'];

  const results: Array<{ phone: string; status: 'sent' | 'failed'; messageId?: string; error?: string }> = [];

  for (const rawPhone of recipientList) {
    const cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
    if (!cleanPhone) continue;

    try {
      let result;
      if (mediaUrl) {
        result = await provider.sendImage(cleanPhone, mediaUrl, message);
      } else if (templateName) {
        result = await provider.sendTemplate(cleanPhone, templateName, params || []);
      } else {
        result = await provider.sendMessage(cleanPhone, message || 'Hello from Lifestyle Homes');
      }
      results.push({ phone: cleanPhone, status: 'sent', messageId: result.messageId });
    } catch (err: any) {
      console.error(`[WhatsApp API] Failed sending to ${cleanPhone}:`, err?.message || err);
      results.push({ phone: cleanPhone, status: 'failed', error: err?.message || 'Dispatch failed' });
    }
  }

  const allSuccess = results.every(r => r.status === 'sent');
  const someSuccess = results.some(r => r.status === 'sent');

  res.json({
    success: someSuccess,
    allSuccess,
    count: results.length,
    results,
  });
});

// POST /api/v1/whatsapp/send-otp
router.post('/send-otp', async (req: AuthenticatedRequest, res: Response) => {
  const { phone, otp, customerName } = req.body;
  const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');

  if (!cleanPhone || cleanPhone.length < 10) {
    res.status(400).json({ success: false, error: 'Invalid phone number provided' });
    return;
  }

  const generatedOtp = otp || String(Math.floor(1000 + Math.random() * 9000));
  const provider = getWhatsAppProvider();

  const greeting = customerName ? `Hello *${customerName}*,\n\n` : '';
  const otpMessage = 
    `🔐 *LIFESTYLE HOMES — VERIFICATION CODE*\n\n` +
    `${greeting}` +
    `Your 4-digit security code for today's meeting check-in is:\n\n` +
    `*${generatedOtp}*\n\n` +
    `_Valid for 10 minutes. Please present this verification code to your Lifestyle Homes field agent._\n` +
    `• Secure Ground GPS Audit Verification`;

  try {
    // Assuming the template name is 'verification_code' and takes one parameter (the OTP)
    // Update the template name below if your Meta template is named differently
    const result = await provider.sendTemplate(cleanPhone, 'ground_os', [generatedOtp]);
    res.json({
      success: true,
      delivered: true,
      phone: cleanPhone,
      otp: generatedOtp,
      messageId: result.messageId,
      channel: 'whatsapp_cloud_api',
    });
  } catch (err: any) {
    console.warn(`[WhatsApp OTP] Meta Cloud API direct send failed for ${cleanPhone}:`, err?.message);
    // Return graceful fallback details so client can display on-screen / direct-link fallback
    res.json({
      success: true,
      delivered: false,
      fallbackRequired: true,
      error: err?.message || 'Meta Cloud API message initiation error',
      phone: cleanPhone,
      otp: generatedOtp,
      directWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(otpMessage)}`,
    });
  }
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
