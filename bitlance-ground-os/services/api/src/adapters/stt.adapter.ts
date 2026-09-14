// ============================================================
// STT PROVIDER ADAPTER — Speech-to-Text (mock + production)
// ============================================================

export interface STTProvider {
  transcribe(audioUrl: string, language?: string): Promise<{
    text: string;
    segments: Array<{ speaker: string; start: number; end: number; text: string }>;
    confidence: number;
  }>;
}

class MockSTTProvider implements STTProvider {
  async transcribe(audioUrl: string, language = 'en') {
    await new Promise(r => setTimeout(r, 1200));
    return {
      text: `Agent: Good morning Rajesh sir, I am Aman from Lifestyle Homes.
Rajesh: Yes, come in. I got a WhatsApp message about the 3BHK.
Agent: We have beautiful 3BHK units at Lifestyle Grand in Andheri West. RERA registered.
Rajesh: What is the price? I told your bot, around 80 to 1 crore.
Agent: Options from 80 lakhs to 1 crore. 1150 sq ft. 3 bed 2 bath with study room.
Rajesh: What about Prestige? They are offering similar at 72 lakhs in Malad.
Agent: Lifestyle Grand is 5 minutes from the highway and has premium amenities.
Rajesh: The price difference is still 8 lakhs. That is not small.
Agent: We have a 20-40-40 construction-linked payment plan, sir.
Rajesh: That is interesting. We are a family of 4. School proximity is important.
Agent: The project is 3 minutes from DPS and Ryan International.
Rajesh: When can I see the sample flat?
Agent: This weekend, sir. I will arrange a site visit with the developer team.
Rajesh: Okay. Let me discuss with my wife also.`,
      segments: [
        { speaker: 'Agent', start: 0, end: 8, text: 'Good morning Rajesh sir, I am Aman from Lifestyle Homes.' },
        { speaker: 'Customer', start: 9, end: 18, text: 'Yes, come in. I got a WhatsApp message about the 3BHK.' },
        { speaker: 'Customer', start: 95, end: 120, text: 'What about Prestige? They are offering similar at 72 lakhs in Malad.' },
      ],
      confidence: 0.94,
    };
  }
}

export function getSTTProvider(): STTProvider {
  const provider = process.env.STT_PROVIDER || 'mock';
  switch (provider) {
    case 'mock': default: return new MockSTTProvider();
  }
}
