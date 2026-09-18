// ============================================================
// VOICE AI PROVIDER ADAPTER
// VAPI (primary) → Mock (fallback / demo mode)
// ============================================================

export interface VoiceProvider {
  initiateCall(opts: {
    to: string;
    context: string;
    customerName: string;
    agentContext?: string;
    assistantId?: string;
  }): Promise<{ callId: string }>;
  getCallStatus(callId: string): Promise<{ status: string; duration?: number; transcript?: string }>;
  parseCallWebhook(payload: unknown): VoiceCallEvent | null;
}

export interface VoiceCallEvent {
  callId: string;
  event: 'call.started' | 'call.ended' | 'call.failed' | 'transcript.ready';
  duration?: number;
  transcript?: string;
  outcome?: string;
  recordingUrl?: string;
  cost?: number;
}

// ── Mock Provider ─────────────────────────────────────────
class MockVoiceProvider implements VoiceProvider {
  async initiateCall(opts: { to: string; context: string; customerName: string }) {
    console.log(`[MOCK VOICE] Calling ${opts.to} for ${opts.customerName}`);
    console.log(`[MOCK VOICE] Context: ${opts.context.slice(0, 100)}...`);
    await new Promise(r => setTimeout(r, 300));
    return { callId: `mock_call_${Date.now()}` };
  }

  async getCallStatus(callId: string) {
    return {
      status: 'completed',
      duration: 187,
      transcript: 'Mock transcript: Customer confirmed site visit for Saturday 11AM.',
    };
  }

  parseCallWebhook(payload: unknown): VoiceCallEvent | null {
    try {
      const body = payload as any;
      return {
        callId: body.call_id || body.callId,
        event: body.event || 'call.ended',
        duration: body.duration,
        transcript: body.transcript,
        outcome: body.outcome,
        recordingUrl: body.recording_url || body.recordingUrl,
      };
    } catch { return null; }
  }
}

// ── VAPI Provider ─────────────────────────────────────────
class VAPIProvider implements VoiceProvider {
  private apiKey: string;
  private phoneNumberId: string;
  private defaultAssistantId: string;
  private baseUrl = 'https://api.vapi.ai';

  constructor(apiKey: string, phoneNumberId: string, assistantId: string) {
    this.apiKey = apiKey;
    this.phoneNumberId = phoneNumberId;
    this.defaultAssistantId = assistantId;
  }

  async initiateCall(opts: {
    to: string;
    context: string;
    customerName: string;
    agentContext?: string;
    assistantId?: string;
  }): Promise<{ callId: string }> {
    const assistantId = opts.assistantId || this.defaultAssistantId;

    const body = {
      phoneNumberId: this.phoneNumberId,
      assistantId,
      customer: {
        number: opts.to,
        name: opts.customerName,
      },
      assistantOverrides: {
        variableValues: {
          customerName: opts.customerName,
          conversationContext: opts.context,
          agentContext: opts.agentContext || '',
        },
      },
    };

    const response = await fetch(`${this.baseUrl}/call/phone`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`VAPI call initiation failed (${response.status}): ${error}`);
    }

    const data = await response.json() as { id: string };
    console.log(`[VAPI] Call initiated: ${data.id} → ${opts.to} (${opts.customerName})`);
    return { callId: data.id };
  }

  async getCallStatus(callId: string): Promise<{ status: string; duration?: number; transcript?: string }> {
    const response = await fetch(`${this.baseUrl}/call/${callId}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });

    if (!response.ok) {
      throw new Error(`VAPI getCallStatus failed: ${response.status}`);
    }

    const data = await response.json() as {
      status: string;
      endedAt?: string;
      startedAt?: string;
      transcript?: string;
    };

    let duration: number | undefined;
    if (data.startedAt && data.endedAt) {
      duration = Math.round((new Date(data.endedAt).getTime() - new Date(data.startedAt).getTime()) / 1000);
    }

    return {
      status: data.status,
      duration,
      transcript: data.transcript,
    };
  }

  parseCallWebhook(payload: unknown): VoiceCallEvent | null {
    try {
      const body = payload as any;

      // VAPI webhook message format
      const message = body.message || body;
      const call = message.call || body.call || {};

      const eventType = message.type || body.type || '';

      // Map VAPI event types to our internal events
      const eventMap: Record<string, VoiceCallEvent['event']> = {
        'call-start': 'call.started',
        'call-end': 'call.ended',
        'transcript': 'transcript.ready',
        'status-update': 'call.ended',
        'end-of-call-report': 'call.ended',
      };

      const event = eventMap[eventType] || 'call.ended';
      const callId = call.id || body.call_id;
      if (!callId) return null;

      return {
        callId,
        event,
        duration: call.endedAt && call.startedAt
          ? Math.round((new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000)
          : undefined,
        transcript: message.transcript || call.transcript,
        outcome: message.endedReason || call.endedReason,
        recordingUrl: message.recordingUrl || call.recordingUrl,
        cost: message.cost?.total,
      };
    } catch (err) {
      console.error('[VAPI] Failed to parse webhook payload:', err);
      return null;
    }
  }
}

// ── Factory ───────────────────────────────────────────────
let _voiceProvider: VoiceProvider | null = null;

export function getVoiceProvider(): VoiceProvider {
  if (_voiceProvider) return _voiceProvider;

  const provider = process.env.VOICE_PROVIDER || 'mock';

  if (provider === 'vapi') {
    const apiKey = process.env.VAPI_API_KEY;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    const assistantId = process.env.VAPI_ASSISTANT_ID;

    if (!apiKey || !phoneNumberId || !assistantId) {
      console.warn('[Voice] VAPI selected but keys missing (VAPI_API_KEY / VAPI_PHONE_NUMBER_ID / VAPI_ASSISTANT_ID). Falling back to mock.');
      _voiceProvider = new MockVoiceProvider();
    } else {
      console.log('[Voice] Provider: VAPI');
      _voiceProvider = new VAPIProvider(apiKey, phoneNumberId, assistantId);
    }
  } else {
    console.log('[Voice] Provider: Mock');
    _voiceProvider = new MockVoiceProvider();
  }

  return _voiceProvider;
}
