// ============================================================
// LLM PROVIDER ADAPTER — Mock-first, production-swappable
// ============================================================

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

  async structuredComplete<T>({ schema, prompt }: { system: string; prompt: string; schema: string }): Promise<T> {
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

// ── OpenAI Provider ────────────────────────────────────────
class OpenAIProvider implements LLMProvider {
  async complete({ system, prompt }: { system: string; prompt: string }): Promise<string> {
    // Production: call OpenAI API
    throw new Error('OpenAI provider not yet configured. Set LLM_PROVIDER=openai and OPENAI_API_KEY.');
  }

  async structuredComplete<T>({ system, prompt, schema }: { system: string; prompt: string; schema: string }): Promise<T> {
    throw new Error('OpenAI provider not yet configured.');
  }
}

export function getLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'mock';
  switch (provider) {
    case 'openai': return new OpenAIProvider();
    case 'mock': default: return new MockLLMProvider();
  }
}
