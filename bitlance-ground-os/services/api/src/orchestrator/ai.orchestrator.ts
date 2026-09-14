// ============================================================
// AI ORCHESTRATOR — Central AI operations layer
// All AI logic lives here, not scattered across modules
// ============================================================

import { MeetingInsight, Transcript } from '@prisma/client';
import { getLLMProvider } from '../adapters/llm.adapter';
import { getSTTProvider } from '../adapters/stt.adapter';
import { AiInsight, RequirementData, Objection, CompetitorMention } from '@ground-os/types';

export class AiOrchestrator {
  private llm = getLLMProvider();
  private stt = getSTTProvider();

  // ── Transcription ─────────────────────────────────────────
  async transcribe(audioUrl: string, language = 'en'): Promise<{
    text: string;
    segments: Array<{ speaker: string; start: number; end: number; text: string }>;
    confidence: number;
  }> {
    return this.stt.transcribe(audioUrl, language);
  }

  // ── Summarize meeting transcript ──────────────────────────
  async summarize(transcript: string): Promise<string> {
    return this.llm.complete({
      system: 'You are an expert real estate sales analyst. Summarize the following meeting transcript concisely, focusing on customer intent, requirements, and key outcomes.',
      prompt: transcript,
    });
  }

  // ── Extract structured requirements ───────────────────────
  async extractRequirements(transcript: string): Promise<RequirementData> {
    const raw = await this.llm.structuredComplete<RequirementData>({
      system: 'Extract normalized customer property requirements from this transcript. Return JSON with fields: propertyType, configuration, budgetMin, budgetMax, location, purpose, timeline, amenities, parking, paymentPreference.',
      prompt: transcript,
      schema: 'RequirementData',
    });
    return raw;
  }

  // ── Classify intent ────────────────────────────────────────
  async classifyIntent(transcript: string): Promise<{
    intent: string;
    intentLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    confidence: number;
  }> {
    return this.llm.structuredComplete({
      system: 'Classify customer purchase intent from this real estate sales transcript. Return JSON with: intent (string description), intentLevel (LOW/MEDIUM/HIGH/VERY_HIGH), confidence (0-1).',
      prompt: transcript,
      schema: 'IntentClassification',
    });
  }

  // ── Detect objections ─────────────────────────────────────
  async detectObjections(transcript: string): Promise<Objection[]> {
    return this.llm.structuredComplete({
      system: 'Identify all customer objections from this transcript. Return JSON array with objects: {type, description, severity: LOW|MEDIUM|HIGH}',
      prompt: transcript,
      schema: 'Objection[]',
    });
  }

  // ── Detect competitor mentions ─────────────────────────────
  async detectCompetitors(transcript: string): Promise<CompetitorMention[]> {
    return this.llm.structuredComplete({
      system: 'Identify any competitor mentions from this transcript. Return JSON array with: {name, project?, pricePoint?, location?}',
      prompt: transcript,
      schema: 'CompetitorMention[]',
    });
  }

  // ── Calculate lead score ───────────────────────────────────
  async calculateLeadScore(data: {
    requirement: RequirementData;
    intent: string;
    intentLevel: string;
    objections: Objection[];
    budgetFit: boolean;
    engagementScore: number;
    recentActivity: boolean;
  }): Promise<{ score: number; reason: string; purchaseProbability: number }> {
    // Scoring algorithm
    let score = 0;

    // Intent level scoring
    const intentScores = { LOW: 15, MEDIUM: 30, HIGH: 55, VERY_HIGH: 70 };
    score += intentScores[data.intentLevel as keyof typeof intentScores] || 15;

    // Budget fit
    if (data.budgetFit) score += 10;

    // Requirement completeness
    const reqFields = Object.values(data.requirement).filter(Boolean).length;
    score += Math.min(reqFields * 3, 15);

    // Recent activity
    if (data.recentActivity) score += 5;

    // Deductions for severe objections
    const severeObjections = data.objections.filter(o => o.severity === 'HIGH').length;
    score -= severeObjections * 5;

    score = Math.min(100, Math.max(0, score));
    const purchaseProbability = score / 130;

    const reason = `Intent level: ${data.intentLevel}. Requirements captured: ${reqFields}/9. Objections: ${data.objections.length}. Budget fit: ${data.budgetFit}.`;

    return { score, reason, purchaseProbability };
  }

  // ── Generate follow-up recommendation ─────────────────────
  async generateFollowup(data: {
    insight: Partial<MeetingInsight>;
    customerName: string;
    agentName: string;
  }): Promise<{
    type: string;
    reason: string;
    message: string;
    dueAt: Date;
  }> {
    return this.llm.structuredComplete({
      system: 'Based on this meeting insight, generate a personalized follow-up recommendation for a real estate sales context.',
      prompt: JSON.stringify(data),
      schema: 'FollowUpRecommendation',
    });
  }

  // ── Generate creative brief ────────────────────────────────
  async generateCreativeBrief(data: {
    requirement: RequirementData;
    objections: Objection[];
    customerName: string;
    projectName: string;
  }): Promise<{
    title: string;
    type: string;
    keyMessages: string[];
    tone: string;
    format: string;
  }> {
    return this.llm.structuredComplete({
      system: 'Generate a creative marketing brief for a real estate WhatsApp creative asset. Address the specific customer requirement and objections.',
      prompt: JSON.stringify(data),
      schema: 'CreativeBrief',
    });
  }

  // ── Analyse voice call ─────────────────────────────────────
  async analyseVoiceCall(transcript: string, conversationContext?: string): Promise<{
    intent: string;
    sentiment: string;
    requirementDelta: Partial<RequirementData>;
    objections: Objection[];
    outcome: string;
    nextAction: string;
    followUpDate?: Date;
  }> {
    return this.llm.structuredComplete({
      system: 'Analyze this Voice AI call transcript for a real estate follow-up. Return structured analysis with intent, sentiment, any requirement changes, objections, call outcome and next recommended action.',
      prompt: `Call transcript: ${transcript}\n\nConversation context: ${conversationContext || 'None'}`,
      schema: 'VoiceCallAnalysis',
    });
  }

  // ── Full meeting intelligence pipeline ────────────────────
  async processMeeting(meetingId: string, audioUrl: string, context: {
    customerName: string;
    agentName: string;
    projectName: string;
  }): Promise<AiInsight> {
    const [transcriptionResult, intentResult] = await Promise.all([
      this.transcribe(audioUrl),
      this.classifyIntent('Initial classification'),
    ]);

    const transcript = transcriptionResult.text;

    const [summary, requirements, objections, competitors, intent] = await Promise.all([
      this.summarize(transcript),
      this.extractRequirements(transcript),
      this.detectObjections(transcript),
      this.detectCompetitors(transcript),
      this.classifyIntent(transcript),
    ]);

    const scoreResult = await this.calculateLeadScore({
      requirement: requirements,
      intent: intent.intent,
      intentLevel: intent.intentLevel,
      objections,
      budgetFit: true,
      engagementScore: 75,
      recentActivity: true,
    });

    const followup = await this.generateFollowup({
      insight: { summary, customerIntent: intent.intent, objections, competitorMentions: competitors } as any,
      customerName: context.customerName,
      agentName: context.agentName,
    });

    return {
      summary,
      customerIntent: intent.intent,
      intentLevel: intent.intentLevel,
      requirement: requirements,
      objections,
      competitorMentions: competitors,
      sentiment: 'POSITIVE',
      recommendedAction: followup.message,
      qualityScore: scoreResult.score,
    };
  }
}

export const aiOrchestrator = new AiOrchestrator();
