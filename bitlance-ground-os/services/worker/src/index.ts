// ============================================================
// BITLANCE GROUND OS — In-Memory Background Worker
// Real job processors for all 8 queues with zero Redis requirement
// Listens on HTTP /jobs to receive events from API
// ============================================================

import http from 'http';
import winston from 'winston';
import prisma from '@ground-os/database';
import { Worker, Queue } from './queue';
import { setupAnalyticsWorker } from './processors/analytics';
import { setupWorkflowJobsWorker } from './processors/workflow_jobs';
import { setupNotificationsWorker } from './processors/notifications';
import { setupCreativeGenerationWorker } from './processors/creative_generation';
import { setupVoiceCallsWorker } from './processors/voice_calls';
import { setupWhatsappOutboundWorker } from './processors/whatsapp_outbound';
import { setupAiAnalysisWorker } from './processors/ai_analysis';
import { setupAiTranscriptionWorker } from './processors/ai_transcription';
import {
  getSttProvider,
  getWhatsAppProvider,
  getVoiceProvider,
  getCreativeProvider,
  getAiOrchestrator,
} from './adapters/providers';

const WORKER_PORT = parseInt(process.env.WORKER_PORT || '4002', 10);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp }) => `[${timestamp}] [Worker] ${level}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

// ── In-worker event bus helper ─────────────────────────────
const queueCache = new Map<string, Queue>();
function getQueue(queueName: string): Queue {
  if (!queueCache.has(queueName)) {
    queueCache.set(queueName, new Queue(queueName));
  }
  return queueCache.get(queueName)!;
}

const eventBus = {
  async transcriptReady(orgId: string, data: { meetingId: string; transcript: string; confidence: number }) {
    await getQueue('ai-analysis').add('TRANSCRIPT_READY', { eventName: 'TRANSCRIPT_READY', organizationId: orgId, payload: data });
  },
  async leadScoreUpdated(orgId: string, data: { customerId: string; leadId: string; previousScore: number; newScore: number; intentLevel: string }) {
    await getQueue('notifications').add('LEAD_SCORE_UPDATED', { eventName: 'LEAD_SCORE_UPDATED', organizationId: orgId, payload: data });
  },
  async aiReportReady(orgId: string, data: { meetingId: string; customerId: string; leadScore: number; intentLevel: string }) {
    await getQueue('notifications').add('AI_REPORT_READY', { eventName: 'AI_REPORT_READY', organizationId: orgId, payload: data });
  },
  async creativeGenerated(orgId: string, data: { requestId: string; customerId: string; assetUrl: string }) {
    await getQueue('whatsapp-outbound').add('CREATIVE_GENERATED', { eventName: 'CREATIVE_GENERATED', organizationId: orgId, payload: data });
  },
};

// ── Provider instances (env-driven, with mock fallbacks) ───
const sttProvider = getSttProvider();
const whatsappProvider = getWhatsAppProvider();
const voiceProvider = getVoiceProvider();
const creativeProvider = getCreativeProvider();
const aiOrchestrator = getAiOrchestrator();

// ── Queue Processors ───────────────────────────────────────
const queues = [
  'ai-transcription',
  'ai-analysis',
  'whatsapp-outbound',
  'voice-calls',
  'creative-generation',
  'notifications',
  'workflow-jobs',
  'analytics',
];

logger.info(`⚡ Initializing in-memory Worker with ${queues.length} background job queues (Zero Redis)...`);

// ── Initialize Processors ────────────────────────────────
const providers = { sttProvider, whatsappProvider, voiceProvider, creativeProvider, aiOrchestrator };
const dummyConnection = {};

const allWorkers: Worker[] = [
  setupAiTranscriptionWorker(dummyConnection, eventBus, providers, logger),
  setupAiAnalysisWorker(dummyConnection, eventBus, providers, logger),
  setupWhatsappOutboundWorker(dummyConnection, eventBus, providers, logger),
  setupVoiceCallsWorker(dummyConnection, eventBus, providers, logger),
  setupCreativeGenerationWorker(dummyConnection, eventBus, providers, logger),
  setupNotificationsWorker(dummyConnection, eventBus, providers, logger),
  setupWorkflowJobsWorker(dummyConnection, eventBus, providers, logger),
  setupAnalyticsWorker(dummyConnection, eventBus, providers, logger),
];

// Register all named workers so shutdown can drain them
for (const w of allWorkers) {
  w.on('error', (err) => logger.error(`[Worker error] ${err.message}`));
}

// ── HTTP Job Server (receives jobs from API) ─────────────
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/jobs') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const { queueName, eventName, data } = JSON.parse(body || '{}');
        const queue = getQueue(queueName);
        await queue.add(eventName, data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(WORKER_PORT, () => {
  logger.info(`⚡ Worker HTTP job listener running on http://localhost:${WORKER_PORT}/jobs`);
});

// ── Graceful shutdown ─────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — draining workers and stopping server...');
  server.close();
  await Promise.all(allWorkers.map((w) => w.close()));
  logger.info('All workers closed. Exiting.');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — draining workers and stopping server...');
  server.close();
  await Promise.all(allWorkers.map((w) => w.close()));
  process.exit(0);
});
