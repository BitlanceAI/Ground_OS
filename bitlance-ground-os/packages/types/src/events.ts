// ============================================================
// BITLANCE GROUND OS — All 17 Domain Events
// ============================================================

export const EVENTS = {
  // Field Operations
  AGENT_ASSIGNED: 'AGENT_ASSIGNED',
  AGENT_ARRIVED: 'AGENT_ARRIVED',
  LOCATION_VERIFIED: 'LOCATION_VERIFIED',

  // Meeting
  MEETING_STARTED: 'MEETING_STARTED',
  MEETING_ENDED: 'MEETING_ENDED',
  RECORDING_UPLOADED: 'RECORDING_UPLOADED',
  TRANSCRIPT_READY: 'TRANSCRIPT_READY',
  AI_REPORT_READY: 'AI_REPORT_READY',

  // Lead Intelligence
  REQUIREMENT_DETECTED: 'REQUIREMENT_DETECTED',
  LEAD_SCORE_UPDATED: 'LEAD_SCORE_UPDATED',

  // Conversations
  WHATSAPP_MESSAGE_RECEIVED: 'WHATSAPP_MESSAGE_RECEIVED',
  CUSTOMER_INACTIVE: 'CUSTOMER_INACTIVE',

  // Voice
  VOICE_CALL_TRIGGERED: 'VOICE_CALL_TRIGGERED',
  VOICE_CALL_COMPLETED: 'VOICE_CALL_COMPLETED',

  // Creative
  CREATIVE_REQUESTED: 'CREATIVE_REQUESTED',
  CREATIVE_GENERATED: 'CREATIVE_GENERATED',

  // Follow-up
  FOLLOWUP_CREATED: 'FOLLOWUP_CREATED',
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// ── Base event payload ─────────────────────────────────────
export interface BaseEvent<T = Record<string, unknown>> {
  eventId: string;
  eventName: EventName;
  organizationId: string;
  entityId: string;
  entityType: string;
  timestamp: string;
  producer: string;
  version: number;
  payload: T;
}

// ── Typed event payloads ───────────────────────────────────
export interface AgentAssignedPayload {
  agentId: string;
  customerId: string;
  visitId: string;
  scheduledAt: string;
}

export interface AgentArrivedPayload {
  agentId: string;
  visitId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface LocationVerifiedPayload {
  agentId: string;
  visitId: string;
  latitude: number;
  longitude: number;
}

export interface MeetingStartedPayload {
  meetingId: string;
  agentId: string;
  customerId: string;
  visitId?: string;
}

export interface MeetingEndedPayload {
  meetingId: string;
  durationSeconds: number;
  recordingKey?: string;
}

export interface RecordingUploadedPayload {
  meetingId: string;
  recordingId: string;
  storageKey: string;
  durationSeconds: number;
}

export interface TranscriptReadyPayload {
  meetingId: string;
  transcriptId: string;
}

export interface AiReportReadyPayload {
  meetingId: string;
  insightId: string;
  leadScore: number;
  intentLevel: string;
  objectionsCount: number;
}

export interface RequirementDetectedPayload {
  customerId: string;
  requirementId: string;
  source: string;
  confidence: number;
}

export interface LeadScoreUpdatedPayload {
  leadId: string;
  customerId: string;
  previousScore: number;
  newScore: number;
  reason: string;
}

export interface WhatsAppMessageReceivedPayload {
  conversationId: string;
  messageId: string;
  customerId: string;
  content: string;
  intent?: string;
}

export interface CustomerInactivePayload {
  customerId: string;
  conversationId: string;
  inactiveMinutes: number;
  lastMessageAt: string;
}

export interface VoiceCallTriggeredPayload {
  voiceCallId: string;
  customerId: string;
  conversationId?: string;
  triggerReason: string;
}

export interface VoiceCallCompletedPayload {
  voiceCallId: string;
  customerId: string;
  duration: number;
  outcome: string;
}

export interface CreativeRequestedPayload {
  creativeRequestId: string;
  customerId?: string;
  type: string;
}

export interface CreativeGeneratedPayload {
  creativeRequestId: string;
  assetUrl: string;
}

export interface FollowUpCreatedPayload {
  followUpId: string;
  customerId: string;
  type: string;
  dueAt: string;
}
