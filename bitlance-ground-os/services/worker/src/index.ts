import { setupAnalyticsWorker } from './processors/analytics';
import { setupWorkflowJobsWorker } from './processors/workflow_jobs';
import { setupNotificationsWorker } from './processors/notifications';
import { setupCreativeGenerationWorker } from './processors/creative_generation';
import { setupVoiceCallsWorker } from './processors/voice_calls';
import { setupWhatsappOutboundWorker } from './processors/whatsapp_outbound';
import { setupAiAnalysisWorker } from './processors/ai_analysis';
import { setupAiTranscriptionWorker } from './processors/ai_transcription';
// ============================================================
// BITLANCE GROUND OS — BullMQ Background Worker
// Real job processors for all 8 queues
// ============================================================

import { Worker, Job, Queue } from 'bullmq';
import winston from 'winston';
import prisma from '@ground-os/database';
import {
  getSttProvider,
  getWhatsAppProvider,
  getVoiceProvider,
  getCreativeProvider,
  getAiOrchestrator,
} from './adapters/providers';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ level, message, timestamp }) => `[${timestamp}] [Worker] ${level}: ${message}`)
  ),
  transports: [new winston.transports.Console()],
});

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
};

// ── In-worker event bus helper ─────────────────────────────
const queueCache = new Map<string, Queue>();
function getQueue(queueName: string): Queue {
  if (!queueCache.has(queueName)) {
    queueCache.set(queueName, new Queue(queueName, { connection: redisConnection as any }));
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

logger.info(`⚡ Initializing BullMQ Worker with ${queues.length} background job queues...`);

// ── Initialize Processors ────────────────────────────────
const providers = { sttProvider, whatsappProvider, voiceProvider, creativeProvider, aiOrchestrator };

const allWorkers: Worker[] = [
  setupAiTranscriptionWorker(redisConnection, eventBus, providers, logger),
  setupAiAnalysisWorker(redisConnection, eventBus, providers, logger),
  setupWhatsappOutboundWorker(redisConnection, eventBus, providers, logger),
  setupVoiceCallsWorker(redisConnection, eventBus, providers, logger),
  setupCreativeGenerationWorker(redisConnection, eventBus, providers, logger),
  setupNotificationsWorker(redisConnection, eventBus, providers, logger),
  setupWorkflowJobsWorker(redisConnection, eventBus, providers, logger),
  setupAnalyticsWorker(redisConnection, eventBus, providers, logger),
];

// Register all named workers so shutdown can drain them
for (const w of allWorkers) {
  w.on('error', (err) => logger.error(`[Worker error] ${err.message}`));
}

// ── Graceful shutdown ─────────────────────────────────────
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — draining in-flight jobs before exit...');
  await Promise.all(allWorkers.map((w) => w.close()));
  logger.info('All workers closed. Exiting.');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received — draining in-flight jobs before exit...');
  await Promise.all(allWorkers.map((w) => w.close()));
  process.exit(0);
});
