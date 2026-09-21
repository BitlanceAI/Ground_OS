// ============================================================
// BITLANCE GROUND OS — Worker Provider Adapters
// Env-driven providers — set env vars to activate real integrations.
// Priority chain: real provider → fallback to mock with a warning.
// ============================================================

import { GoogleGenAI } from '@google/genai';

// ── STT (Speech-to-Text) ──────────────────────────────────

export interface SttResult {
  text: string;
  segments: Array<{ start: number; end: number; text: string }>;
  confidence: number;
}

interface SttProvider {
  transcribe(audioUrl: string): Promise<SttResult>;
}

class MockSttProvider implements SttProvider {
  async transcribe(_audioUrl: string): Promise<SttResult> {
    return {
      text: 'Client enquired about 3BHK high-rise units facing the park. Budget around 1.3 Cr. Wants site visit this Saturday. Key objection was parking availability.',
      segments: [{ start: 0, end: 120, text: 'Full meeting recording transcription' }],
      confidence: 0.94,
    };
  }
}

class DeepgramSttProvider implements SttProvider {
  private apiKey: string;
  constructor(apiKey: string) { this.apiKey = apiKey; }

  async transcribe(audioUrl: string): Promise<SttResult> {
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: audioUrl }),
      }
    );
    if (!response.ok) throw new Error(`Deepgram STT failed: ${response.status}`);
    const data = await response.json() as any;
    const alt = data?.results?.channels?.[0]?.alternatives?.[0];
    return {
      text: alt?.transcript || '',
      segments: (alt?.words || []).map((w: any) => ({ start: w.start, end: w.end, text: w.word })),
      confidence: alt?.confidence || 0,
    };
  }
}

export function getSttProvider(): SttProvider {
  const provider = process.env.STT_PROVIDER || 'mock';
  if (provider === 'deepgram') {
    const key = process.env.DEEPGRAM_API_KEY;
    if (!key) {
      console.warn('[STT] STT_PROVIDER=deepgram but DEEPGRAM_API_KEY is missing — falling back to mock');
      return new MockSttProvider();
    }
    console.log('[STT] Provider: Deepgram Nova-2');
    return new DeepgramSttProvider(key);
  }
  console.log('[STT] Provider: Mock');
  return new MockSttProvider();
}

// ── WhatsApp (Meta Cloud API) ─────────────────────────────

export interface WhatsAppResult { messageId: string; }

interface WhatsAppProvider {
  sendMessage(to: string, message: string): Promise<WhatsAppResult>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResult>;
  sendTemplate(to: string, templateName: string, params: string[]): Promise<WhatsAppResult>;
}

class MockWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(to: string, message: string): Promise<WhatsAppResult> {
    console.log(`[WA Mock] Text => ${to}: ${message.slice(0, 60)}...`);
    return { messageId: `wa_msg_${Date.now()}` };
  }
  async sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResult> {
    console.log(`[WA Mock] Image => ${to}: ${imageUrl} | ${caption}`);
    return { messageId: `wa_img_${Date.now()}` };
  }
  async sendTemplate(to: string, templateName: string, params: string[]): Promise<WhatsAppResult> {
    console.log(`[WA Mock] Template ${templateName} => ${to} (${params.join(', ')})`);
    return { messageId: `wa_tpl_${Date.now()}` };
  }
}

/**
 * Meta WhatsApp Cloud API provider.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 * Env vars required:
 *   WHATSAPP_ACCESS_TOKEN     — permanent or system user token
 *   WHATSAPP_PHONE_NUMBER_ID  — registered sender phone number ID
 */
class MetaWhatsAppProvider implements WhatsAppProvider {
  private accessToken: string;
  private phoneNumberId: string;
  private baseUrl: string;

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.baseUrl = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  }

  private async post(body: object): Promise<WhatsAppResult> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`WhatsApp Meta API error (${response.status}): ${err}`);
    }

    const data = await response.json() as { messages?: Array<{ id: string }> };
    const messageId = data?.messages?.[0]?.id || `meta_${Date.now()}`;
    return { messageId };
  }

  async sendMessage(to: string, message: string): Promise<WhatsAppResult> {
    return this.post({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: message },
    });
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResult> {
    return this.post({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: { link: imageUrl, caption: caption || '' },
    });
  }

  async sendTemplate(to: string, templateName: string, params: string[]): Promise<WhatsAppResult> {
    return this.post({
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: params.length > 0
          ? [{
              type: 'body',
              parameters: params.map((p) => ({ type: 'text', text: p })),
            }]
          : [],
      },
    });
  }
}

let _whatsappProvider: WhatsAppProvider | null = null;

export function getWhatsAppProvider(): WhatsAppProvider {
  if (_whatsappProvider) return _whatsappProvider;

  const provider = process.env.WHATSAPP_PROVIDER || 'mock';

  if (provider === 'meta') {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      console.warn('[WhatsApp] WHATSAPP_PROVIDER=meta but WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID missing — falling back to mock');
      _whatsappProvider = new MockWhatsAppProvider();
    } else {
      console.log('[WhatsApp] Provider: Meta Cloud API');
      _whatsappProvider = new MetaWhatsAppProvider(token, phoneNumberId);
    }
  } else {
    console.log('[WhatsApp] Provider: Mock');
    _whatsappProvider = new MockWhatsAppProvider();
  }

  return _whatsappProvider;
}

// ── Voice / VAPI ──────────────────────────────────────────

export interface VoiceResult { callId: string; }

interface VoiceProvider {
  initiateCall(opts: { to: string; customerName: string; context: string }): Promise<VoiceResult>;
}

class MockVoiceProvider implements VoiceProvider {
  async initiateCall(opts: { to: string; customerName: string; context: string }): Promise<VoiceResult> {
    console.log(`[Voice Mock] Call => ${opts.to} (${opts.customerName})`);
    return { callId: `vapi_${Date.now()}` };
  }
}

class VAPIVoiceProvider implements VoiceProvider {
  private apiKey: string;
  private phoneNumberId: string;
  private assistantId: string;

  constructor(apiKey: string, phoneNumberId: string, assistantId: string) {
    this.apiKey = apiKey;
    this.phoneNumberId = phoneNumberId;
    this.assistantId = assistantId;
  }

  async initiateCall(opts: { to: string; customerName: string; context: string }): Promise<VoiceResult> {
    const body = {
      phoneNumberId: this.phoneNumberId,
      assistantId: this.assistantId,
      customer: { number: opts.to, name: opts.customerName },
      assistantOverrides: {
        variableValues: {
          customerName: opts.customerName,
          conversationContext: opts.context,
        },
      },
    };
    const response = await fetch('https://api.vapi.ai/call/phone', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VAPI call failed (${response.status}): ${error}`);
    }
    const data = await response.json() as { id: string };
    console.log(`[VAPI] Call initiated: ${data.id} => ${opts.to}`);
    return { callId: data.id };
  }
}

let _voiceProvider: VoiceProvider | null = null;

export function getVoiceProvider(): VoiceProvider {
  if (_voiceProvider) return _voiceProvider;

  const provider = process.env.VOICE_PROVIDER || 'mock';
  if (provider === 'vapi') {
    const key = process.env.VAPI_API_KEY;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    if (!key || !phoneNumberId || !assistantId) {
      console.warn('[Voice] VAPI keys missing (VAPI_API_KEY / VAPI_PHONE_NUMBER_ID / VAPI_ASSISTANT_ID) — falling back to mock');
      _voiceProvider = new MockVoiceProvider();
    } else {
      console.log('[Voice] Provider: VAPI');
      _voiceProvider = new VAPIVoiceProvider(key, phoneNumberId, assistantId);
    }
  } else {
    console.log('[Voice] Provider: Mock');
    _voiceProvider = new MockVoiceProvider();
  }

  return _voiceProvider;
}

// ── Creative Generation ───────────────────────────────────

export interface CreativeResult { assetUrl: string; }

interface CreativeProvider {
  generate(opts: { type: string; brief: string }): Promise<CreativeResult>;
}

class MockCreativeProvider implements CreativeProvider {
  async generate(opts: { type: string; brief: string }): Promise<CreativeResult> {
    console.log(`[Creative Mock] Generating ${opts.type} creative`);
    return { assetUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80' };
  }
}

export function getCreativeProvider(): CreativeProvider {
  console.log('[Creative] Provider: Mock');
  return new MockCreativeProvider();
}

// ── AI Orchestrator (Gemini 2.0 Flash → OpenAI → Mock) ───

export interface MeetingInsightResult {
  summary: string;
  customerIntent: string;
  intentLevel: string;   // LOW | MEDIUM | HIGH | VERY_HIGH
  sentiment: string;     // POSITIVE | NEUTRAL | NEGATIVE
  qualityScore: number;  // 0–100
  requirement: Record<string, string>;
  objections: string[];
  competitorMentions: string[];
  recommendedAction: string;
}

export interface VoiceCallAnalysis {
  intent: string;
  sentiment: string;
  outcome: string;
  nextAction: string;
}

interface AiOrchestrator {
  processMeeting(
    meetingId: string,
    audioUrl: string,
    meta: { customerName: string; agentName: string; projectName: string }
  ): Promise<MeetingInsightResult>;
  analyseVoiceCall(transcript: string, callType: string): Promise<VoiceCallAnalysis>;
}

// ── Mock fallback ─────────────────────────────────────────

class MockAiOrchestrator implements AiOrchestrator {
  async processMeeting(
    _meetingId: string,
    _audioUrl: string,
    meta: { customerName: string; agentName: string; projectName: string }
  ): Promise<MeetingInsightResult> {
    return {
      summary: `Site visit and discussion with ${meta.customerName} handled by ${meta.agentName} for ${meta.projectName}. Client showed high interest in 3BHK unit.`,
      customerIntent: 'Looking for 3BHK unit facing the garden. Timeline within 60 days.',
      intentLevel: 'HIGH',
      sentiment: 'POSITIVE',
      qualityScore: 86,
      requirement: { unitType: '3BHK', budget: '1.2 - 1.5 Cr', possession: 'Immediate' },
      objections: ['Parking slot allocation'],
      competitorMentions: ['Sobha Dream Acres'],
      recommendedAction: 'Send project brochure and unit layout on WhatsApp with payment plan details.',
    };
  }

  async analyseVoiceCall(_transcript: string, _callType: string): Promise<VoiceCallAnalysis> {
    return {
      intent: 'Site visit rescheduling',
      sentiment: 'POSITIVE',
      outcome: 'VISIT_CONFIRMED',
      nextAction: 'Confirm agent availability and send calendar invite.',
    };
  }
}

// ── Gemini 2.0 Flash orchestrator ────────────────────────

const MEETING_SYSTEM_PROMPT = `You are a veteran Chief Commercial Officer and AI sales performance auditor.
Analyse the following field sales meeting transcript and return ONLY valid JSON with no markdown, no explanation.

SCORING RULES:
- Audio with only trivial greetings (hello, hi, namaste, mic test): score 15-28
- Audio sparse + agent filed detailed report: score 35-50
- Superficial talk, no requirement discovery: score 25-50
- Commercial discussion with budget, objections, proposal: score 65-88
- High-intent negotiation, near-closed, scheduled commitment: score 85-96

Return this exact JSON shape:
{
  "summary": "string",
  "customerIntent": "string",
  "intentLevel": "LOW|MEDIUM|HIGH|VERY_HIGH",
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "qualityScore": 0,
  "requirement": { "unitType": "string", "budget": "string", "possession": "string" },
  "objections": ["string"],
  "competitorMentions": ["string"],
  "recommendedAction": "string"
}`;

const VOICE_SYSTEM_PROMPT = `You are a voice call intelligence engine for a real estate sales CRM.
Analyse the following call transcript and return ONLY valid JSON with no markdown:
{
  "intent": "string",
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "outcome": "SITE_VISIT_CONFIRMED|SITE_VISIT_SCHEDULED|FOLLOW_UP_NEEDED|NOT_INTERESTED|DEAL_CLOSED|CALL_DROPPED",
  "nextAction": "string"
}`;

class GeminiAiOrchestrator implements AiOrchestrator {
  private client: GoogleGenAI;
  private model = 'gemini-2.0-flash';

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  private async structuredComplete<T>(system: string, prompt: string): Promise<T> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: `${system}\n\nInput:\n${prompt}` }] }],
      config: { responseMimeType: 'application/json' },
    });
    const text = response.text ?? '{}';
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned) as T;
  }

  async processMeeting(
    meetingId: string,
    _audioUrl: string,
    meta: { customerName: string; agentName: string; projectName: string }
  ): Promise<MeetingInsightResult> {
    const prompt = `Meeting ID: ${meetingId}
Agent: ${meta.agentName}
Client: ${meta.customerName}
Project: ${meta.projectName}`;

    const result = await this.structuredComplete<MeetingInsightResult>(MEETING_SYSTEM_PROMPT, prompt);
    return {
      summary: result.summary || '',
      customerIntent: result.customerIntent || '',
      intentLevel: result.intentLevel || 'MEDIUM',
      sentiment: result.sentiment || 'NEUTRAL',
      qualityScore: Number(result.qualityScore) || 50,
      requirement: result.requirement || {},
      objections: Array.isArray(result.objections) ? result.objections : [],
      competitorMentions: Array.isArray(result.competitorMentions) ? result.competitorMentions : [],
      recommendedAction: result.recommendedAction || 'Follow up with client.',
    };
  }

  async analyseVoiceCall(transcript: string, callType: string): Promise<VoiceCallAnalysis> {
    const prompt = `Call Type: ${callType}\n\nTranscript:\n${transcript}`;
    const result = await this.structuredComplete<VoiceCallAnalysis>(VOICE_SYSTEM_PROMPT, prompt);
    return {
      intent: result.intent || 'Unknown',
      sentiment: result.sentiment || 'NEUTRAL',
      outcome: result.outcome || 'FOLLOW_UP_NEEDED',
      nextAction: result.nextAction || 'Schedule follow-up.',
    };
  }
}

// ── OpenAI GPT-4o-mini orchestrator ──────────────────────

class OpenAIAiOrchestrator implements AiOrchestrator {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async structuredComplete<T>(system: string, prompt: string): Promise<T> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        temperature: 0.15,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${err}`);
    }
    const data = await response.json() as any;
    const text = data?.choices?.[0]?.message?.content ?? '{}';
    return JSON.parse(text) as T;
  }

  async processMeeting(
    meetingId: string,
    _audioUrl: string,
    meta: { customerName: string; agentName: string; projectName: string }
  ): Promise<MeetingInsightResult> {
    const prompt = `Meeting ID: ${meetingId}
Agent: ${meta.agentName}
Client: ${meta.customerName}
Project: ${meta.projectName}`;

    const result = await this.structuredComplete<MeetingInsightResult>(MEETING_SYSTEM_PROMPT, prompt);
    return {
      summary: result.summary || '',
      customerIntent: result.customerIntent || '',
      intentLevel: result.intentLevel || 'MEDIUM',
      sentiment: result.sentiment || 'NEUTRAL',
      qualityScore: Number(result.qualityScore) || 50,
      requirement: result.requirement || {},
      objections: Array.isArray(result.objections) ? result.objections : [],
      competitorMentions: Array.isArray(result.competitorMentions) ? result.competitorMentions : [],
      recommendedAction: result.recommendedAction || 'Follow up with client.',
    };
  }

  async analyseVoiceCall(transcript: string, callType: string): Promise<VoiceCallAnalysis> {
    const prompt = `Call Type: ${callType}\n\nTranscript:\n${transcript}`;
    const result = await this.structuredComplete<VoiceCallAnalysis>(VOICE_SYSTEM_PROMPT, prompt);
    return {
      intent: result.intent || 'Unknown',
      sentiment: result.sentiment || 'NEUTRAL',
      outcome: result.outcome || 'FOLLOW_UP_NEEDED',
      nextAction: result.nextAction || 'Schedule follow-up.',
    };
  }
}

// ── Auto AI Orchestrator (Gemini → OpenAI → Mock) ─────────

class AutoAiOrchestrator implements AiOrchestrator {
  private chain: AiOrchestrator[];

  constructor() {
    this.chain = [];

    if (process.env.GEMINI_API_KEY) {
      this.chain.push(new GeminiAiOrchestrator(process.env.GEMINI_API_KEY));
      console.log('[AI Orchestrator] Primary: Gemini 2.0 Flash');
    }

    if (process.env.OPENAI_API_KEY) {
      this.chain.push(new OpenAIAiOrchestrator(process.env.OPENAI_API_KEY));
      console.log('[AI Orchestrator] Fallback: OpenAI GPT-4o-mini');
    }

    // Always keep mock as last resort
    this.chain.push(new MockAiOrchestrator());

    if (this.chain.length === 1) {
      console.warn('[AI Orchestrator] No LLM API keys found — running in MOCK mode. Set GEMINI_API_KEY or OPENAI_API_KEY.');
    }
  }

  async processMeeting(
    meetingId: string,
    audioUrl: string,
    meta: { customerName: string; agentName: string; projectName: string }
  ): Promise<MeetingInsightResult> {
    for (let i = 0; i < this.chain.length; i++) {
      try {
        return await this.chain[i].processMeeting(meetingId, audioUrl, meta);
      } catch (err) {
        const isLast = i === this.chain.length - 1;
        if (isLast) throw err;
        console.warn(`[AI Orchestrator] Provider ${i} failed for processMeeting, trying next:`, (err as Error).message);
      }
    }
    throw new Error('All AI orchestrator providers failed');
  }

  async analyseVoiceCall(transcript: string, callType: string): Promise<VoiceCallAnalysis> {
    for (let i = 0; i < this.chain.length; i++) {
      try {
        return await this.chain[i].analyseVoiceCall(transcript, callType);
      } catch (err) {
        const isLast = i === this.chain.length - 1;
        if (isLast) throw err;
        console.warn(`[AI Orchestrator] Provider ${i} failed for analyseVoiceCall, trying next:`, (err as Error).message);
      }
    }
    throw new Error('All AI orchestrator providers failed');
  }
}

// ── Singleton factory ─────────────────────────────────────

let _aiOrchestrator: AiOrchestrator | null = null;

export function getAiOrchestrator(): AiOrchestrator {
  if (_aiOrchestrator) return _aiOrchestrator;
  _aiOrchestrator = new AutoAiOrchestrator();
  return _aiOrchestrator;
}
