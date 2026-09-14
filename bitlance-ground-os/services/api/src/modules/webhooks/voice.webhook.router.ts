import { Router, Request, Response } from 'express';
import { logger } from '../../config/logger';

const router = Router();

// POST /webhooks/voice (Voice AI status & transcript callbacks)
router.post('/', (req: Request, res: Response) => {
  const { callId, status, transcript, recordingUrl } = req.body;
  logger.info('Voice AI Webhook Callback Received:', { callId, status, transcriptLength: transcript?.length });
  res.status(200).json({ status: 'processed', callId });
});

export default router;
