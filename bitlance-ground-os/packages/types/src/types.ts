// ============================================================
// BITLANCE GROUND OS — Shared Domain Types
// ============================================================

// ── User & Auth ────────────────────────────────────────────
export type UserRole = 'CEO' | 'CTO' | 'SALES_MANAGER' | 'AGENT' | 'DEVELOPER' | 'MARKETING' | 'ADMIN';

export interface AuthUser {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ── Agent ──────────────────────────────────────────────────
export type AgentStatus = 'OFFLINE' | 'ONLINE' | 'EN_ROUTE' | 'AT_LOCATION' | 'IN_MEETING';

export interface AgentLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

// ── Visit ──────────────────────────────────────────────────
export type VisitStatus =
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ARRIVED'
  | 'LOCATION_VERIFIED'
  | 'MEETING_STARTED'
  | 'MEETING_ENDED'
  | 'AI_PROCESSING'
  | 'REPORT_READY'
  | 'COMPLETED'
  | 'MISSED'
  | 'CANCELLED';

// ── Meeting ────────────────────────────────────────────────
export type MeetingStatus = 'STARTED' | 'RECORDING' | 'ENDED' | 'UPLOADING' | 'PROCESSING' | 'ANALYSED' | 'FAILED';

export interface MeetingQualityBreakdown {
  requirementDiscovery: number;
  customerEngagement: number;
  objectionHandling: number;
  productKnowledge: number;
  closingAttempt: number;
  followUpClarity: number;
}

// ── Lead ───────────────────────────────────────────────────
export type IntentLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'SITE_VISIT_SCHEDULED' | 'NEGOTIATING' | 'CONVERTED' | 'LOST' | 'DORMANT';

// ── AI ─────────────────────────────────────────────────────
export interface AiInsight {
  summary: string;
  customerIntent: string;
  intentLevel: IntentLevel;
  requirement: RequirementData;
  objections: Objection[];
  competitorMentions: CompetitorMention[];
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  recommendedAction: string;
  qualityScore: number;
}

export interface Objection {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CompetitorMention {
  name: string;
  project?: string;
  pricePoint?: number;
  location?: string;
}

export interface RequirementData {
  propertyType?: string;
  configuration?: string;
  budgetMin?: number;
  budgetMax?: number;
  location?: string;
  purpose?: string;
  timeline?: string;
  amenities?: string[];
  parking?: boolean;
  paymentPreference?: string;
}

// ── AI Priority Feed ───────────────────────────────────────
export type AiFeedItemType = 'HIGH_INTENT' | 'FOLLOW_UP_RISK' | 'MARKET_SIGNAL' | 'AGENT_COACHING';

export interface AiFeedItem {
  id: string;
  type: AiFeedItemType;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  body: string;
  customerId?: string;
  agentId?: string;
  actionLabel?: string;
  actionRoute?: string;
  timestamp: string;
}

// ── Timeline Event ─────────────────────────────────────────
export interface TimelineEventData {
  id: string;
  type: string;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  isAiEvent: boolean;
  occurredAt: string;
}

// ── Workflow ───────────────────────────────────────────────
export type WorkflowNodeType =
  | 'TRIGGER'
  | 'CONDITION'
  | 'DELAY'
  | 'AI'
  | 'MESSAGE'
  | 'VOICE'
  | 'CRM_UPDATE'
  | 'CREATIVE'
  | 'HUMAN_APPROVAL'
  | 'WEBHOOK'
  | 'ANALYTICS';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  label: string;
  config?: Record<string, unknown>;
  next?: string | null;
  onFail?: string | null;
}

// ── Analytics ──────────────────────────────────────────────
export interface ConversionFunnel {
  visits: number;
  meetings: number;
  qualified: number;
  siteVisits: number;
  deals: number;
}

export interface ExecutiveMetrics {
  activeAgents: number;
  liveVisits: number;
  meetingsToday: number;
  highIntentLeads: number;
  aiFollowUps: number;
  pipelineValue: number;
}
