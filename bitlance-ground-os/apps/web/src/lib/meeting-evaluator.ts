// ============================================================
// MEETING INTELLIGENCE & EVALUATION ENGINE v2
// Strict, objective analysis using transcript + post-meeting form
// Combination of transcript sentiment + agent-reported facts
// ============================================================

export interface MeetingAnalysisResult {
  qualityScore: number;
  intentLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  summary: string;
  objections: Array<{ type: string; description: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' }>;
  recommendedAction: string;
  nextAction: string;
  qualityBreakdown: {
    rapport: number;
    discovery: number;
    objectionHandling: number;
    closingClarity: number;
  };
  expectedDealValue?: string;
  followUpStatus?: string;
  followUpDate?: string;
  agentObservations?: string;
  keyHighlights?: string;
  productsDiscussed?: string;
}

export interface PostMeetingContext {
  expectedDealValue?: string;
  followUpStatus?: string;
  followUpDate?: string;
  agentObservations?: string;
  keyHighlights?: string;
  productsDemoedOrDiscussed?: string;
}

export async function evaluateMeetingTranscript(params: {
  transcriptText: string;
  businessName: string;
  clientName: string;
  agentName: string;
  durationSeconds: number;
  postMeetingContext?: PostMeetingContext;
}): Promise<MeetingAnalysisResult> {
  const { transcriptText, businessName, clientName, agentName, durationSeconds, postMeetingContext } = params;
  const trimmed = (transcriptText || '').trim();

  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const isRepetitiveGreeting =
    words.length === 0 ||
    words.length < 25 ||
    uniqueWords.size <= 5 ||
    words.every(w => ['hello', 'hi', 'hey', 'test', 'mic', 'check', 'ha', 'haan', 'ok', 'okay', '1', '2', '3', 'namaste'].includes(w.replace(/[^a-z]/g, '')));

  // BRUTAL TRUTH MANDATE: If transcript is just trivial greetings ("hello hello", "hi hi", etc.), ALWAYS grade as LOW INTENT and fail audit
  if (isRepetitiveGreeting) {
    return {
      qualityScore: 28,
      intentLevel: 'LOW',
      summary: `⚠️ AUDIT WARNING / BRUTAL TRUTH: Audio recording contains NO meaningful sales discussion, product demonstration, or client negotiation (only trivial greetings like "${trimmed || 'hello hello'}"). Even if a post-meeting form was submitted, the recorded audio fails to verify any live sales dialogue. Quality rating severely penalized to 28/100.`,
      objections: [
        { type: 'No Commercial Dialogue', description: 'Agent failed to record an active sales conversation or pitch during the visit.', severity: 'HIGH' }
      ],
      recommendedAction: `Agent Nilesh must conduct a genuine product demonstration with ${clientName} at ${businessName} and capture verified client discussion.`,
      nextAction: `Re-visit ${clientName} to conduct actual commercial pitch and record dialogue`,
      qualityBreakdown: { rapport: 30, discovery: 10, objectionHandling: 0, closingClarity: 5 },
      expectedDealValue: postMeetingContext?.expectedDealValue,
      followUpStatus: postMeetingContext?.followUpStatus,
      followUpDate: postMeetingContext?.followUpDate,
      agentObservations: postMeetingContext?.agentObservations,
      keyHighlights: postMeetingContext?.keyHighlights,
      productsDiscussed: postMeetingContext?.productsDemoedOrDiscussed,
    };
  }

  const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (openaiApiKey) {
    try {
      const followUpMap: Record<string, string> = {
        INTERESTED: 'Client is interested — send proposal immediately',
        FOLLOW_UP_NEEDED: 'Follow-up required — schedule next touchpoint',
        PRICING_OBJECTION: 'Pricing objection raised — negotiate terms',
        NOT_INTERESTED: 'Client not interested at this time',
        DEAL_CLOSED: 'Deal has been closed successfully',
      };

      const postContextText = postMeetingContext ? `
POST-MEETING AGENT REPORT:
- Expected Deal Value: Rs.${postMeetingContext.expectedDealValue || '0'}
- Follow-Up Status: ${followUpMap[postMeetingContext.followUpStatus || ''] || postMeetingContext.followUpStatus || 'Not specified'}
- Next Follow-Up Date: ${postMeetingContext.followUpDate || 'Not scheduled'}
- Products/Services Discussed: ${postMeetingContext.productsDemoedOrDiscussed || 'Not specified'}
- Key Highlights / Promises: ${postMeetingContext.keyHighlights || 'None noted'}
- Agent Field Observations: ${postMeetingContext.agentObservations || 'None noted'}
` : '';

      const systemPrompt = `You are a strict veteran Chief Commercial Officer and AI sales auditor.
You have TWO sources: (1) the meeting transcript/audio, (2) the post-meeting report filed by the field agent.
Evaluate the field sales interaction between Agent (${agentName}) and Client (${clientName}) at Business (${businessName}).

SCORING RULES (CRITICAL):
- If audio transcript contains ONLY casual greetings like "hello hello", "hi", "namaste", or mic tests without sales discussion, YOU MUST GRADE THE MEETING AS LOW INTENT (Score 15-30/100) AND WRITE A BRUTAL TRUTH SUMMARY TO THE CEO. Do not give high ratings for empty greetings!
- Audio sparse but agent provided detailed post-meeting context (deal value, client intent, products): score 35-50
- Audio shows superficial talk without discovering requirements: score 25-50
- Commercial discussion with budget, objections, proposal commitment + agent deal value: score 65-88
- High-intent negotiation, clear deal value, scheduled commitment, near-closed: score 85-96

Return ONLY valid JSON:
{"qualityScore":0,"intentLevel":"LOW","summary":"...","objections":[{"type":"...","description":"...","severity":"LOW"}],"recommendedAction":"...","nextAction":"...","qualityBreakdown":{"rapport":0,"discovery":0,"objectionHandling":0,"closingClarity":0}}`;

      const userPrompt = `Meeting Metadata:
Business: ${businessName}
Client: ${clientName}
Agent: ${agentName}
Duration: ${durationSeconds} seconds

TRANSCRIPT:
${trimmed || '[Audio capture was brief or unclear]'}
${postContextText}
Return honest JSON evaluation only.`;

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.15,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const content = json.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            qualityScore: Number(parsed.qualityScore) || 50,
            intentLevel: parsed.intentLevel || 'MEDIUM',
            summary: parsed.summary || 'Meeting evaluated.',
            objections: Array.isArray(parsed.objections) ? parsed.objections : [],
            recommendedAction: parsed.recommendedAction || 'Follow up with client.',
            nextAction: parsed.nextAction || 'Send WhatsApp proposal.',
            qualityBreakdown: {
              rapport: Number(parsed.qualityBreakdown?.rapport) || 50,
              discovery: Number(parsed.qualityBreakdown?.discovery) || 50,
              objectionHandling: Number(parsed.qualityBreakdown?.objectionHandling) || 50,
              closingClarity: Number(parsed.qualityBreakdown?.closingClarity) || 50,
            },
            expectedDealValue: postMeetingContext?.expectedDealValue,
            followUpStatus: postMeetingContext?.followUpStatus,
            followUpDate: postMeetingContext?.followUpDate,
            agentObservations: postMeetingContext?.agentObservations,
            keyHighlights: postMeetingContext?.keyHighlights,
            productsDiscussed: postMeetingContext?.productsDemoedOrDiscussed,
          };
        }
      }
    } catch (err) {
      console.warn('[MeetingEvaluator] OpenAI call error, falling back to heuristic evaluation:', err);
    }
  }

  // Heuristic Fallback using post-meeting context
  const hasDealValue = !!(postMeetingContext?.expectedDealValue && postMeetingContext.expectedDealValue !== '0');
  const followUpStatus = postMeetingContext?.followUpStatus || 'FOLLOW_UP_NEEDED';
  const interestScore = followUpStatus === 'DEAL_CLOSED' ? 90
    : followUpStatus === 'INTERESTED' ? 72
    : followUpStatus === 'FOLLOW_UP_NEEDED' ? 55
    : followUpStatus === 'PRICING_OBJECTION' ? 45
    : 22;
  const audioBonus = words.length > 50 ? 8 : words.length > 20 ? 4 : 0;
  const dealBonus = hasDealValue ? 7 : 0;
  const localScore = Math.min(92, interestScore + audioBonus + dealBonus);

  const intentMap: Record<string, MeetingAnalysisResult['intentLevel']> = {
    DEAL_CLOSED: 'VERY_HIGH',
    INTERESTED: 'HIGH',
    FOLLOW_UP_NEEDED: 'MEDIUM',
    PRICING_OBJECTION: 'MEDIUM',
    NOT_INTERESTED: 'LOW',
  };

  return {
    qualityScore: localScore,
    intentLevel: intentMap[followUpStatus] || 'MEDIUM',
    summary: `Field visit conducted with ${clientName} at ${businessName}. ${
      postMeetingContext?.keyHighlights
        ? `Key outcome: ${postMeetingContext.keyHighlights}.`
        : `Agent ${agentName} completed the client interaction and filed the meeting report.`
    } ${hasDealValue ? `Expected deal value: Rs.${postMeetingContext!.expectedDealValue}.` : ''} Follow-up status: ${followUpStatus.replace(/_/g, ' ')}.`,
    objections: followUpStatus === 'PRICING_OBJECTION'
      ? [{ type: 'Pricing Objection', description: 'Client raised concerns about the pricing structure', severity: 'MEDIUM' as const }]
      : [],
    recommendedAction: followUpStatus === 'DEAL_CLOSED'
      ? 'Initiate onboarding and document the agreement.'
      : `Follow up with ${clientName} by ${postMeetingContext?.followUpDate || 'next week'} with tailored proposal.`,
    nextAction: `Contact ${clientName} at ${businessName} on ${postMeetingContext?.followUpDate || 'scheduled date'}`,
    qualityBreakdown: {
      rapport: Math.max(30, localScore - 5),
      discovery: Math.max(20, localScore - 15),
      objectionHandling: followUpStatus === 'PRICING_OBJECTION' ? 55 : Math.max(15, localScore - 20),
      closingClarity: followUpStatus === 'DEAL_CLOSED' ? 95 : Math.max(20, localScore - 10),
    },
    expectedDealValue: postMeetingContext?.expectedDealValue,
    followUpStatus: postMeetingContext?.followUpStatus,
    followUpDate: postMeetingContext?.followUpDate,
    agentObservations: postMeetingContext?.agentObservations,
    keyHighlights: postMeetingContext?.keyHighlights,
    productsDiscussed: postMeetingContext?.productsDemoedOrDiscussed,
  };
}
