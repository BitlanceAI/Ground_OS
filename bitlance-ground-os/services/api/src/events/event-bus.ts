// ============================================================
// EVENT BUS — Typed BullMQ event emission
// All domain events are emitted through here, never directly
// ============================================================

import { Queue } from 'bullmq';
import { BaseEvent, EventName, EVENTS } from '@ground-os/types';
import { randomUUID } from 'crypto';

const redisConnection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
};

// ── Queue registry ─────────────────────────────────────────
const QUEUE_MAP: Record<string, string> = {
  [EVENTS.MEETING_ENDED]:             'ai-transcription',
  [EVENTS.RECORDING_UPLOADED]:        'ai-transcription',
  [EVENTS.TRANSCRIPT_READY]:          'ai-analysis',
  [EVENTS.AI_REPORT_READY]:           'workflow-jobs',
  [EVENTS.WHATSAPP_MESSAGE_RECEIVED]: 'workflow-jobs',
  [EVENTS.CUSTOMER_INACTIVE]:         'workflow-jobs',
  [EVENTS.VOICE_CALL_TRIGGERED]:      'voice-calls',
  [EVENTS.VOICE_CALL_COMPLETED]:      'ai-analysis',
  [EVENTS.CREATIVE_REQUESTED]:        'creative-generation',
  [EVENTS.FOLLOWUP_CREATED]:          'notifications',
  [EVENTS.REQUIREMENT_DETECTED]:      'analytics',
  [EVENTS.LEAD_SCORE_UPDATED]:        'notifications',
  [EVENTS.AGENT_ASSIGNED]:            'notifications',
  [EVENTS.AGENT_ARRIVED]:             'analytics',
  [EVENTS.LOCATION_VERIFIED]:         'analytics',
  [EVENTS.CREATIVE_GENERATED]:        'whatsapp-outbound',
};

// ── Queue cache ────────────────────────────────────────────
const queues = new Map<string, Queue>();

function getQueue(queueName: string): Queue {
  if (!queues.has(queueName)) {
    queues.set(queueName, new Queue(queueName, { connection: redisConnection as any }));
  }
  return queues.get(queueName)!;
}

// ── Emit a typed domain event ─────────────────────────────
export async function emit<T = Record<string, unknown>>(
  eventName: EventName,
  payload: {
    organizationId: string;
    entityId: string;
    entityType: string;
    producer: string;
    data: T;
  }
): Promise<string> {
  const eventId = randomUUID();

  const event: BaseEvent<T> = {
    eventId,
    eventName,
    organizationId: payload.organizationId,
    entityId: payload.entityId,
    entityType: payload.entityType,
    timestamp: new Date().toISOString(),
    producer: payload.producer,
    version: 1,
    payload: payload.data,
  };

  const queueName = QUEUE_MAP[eventName] || 'analytics';

  try {
    const queue = getQueue(queueName);
    await queue.add(eventName, event, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: false, // Keep failed jobs for investigation
    });

    console.log(`[EventBus] ✅ Emitted ${eventName} → queue:${queueName} (eventId: ${eventId})`);
  } catch (err) {
    // If Redis is unavailable, log but don't crash the main request
    console.warn(`[EventBus] ⚠️ Failed to emit ${eventName} (Redis unavailable?): ${(err as Error).message}`);
  }

  return eventId;
}

// ── Convenience emitters ───────────────────────────────────
export const eventBus = {
  agentAssigned: (orgId: string, data: { agentId: string; customerId: string; visitId: string; scheduledAt: string }) =>
    emit(EVENTS.AGENT_ASSIGNED, { organizationId: orgId, entityId: data.visitId, entityType: 'visit', producer: 'api', data }),

  agentArrived: (orgId: string, data: { agentId: string; visitId: string; latitude: number; longitude: number }) =>
    emit(EVENTS.AGENT_ARRIVED, { organizationId: orgId, entityId: data.visitId, entityType: 'visit', producer: 'api', data }),

  meetingStarted: (orgId: string, data: { meetingId: string; agentId: string; customerId: string; visitId: string }) =>
    emit(EVENTS.MEETING_STARTED, { organizationId: orgId, entityId: data.meetingId, entityType: 'meeting', producer: 'api', data }),

  meetingEnded: (orgId: string, data: { meetingId: string; agentId: string; customerId: string; duration: number }) =>
    emit(EVENTS.MEETING_ENDED, { organizationId: orgId, entityId: data.meetingId, entityType: 'meeting', producer: 'api', data }),

  recordingUploaded: (orgId: string, data: { meetingId: string; audioUrl: string; durationSeconds: number }) =>
    emit(EVENTS.RECORDING_UPLOADED, { organizationId: orgId, entityId: data.meetingId, entityType: 'meeting', producer: 'api', data }),

  transcriptReady: (orgId: string, data: { meetingId: string; transcript: string; confidence: number }) =>
    emit(EVENTS.TRANSCRIPT_READY, { organizationId: orgId, entityId: data.meetingId, entityType: 'meeting', producer: 'worker', data }),

  aiReportReady: (orgId: string, data: { meetingId: string; customerId: string; leadScore: number; intentLevel: string }) =>
    emit(EVENTS.AI_REPORT_READY, { organizationId: orgId, entityId: data.meetingId, entityType: 'meeting', producer: 'worker', data }),

  whatsappMessageReceived: (orgId: string, data: { messageId: string; conversationId: string; customerId?: string; from: string }) =>
    emit(EVENTS.WHATSAPP_MESSAGE_RECEIVED, { organizationId: orgId, entityId: data.messageId, entityType: 'message', producer: 'webhook', data }),

  customerInactive: (orgId: string, data: { customerId: string; conversationId: string; inactiveMinutes: number; lastMessageAt: string }) =>
    emit(EVENTS.CUSTOMER_INACTIVE, { organizationId: orgId, entityId: data.customerId, entityType: 'customer', producer: 'worker', data }),

  voiceCallTriggered: (orgId: string, data: { callId: string; customerId: string; to: string; reason: string }) =>
    emit(EVENTS.VOICE_CALL_TRIGGERED, { organizationId: orgId, entityId: data.callId, entityType: 'voice_call', producer: 'api', data }),

  voiceCallCompleted: (orgId: string, data: { callId: string; customerId: string; duration: number; outcome: string; transcript?: string }) =>
    emit(EVENTS.VOICE_CALL_COMPLETED, { organizationId: orgId, entityId: data.callId, entityType: 'voice_call', producer: 'webhook', data }),

  creativeRequested: (orgId: string, data: { requestId: string; customerId: string; type: string; brief: object }) =>
    emit(EVENTS.CREATIVE_REQUESTED, { organizationId: orgId, entityId: data.requestId, entityType: 'creative_request', producer: 'api', data }),

  creativeGenerated: (orgId: string, data: { requestId: string; customerId: string; assetUrl: string }) =>
    emit(EVENTS.CREATIVE_GENERATED, { organizationId: orgId, entityId: data.requestId, entityType: 'creative_request', producer: 'worker', data }),

  followupCreated: (orgId: string, data: { followupId: string; customerId: string; type: string; dueAt: string }) =>
    emit(EVENTS.FOLLOWUP_CREATED, { organizationId: orgId, entityId: data.followupId, entityType: 'follow_up', producer: 'api', data }),

  leadScoreUpdated: (orgId: string, data: { customerId: string; leadId: string; previousScore: number; newScore: number; intentLevel: string }) =>
    emit(EVENTS.LEAD_SCORE_UPDATED, { organizationId: orgId, entityId: data.leadId, entityType: 'lead', producer: 'worker', data }),

  requirementDetected: (orgId: string, data: { customerId: string; meetingId: string; requirement: object }) =>
    emit(EVENTS.REQUIREMENT_DETECTED, { organizationId: orgId, entityId: data.customerId, entityType: 'customer', producer: 'worker', data }),
};
