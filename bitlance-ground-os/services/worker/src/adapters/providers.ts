// ============================================================
// BITLANCE GROUND OS — Worker Provider Adapters
// Consolidated, env-driven providers for all worker queues.
// Set PROVIDER env vars to switch from mock → real integrations.
// ============================================================

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
    if (!response.ok) throw new Error(`Deepgram failed: ${response.status}`);
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
      console.warn('[STT] Deepgram selected but DEEPGRAM_API_KEY missing — falling back to mock');
      return new MockSttProvider();
    }
    return new DeepgramSttProvider(key);
  }
  return new MockSttProvider();
}

// ── WhatsApp ──────────────────────────────────────────────

export interface WhatsAppResult { messageId: string; }

interface WhatsAppProvider {
  sendMessage(to: string, message: string): Promise<WhatsAppResult>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResult>;
  sendTemplate(to: string, templateName: string, params: string[]): Promise<WhatsAppResult>;
}

class MockWhatsAppProvider implements WhatsAppProvider {
  async sendMessage(to: string, message: string) {
    console.log(`[WA Mock] Text => ${to}: ${message.slice(0, 60)}...`);
    return { messageId: `wa_msg_${Date.now()}` };
  }
  async sendImage(to: string, imageUrl: string, caption?: string) {
    console.log(`[WA Mock] Image => ${to}: ${imageUrl} | ${caption}`);
    return { messageId: `wa_img_${Date.now()}` };
  }
  async sendTemplate(to: string, templateName: string, params: string[]) {
    console.log(`[WA Mock] Template ${templateName} => ${to} (${params.join(', ')})`);
    return { messageId: `wa_tpl_${Date.now()}` };
  }
}

export function getWhatsAppProvider(): WhatsAppProvider {
  return new MockWhatsAppProvider();
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
        variableValues: { customerName: opts.customerName, conversationContext: opts.context },
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
    return { callId: data.id };
  }
}

export function getVoiceProvider(): VoiceProvider {
  const provider = process.env.VOICE_PROVIDER || 'mock';
  if (provider === 'vapi') {
    const key = process.env.VAPI_API_KEY;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    if (!key || !phoneNumberId || !assistantId) {
      console.warn('[Voice] VAPI keys missing (VAPI_API_KEY / VAPI_PHONE_NUMBER_ID / VAPI_ASSISTANT_ID) — falling back to mock');
      return new MockVoiceProvider();
    }
    return new VAPIVoiceProvider(key, phoneNumberId, assistantId);
  }
  return new MockVoiceProvider();
}

// ── Creative Generation ───────────────────────────────────

export interface CreativeResult { assetUrl: string; }

interface CreativeProvider {
  generate(opts: { type: string; brief: string }): Promise<CreativeResult>;
}

class MockCreativeProvider implements CreativeProvider {
  async generate(opts: { type: string; brief: string }): Promise<CreativeResult> {
    console.log(`[Creative Mock] Generated ${opts.type} creative`);
    return { assetUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80' };
  }
}

export function getCreativeProvider(): CreativeProvider {
  return new MockCreativeProvider();
}

// ── AI Orchestrator ───────────────────────────────────────

export interface MeetingInsightResult {
  summary: string;
  customerIntent: string;
  intentLevel: string;
  sentiment: string;
  qualityScore: number;
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

export function getAiOrchestrator(): AiOrchestrator {
  // Future: return GeminiAiOrchestrator when GEMINI_API_KEY is set
  return new MockAiOrchestrator();
}
