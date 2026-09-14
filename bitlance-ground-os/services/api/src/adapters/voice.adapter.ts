// ============================================================
// VOICE AI PROVIDER ADAPTER
// ============================================================

export interface VoiceProvider {
  initiateCall(opts: {
    to: string;
    context: string;
    customerName: string;
    agentContext?: string;
  }): Promise<{ callId: string }>;
  getCallStatus(callId: string): Promise<{ status: string; duration?: number }>;
  parseCallWebhook(payload: unknown): VoiceCallEvent | null;
}

export interface VoiceCallEvent {
  callId: string;
  event: 'call.started' | 'call.ended' | 'call.failed' | 'transcript.ready';
  duration?: number;
  transcript?: string;
  outcome?: string;
}

class MockVoiceProvider implements VoiceProvider {
  async initiateCall(opts: { to: string; context: string; customerName: string }) {
    console.log(`[MOCK VOICE] Calling ${opts.to} for ${opts.customerName}`);
    console.log(`[MOCK VOICE] Context: ${opts.context.slice(0, 100)}...`);
    return { callId: `mock_call_${Date.now()}` };
  }

  async getCallStatus(callId: string) {
    return { status: 'completed', duration: 187 };
  }

  parseCallWebhook(payload: unknown): VoiceCallEvent | null {
    try {
      const body = payload as any;
      return {
        callId: body.call_id,
        event: body.event,
        duration: body.duration,
        transcript: body.transcript,
        outcome: body.outcome,
      };
    } catch { return null; }
  }
}

export function getVoiceProvider(): VoiceProvider {
  const provider = process.env.VOICE_PROVIDER || 'mock';
  switch (provider) {
    case 'mock': default: return new MockVoiceProvider();
  }
}
