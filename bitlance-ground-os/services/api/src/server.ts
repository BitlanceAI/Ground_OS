// ============================================================
// BITLANCE GROUND OS — API Server Entry Point
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { logger } from './config/logger';

// Routes
import authRouter from './modules/auth/auth.router';
import agentsRouter from './modules/agents/agents.router';
import customersRouter from './modules/customers/customers.router';
import leadsRouter from './modules/leads/leads.router';
import visitsRouter from './modules/visits/visits.router';
import meetingsRouter from './modules/meetings/meetings.router';
import requirementsRouter from './modules/requirements/requirements.router';
import conversationsRouter from './modules/conversations/conversations.router';
import whatsappRouter from './modules/whatsapp/whatsapp.router';
import voiceRouter from './modules/voice/voice.router';
import aiRouter from './modules/ai/ai.router';
import creativesRouter from './modules/creatives/creatives.router';
import workflowsRouter from './modules/workflows/workflows.router';
import analyticsRouter from './modules/analytics/analytics.router';
import inventoryRouter from './modules/inventory/inventory.router';
import webhooksWhatsAppRouter from './modules/webhooks/whatsapp.webhook.router';
import webhooksVoiceRouter from './modules/webhooks/voice.webhook.router';

// Middleware
import { authMiddleware } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { requestId } from './middleware/requestId.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';

const app = express();
const PORT = process.env.API_PORT || 4000;

// ── Global Middleware ──────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}));
app.use(requestId);
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Webhook routes get raw body (before JSON parse)
app.use('/webhooks/whatsapp', express.raw({ type: 'application/json' }), webhooksWhatsAppRouter);
app.use('/webhooks/voice', express.raw({ type: 'application/json' }), webhooksVoiceRouter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health Check ───────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ status: 'ok', service: 'ground-os-api', timestamp: new Date().toISOString() });
});

// ── Public Routes ──────────────────────────────────────────
app.use('/api/v1/auth', authRouter);

// ── Protected Routes ───────────────────────────────────────
app.use('/api/v1', authMiddleware, tenantMiddleware);
app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/customers', customersRouter);
app.use('/api/v1/leads', leadsRouter);
app.use('/api/v1/visits', visitsRouter);
app.use('/api/v1/meetings', meetingsRouter);
app.use('/api/v1/requirements', requirementsRouter);
app.use('/api/v1/conversations', conversationsRouter);
app.use('/api/v1/whatsapp', whatsappRouter);
app.use('/api/v1/voice', voiceRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/creatives', creativesRouter);
app.use('/api/v1/workflows', workflowsRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/inventory', inventoryRouter);

// ── Error Handler ──────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`🚀 Bitlance Ground OS API running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
