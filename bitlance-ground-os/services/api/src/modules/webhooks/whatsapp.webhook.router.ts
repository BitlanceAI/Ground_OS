import { Router, Request, Response } from 'express';
import { logger } from '../../config/logger';

const router = Router();

// GET /webhooks/whatsapp (Verification for WhatsApp Cloud API)
router.get('/', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === (process.env.WHATSAPP_VERIFY_TOKEN || 'ground-os-verify-token')) {
    logger.info('WhatsApp Webhook Verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// POST /webhooks/whatsapp (Inbound WhatsApp events)
router.post('/', (req: Request, res: Response) => {
  logger.info('WhatsApp Inbound Webhook Received:', { body: req.body });
  // Process inbound message asynchronously or fire event
  res.status(200).json({ status: 'received' });
});

export default router;
