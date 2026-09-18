// ============================================================
// LLM PROVIDER ADAPTER
// Gemini 2.0 Flash (primary) → OpenAI GPT-4o (fallback) → Mock
// ============================================================

import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export interface LLMProvider {
  complete(opts: { system: string; prompt: string }): Promise<string>;
  structuredComplete<T>(opts: { system: string; prompt: string; schema: string }): Promise<T>;
}

// ── Mock Provider ──────────────────────────────────────────
class MockLLMProvider implements LLMProvider {
  async complete({ prompt }: { system: string; prompt: string }): Promise<string> {
    await new Promise(r => setTimeout(r, 800));
    return `[MOCK AI SUMMARY] This is a high-intent customer interaction. The customer expressed strong interest in 3BHK properties with a budget of ₹80L–₹1Cr. Key concerns included pricing vs competitors. Site visit requested. Lead score: 86/100.`;
  }

  async structuredComplete<T>({ schema }: { system: string; prompt: string; schema: string }): Promise<T> {
    await new Promise(r => setTimeout(r, 600));

    const mockResponses: Record<string, unknown> = {
      'RequirementData': {
        propertyType: 'Residential',
        configuration: '3BHK',
        budgetMin: 8000000,
        budgetMax: 10000000,
        location: 'Andheri West',
        purpose: 'self-use',
        timeline: '3-6 months',
        amenities: ['Parking', 'Gym', 'Play Area', 'School Proximity'],
        parking: true,
        paymentPreference: 'Construction-linked',
      },
      'IntentClassification': {
        intent: 'Active buyer seeking 3BHK for family, evaluating options, payment plan flexible',
        intentLevel: 'HIGH',
        confidence: 0.89,
      },
      'Objection[]': [
        { type: 'PRICE', description: 'Competitor Prestige offering 8L cheaper in Malad', severity: 'HIGH' },
        { type: 'DECISION', description: 'Needs spouse consultation', severity: 'MEDIUM' },
      ],
      'CompetitorMention[]': [
        { name: 'Prestige', project: 'Unknown', pricePoint: 7200000, location: 'Malad' },
      ],
      'FollowUpRecommendation': {
        type: 'SITE_VISIT',
        reason: 'High-intent customer with pricing objection. Site visit will demonstrate premium value.',
        message: 'Schedule site visit this weekend. Send payment plan creative and Prestige comparison card.',
        dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
      'CreativeBrief': {
        title: 'Flexible Payment Plan — Lifestyle Grand 3BHK',
        type: 'WHATSAPP_CREATIVE',
        keyMessages: ['20-40-40 Construction-Linked Plan', 'School Proximity', 'RERA Registered', 'Premium Andheri West Location'],
        tone: 'Professional, Reassuring',
        format: 'WhatsApp Image Card',
      },
      'VoiceCallAnalysis': {
        intent: 'Interested in site visit. Payment plan confirmed as feasible.',
        sentiment: 'POSITIVE',
        requirementDelta: { timeline: '1-3 months', paymentPreference: 'Construction-linked' },
        objections: [{ type: 'SPOUSE_CONSULTATION', description: 'Will confirm after spouse review', severity: 'LOW' }],
        outcome: 'SITE_VISIT_SCHEDULED',
        nextAction: 'Send site visit confirmation and project brochure',
        followUpDate: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(),
      },
    };

    return (mockResponses[schema] || {}) as T;
  }
}

// ── Gemini 2.0 Flash Provider ──────────────────────────────
class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI;
  private model = 'gemini-2.0-flash';

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async complete({ system, prompt }: { system: string; prompt: string }): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        { role: 'user', parts: [{ text: `${system}\n\n${prompt}` }] },
      ],
    });
    return response.text ?? '';
  }

  async structuredComplete<T>({ system, prompt, schema }: { system: string; prompt: string; schema: string }): Promise<T> {
    const jsonInstruction = `\n\nIMPORTANT: Respond ONLY with valid JSON matching the schema for "${schema}". No markdown, no explanation, just raw JSON.`;
    
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${system}${jsonInstruction}\n\nInput:\n${prompt}` }],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text ?? '{}';
    try {
      // Strip any markdown code fences if present
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(cleaned) as T;
    } catch {
      console.error('[GeminiProvider] Failed to parse JSON response:', text.slice(0, 200));
      throw new Error(`Gemini returned invalid JSON for schema: ${schema}`);
    }
  }
}

// ── OpenAI GPT-4o Provider ────────────────────────────────
class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async complete({ system, prompt }: { system: string; prompt: string }): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    });
    return response.choices[0]?.message?.content ?? '';
  }

  async structuredComplete<T>({ system, prompt, schema }: { system: string; prompt: string; schema: string }): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${system}\n\nRespond ONLY with valid JSON matching the schema for "${schema}".`,
        },
        { role: 'user', content: prompt },
      ],
    });

    const text = response.choices[0]?.message?.content ?? '{}';
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error(`OpenAI returned invalid JSON for schema: ${schema}`);
    }
  }
}

// ── Auto Provider (Gemini primary → OpenAI fallback → Mock) ─
class AutoLLMProvider implements LLMProvider {
  private providers: LLMProvider[];

  constructor() {
    this.providers = [];

    if (process.env.GEMINI_API_KEY) {
      this.providers.push(new GeminiProvider(process.env.GEMINI_API_KEY));
      console.log('[LLM] Primary provider: Gemini 2.0 Flash');
    }

    if (process.env.OPENAI_API_KEY) {
      this.providers.push(new OpenAIProvider(process.env.OPENAI_API_KEY));
      console.log('[LLM] Fallback provider: OpenAI GPT-4o');
    }

    // Always have mock as last resort
    this.providers.push(new MockLLMProvider());

    if (this.providers.length === 1) {
      console.warn('[LLM] No API keys found — running in MOCK mode. Set GEMINI_API_KEY or OPENAI_API_KEY.');
    }
  }

  async complete(opts: { system: string; prompt: string }): Promise<string> {
    for (let i = 0; i < this.providers.length; i++) {
      try {
        return await this.providers[i].complete(opts);
      } catch (err) {
        const isLast = i === this.providers.length - 1;
        if (isLast) throw err;
        console.warn(`[LLM] Provider ${i} failed, falling back to next:`, (err as Error).message);
      }
    }
    throw new Error('All LLM providers failed');
  }

  async structuredComplete<T>(opts: { system: string; prompt: string; schema: string }): Promise<T> {
    for (let i = 0; i < this.providers.length; i++) {
      try {
        return await this.providers[i].structuredComplete<T>(opts);
      } catch (err) {
        const isLast = i === this.providers.length - 1;
        if (isLast) throw err;
        console.warn(`[LLM] Provider ${i} failed for structuredComplete, falling back:`, (err as Error).message);
      }
    }
    throw new Error('All LLM providers failed');
  }
}

// ── Singleton ──────────────────────────────────────────────
let _llmProvider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (_llmProvider) return _llmProvider;

  const providerName = process.env.LLM_PROVIDER || 'auto';

  switch (providerName) {
    case 'gemini':
      if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY required for gemini provider');
      _llmProvider = new GeminiProvider(process.env.GEMINI_API_KEY);
      break;
    case 'openai':
      if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY required for openai provider');
      _llmProvider = new OpenAIProvider(process.env.OPENAI_API_KEY);
      break;
    case 'mock':
      _llmProvider = new MockLLMProvider();
      break;
    case 'auto':
    default:
      _llmProvider = new AutoLLMProvider();
      break;
  }

  return _llmProvider;
}
