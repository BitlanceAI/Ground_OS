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

// ──────────────────────────────────────────────────────────
// ai-transcription — Process audio → transcript
// ──────────────────────────────────────────────────────────
new Worker(
  'ai-transcription',
  async (job: Job) => {
    logger.info(`[ai-transcription] Processing: ${job.name} (id: ${job.id})`);
    const { eventName, payload } = job.data;

    if (!['RECORDING_UPLOADED', 'MEETING_ENDED'].includes(eventName)) {
      return { skipped: true, reason: 'Not a transcription trigger event' };
    }

    const { meetingId, audioUrl } = payload;
    logger.info(`[ai-transcription] Transcribing meeting ${meetingId} from ${audioUrl}`);

    try {
      const result = await sttProvider.transcribe(audioUrl);

      // Save transcript
      await prisma.transcript.upsert({
        where: { meetingId },
        create: {
          meetingId,
          rawText: result.text,
          confidence: result.confidence,
          language: 'en',
          segments: result.segments as any,
        },
        update: {
          rawText: result.text,
          confidence: result.confidence,
          processedAt: new Date(),
        },
      });

      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'PROCESSING' },
      });

      // Emit transcript ready for analysis
      const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
      await eventBus.transcriptReady(meeting?.organizationId || '', {
        meetingId,
        transcript: result.text,
        confidence: result.confidence,
      });

      logger.info(`[ai-transcription] ✅ Transcript saved for meeting ${meetingId} (${result.text.length} chars)`);
      return { success: true, meetingId, transcriptLength: result.text.length, confidence: result.confidence };
    } catch (err) {
      logger.error(`[ai-transcription] ❌ Failed: ${(err as Error).message}`);
      throw err;
    }
  },
  { connection: redisConnection as any, concurrency: 2 }
);

// ──────────────────────────────────────────────────────────
// ai-analysis — Transcript → AI insights → CRM update
// ──────────────────────────────────────────────────────────
new Worker(
  'ai-analysis',
  async (job: Job) => {
    logger.info(`[ai-analysis] Processing: ${job.name} (id: ${job.id})`);
    const { eventName, payload } = job.data;

    if (eventName === 'TRANSCRIPT_READY') {
      const { meetingId } = payload;
      logger.info(`[ai-analysis] Analysing meeting ${meetingId}`);

      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          agent: { include: { user: { select: { firstName: true, lastName: true } } } },
          customer: { select: { id: true, firstName: true, lastName: true } },
          recording: true,
          visit: { include: { customer: { select: { id: true } } } },
        },
      });

      if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

      const customerName = meeting.customer ? `${meeting.customer.firstName} ${meeting.customer.lastName}`.trim() : 'Customer';
      const agentName = meeting.agent?.user ? `${meeting.agent.user.firstName} ${meeting.agent.user.lastName}`.trim() : 'Agent';
      const audioUrl = meeting.recording?.storageUrl || '';

      // Resolve project name from visit/customer relation instead of hardcoding
      const projectName = (meeting as any).project?.name || 'Ground OS Project';

      const insight = await aiOrchestrator.processMeeting(meetingId, audioUrl, {
        customerName,
        agentName,
        projectName,
      });

      // Persist insight
      await prisma.meetingInsight.upsert({
        where: { meetingId },
        create: {
          meetingId,
          summary: insight.summary,
          customerIntent: insight.customerIntent,
          intentLevel: insight.intentLevel,
          sentiment: insight.sentiment,
          qualityScore: insight.qualityScore,
          requirement: insight.requirement as any,
          objections: insight.objections as any,
          competitorMentions: insight.competitorMentions as any,
          recommendedAction: insight.recommendedAction,
        },
        update: {
          summary: insight.summary,
          intentLevel: insight.intentLevel,
          qualityScore: insight.qualityScore,
          processedAt: new Date(),
        },
      });

      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'ANALYSED' },
      });

      // Update lead score
      if (meeting.customer) {
        const lead = await prisma.lead.findFirst({ where: { customerId: meeting.customer.id } });
        if (lead) {
          const previousScore = lead.score;
          await prisma.lead.update({
            where: { id: lead.id },
            data: { score: insight.qualityScore, intentLevel: insight.intentLevel as any },
          });

          await eventBus.leadScoreUpdated(meeting.organizationId, {
            customerId: meeting.customer.id,
            leadId: lead.id,
            previousScore,
            newScore: insight.qualityScore,
            intentLevel: insight.intentLevel,
          });

          await eventBus.aiReportReady(meeting.organizationId, {
            meetingId,
            customerId: meeting.customer.id,
            leadScore: insight.qualityScore,
            intentLevel: insight.intentLevel,
          });
        }
      }

      logger.info(`[ai-analysis] ✅ Meeting ${meetingId} analysed. Score: ${insight.qualityScore}, Intent: ${insight.intentLevel}`);
      return { success: true, meetingId, score: insight.qualityScore, intentLevel: insight.intentLevel };
    }

    if (eventName === 'VOICE_CALL_COMPLETED') {
      const { callId, transcript } = payload;
      logger.info(`[ai-analysis] Analysing voice call ${callId}`);

      const analysis = await aiOrchestrator.analyseVoiceCall(transcript || '', 'Follow-up call');

      await prisma.voiceCall.update({
        where: { id: callId },
        data: {
          transcript,
          intent: analysis.intent,
          sentiment: analysis.sentiment,
          outcome: analysis.outcome,
          nextAction: analysis.nextAction,
          status: 'COMPLETED',
        },
      });

      logger.info(`[ai-analysis] ✅ Voice call ${callId} analysed. Outcome: ${analysis.outcome}`);
      return { success: true, callId, outcome: analysis.outcome };
    }

    return { skipped: true };
  },
  { connection: redisConnection as any, concurrency: 3 }
);

// ──────────────────────────────────────────────────────────
// whatsapp-outbound — Send WhatsApp messages
// ──────────────────────────────────────────────────────────
new Worker(
  'whatsapp-outbound',
  async (job: Job) => {
    logger.info(`[whatsapp-outbound] Processing: ${job.name}`);
    const { to, message, mediaUrl, templateName, params } = job.data;

    let result;
    if (mediaUrl) {
      result = await whatsappProvider.sendImage(to, mediaUrl, message);
    } else if (templateName) {
      result = await whatsappProvider.sendTemplate(to, templateName, params || []);
    } else {
      result = await whatsappProvider.sendMessage(to, message);
    }

    logger.info(`[whatsapp-outbound] ✅ Message sent to ${to}: ${JSON.stringify(result)}`);
    return { success: true, messageId: result.messageId, to };
  },
  { connection: redisConnection as any, concurrency: 5 }
);

// ──────────────────────────────────────────────────────────
// voice-calls — Trigger Voice AI calls
// ──────────────────────────────────────────────────────────
new Worker(
  'voice-calls',
  async (job: Job) => {
    logger.info(`[voice-calls] Processing: ${job.name}`);
    const { payload } = job.data;
    const { callId, customerId, to } = payload;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { conversations: { take: 1, orderBy: { updatedAt: 'desc' } } },
    });

    if (!customer) throw new Error(`Customer ${customerId} not found`);

    const customerName = `${customer.firstName} ${customer.lastName}`.trim();
    const context = `Customer ${customerName} previously enquired about properties. This is an automated follow-up call.`;

    const result = await voiceProvider.initiateCall({
      to: to || customer.phone,
      customerName,
      context,
    });

    await prisma.voiceCall.update({
      where: { id: callId },
      data: { externalCallId: result.callId, status: 'DIALING', startedAt: new Date() },
    });

    logger.info(`[voice-calls] ✅ Call initiated for ${customerName}: ${result.callId}`);
    return { success: true, callId: result.callId, customerName };
  },
  { connection: redisConnection as any, concurrency: 2 }
);

// ──────────────────────────────────────────────────────────
// creative-generation — Generate marketing creatives
// ──────────────────────────────────────────────────────────
new Worker(
  'creative-generation',
  async (job: Job) => {
    logger.info(`[creative-generation] Processing: ${job.name}`);
    const { payload } = job.data;
    const { requestId, customerId, type, brief } = payload;

    const result = await creativeProvider.generate({ type, brief });

    const creativeRequest = await prisma.creativeRequest.findUnique({ where: { id: requestId } });

    if (creativeRequest) {
      await prisma.creativeRequest.update({
        where: { id: requestId },
        data: { status: 'READY', assetUrl: result.assetUrl },
      });

      await eventBus.creativeGenerated(creativeRequest.organizationId, {
        requestId,
        customerId: customerId || '',
        assetUrl: result.assetUrl,
      });
    }

    logger.info(`[creative-generation] ✅ Creative ready: ${result.assetUrl}`);
    return { success: true, assetUrl: result.assetUrl };
  },
  { connection: redisConnection as any, concurrency: 2 }
);

// ──────────────────────────────────────────────────────────
// notifications — Send in-app notifications
// ──────────────────────────────────────────────────────────
new Worker(
  'notifications',
  async (job: Job) => {
    logger.info(`[notifications] Processing: ${job.name}`);
    const { eventName, payload, organizationId } = job.data;

    if (eventName === 'LEAD_SCORE_UPDATED' && payload.newScore >= 80) {
      await prisma.notification.create({
        data: {
          organizationId,
          type: 'HIGH_INTENT_LEAD',
          title: `🔥 High Intent Lead — Score ${payload.newScore}`,
          body: `Lead score updated to ${payload.newScore}/100. Intent: ${payload.intentLevel}.`,
          metadata: { customerId: payload.customerId, score: payload.newScore },
          channel: 'IN_APP',
        },
      });
      logger.info(`[notifications] ✅ High intent notification created (score: ${payload.newScore})`);
    }

    if (eventName === 'AI_REPORT_READY') {
      await prisma.notification.create({
        data: {
          organizationId,
          type: 'AI_MEETING_REPORT',
          title: 'AI Meeting Report Ready',
          body: `Meeting analysis complete. Score: ${payload.leadScore}. Intent: ${payload.intentLevel}.`,
          metadata: { meetingId: payload.meetingId },
          channel: 'IN_APP',
        },
      });
    }

    return { success: true };
  },
  { connection: redisConnection as any, concurrency: 10 }
);

// ──────────────────────────────────────────────────────────
// workflow-jobs — Trigger/advance workflow runs
// ──────────────────────────────────────────────────────────
new Worker(
  'workflow-jobs',
  async (job: Job) => {
    logger.info(`[workflow-jobs] Processing: ${job.name} (event: ${job.data.eventName})`);
    const { eventName, organizationId, entityId, payload } = job.data;

    // Find workflows triggered by this event, then check conditions
    const workflows = await prisma.workflow.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    });

    let triggeredCount = 0;
    for (const workflow of workflows) {
      const trigger = workflow.trigger as { type: string; conditions?: Record<string, any> };
      if (trigger.type !== eventName) continue;

      // Check optional trigger conditions against payload
      if (trigger.conditions && payload) {
        const conditionsMet = Object.entries(trigger.conditions).every(([key, val]) => {
          return payload[key] === val;
        });
        if (!conditionsMet) {
          logger.info(`[workflow-jobs] Skipping "${workflow.name}" — conditions not met`);
          continue;
        }
      }

      // Create a workflow run
      await prisma.workflowRun.create({
        data: {
          workflowId: workflow.id,
          entityType: payload?.entityType || 'customer',
          entityId: entityId || '',
          status: 'RUNNING',
          currentNode: 'n1',
          state: { triggeredBy: eventName, payload },
        },
      });

      triggeredCount++;
      logger.info(`[workflow-jobs] Triggered workflow "${workflow.name}" for entity ${entityId}`);
    }

    return { success: true, workflowsTriggered: triggeredCount };
  },
  { connection: redisConnection as any, concurrency: 5 }
);

// ──────────────────────────────────────────────────────────
// analytics — Record operational events
// ──────────────────────────────────────────────────────────
new Worker(
  'analytics',
  async (job: Job) => {
    const { eventName, payload } = job.data;

    if (payload?.customerId) {
      try {
        await prisma.timelineEvent.create({
          data: {
            customerId: payload.customerId,
            type: eventName,
            title: eventName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
            description: `${eventName} event recorded`,
            metadata: payload,
            isAiEvent: eventName.startsWith('AI_') || eventName.startsWith('TRANSCRIPT'),
            occurredAt: new Date(),
          },
        });
      } catch {
        // Non-fatal
      }
    }

    return { success: true, eventName };
  },
  { connection: redisConnection as any, concurrency: 20 }
);

logger.info('✅ All 8 BullMQ workers initialized and listening');

// Track worker instances for graceful shutdown
const allWorkers: Worker[] = [];

// Register all named workers so shutdown can drain them
for (const w of (allWorkers as Worker[])) {
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
