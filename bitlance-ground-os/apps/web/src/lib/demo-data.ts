// ============================================================
// BITLANCE GROUND OS — Demo Data
// Full Lifestyle Homes signature journey data
// ============================================================

import { Users, Map, Mic, Brain, Phone, Zap, TrendingUp, Activity } from 'lucide-react';

export const DEMO_METRICS = [
  { id: 'active-agents', label: 'Active Agents', value: '8', change: 14, color: 'var(--color-brand-light)', icon: Users },
  { id: 'live-visits', label: 'Live Visits', value: '12', change: 8, color: 'var(--color-success)', icon: Map },
  { id: 'meetings-today', label: 'Meetings Today', value: '23', change: 21, color: 'var(--color-ai-complete)', icon: Mic },
  { id: 'high-intent', label: 'High Intent Leads', value: '7', change: 40, color: 'var(--color-error)', icon: Brain },
  { id: 'ai-followups', label: 'AI Follow-ups', value: '18', change: 12, color: 'var(--color-ai-processing)', icon: Zap },
  { id: 'pipeline', label: 'Pipeline Value', value: '₹4.2Cr', change: 18, color: 'var(--color-ai-recommend)', icon: TrendingUp },
];

export const DEMO_AGENTS = [
  {
    id: 'ag1', firstName: 'Aman', lastName: 'Sharma', territory: 'Andheri West',
    status: 'IN_MEETING', lat: 19.1236, lng: 72.8371,
    visitsToday: 4, meetingsToday: 3, score: 82,
    currentCustomer: 'Rajesh Kumar',
  },
  {
    id: 'ag2', firstName: 'Priya', lastName: 'Nair', territory: 'Goregaon East',
    status: 'EN_ROUTE', lat: 19.165, lng: 72.8496,
    visitsToday: 5, meetingsToday: 2, score: 76,
    currentCustomer: null,
  },
  {
    id: 'ag3', firstName: 'Vikram', lastName: 'Joshi', territory: 'Juhu',
    status: 'ONLINE', lat: 19.098, lng: 72.827,
    visitsToday: 3, meetingsToday: 3, score: 91,
    currentCustomer: null,
  },
  {
    id: 'ag4', firstName: 'Sneha', lastName: 'Kulkarni', territory: 'Versova',
    status: 'AT_LOCATION', lat: 19.145, lng: 72.818,
    visitsToday: 6, meetingsToday: 1, score: 68,
    currentCustomer: 'Kavitha Nair',
  },
];

export const DEMO_AI_FEED = [
  {
    id: 'feed1',
    type: 'HIGH_INTENT',
    priority: 'CRITICAL',
    title: 'HIGH INTENT — Rajesh Kumar',
    body: '86/100 · 3BHK · ₹80L–₹1Cr · Pricing objection vs Prestige · Payment plan received positively',
    badge: '86',
    action: 'View Report',
    actionRoute: '/meetings/m1/report',
    agent: 'Aman Sharma',
    time: '11:07',
    customerId: 'c1',
  },
  {
    id: 'feed2',
    type: 'FOLLOW_UP_RISK',
    priority: 'HIGH',
    title: 'FOLLOW-UP RISK — Kavitha Nair',
    body: 'Scheduled follow-up for site visit is 4 hours overdue. Lead score: 71. High conversion probability.',
    badge: null,
    action: 'Assign Follow-up',
    actionRoute: '/customers/c2',
    agent: 'Sneha Kulkarni',
    time: '10:15',
    customerId: 'c2',
  },
  {
    id: 'feed3',
    type: 'MARKET_SIGNAL',
    priority: 'MEDIUM',
    title: 'MARKET SIGNAL — Territory Andheri West',
    body: '5 customers this week mentioned "flexible payment plan". Consider proactive payment plan campaign.',
    badge: '5x',
    action: 'Generate Creative',
    actionRoute: '/creatives',
    agent: null,
    time: '09:30',
    customerId: null,
  },
  {
    id: 'feed4',
    type: 'AGENT_COACHING',
    priority: 'LOW',
    title: 'COACHING — Aman Sharma',
    body: 'Meeting discovery strong, but budget qualification happened at 18 minutes. Earlier qualification improves close rate by 34%.',
    badge: null,
    action: 'View Analysis',
    actionRoute: '/agents/ag1',
    agent: 'Aman Sharma',
    time: '11:10',
    customerId: null,
  },
  {
    id: 'feed5',
    type: 'HIGH_INTENT',
    priority: 'HIGH',
    title: 'HIGH INTENT — Suresh Mehta',
    body: '74/100 · Shop owner · Commercial unit interest · Budget ₹45L–₹60L · Decision this quarter',
    badge: '74',
    action: 'View Profile',
    actionRoute: '/customers/c3',
    agent: 'Vikram Joshi',
    time: '10:52',
    customerId: 'c3',
  },
];

export const DEMO_RAJESH_TIMELINE = [
  { id: 't1', type: 'WHATSAPP_ENQUIRY', title: 'WhatsApp Enquiry', description: 'Customer enquired about 3BHK via Lifestyle Homes chatbot', isAiEvent: false, time: '09:42' },
  { id: 't2', type: 'AI_QUALIFICATION', title: 'AI Qualification', description: 'Budget ₹80L–₹1Cr confirmed. 3BHK, self-use, family of 4.', isAiEvent: true, time: '09:45' },
  { id: 't3', type: 'AGENT_ARRIVED', title: 'Agent Arrived', description: 'Aman arrived at Rajesh Electronics. GPS verified at 12m accuracy.', isAiEvent: false, time: '10:41' },
  { id: 't4', type: 'MEETING_STARTED', title: 'Meeting Started', description: 'Field meeting started. Recording active.', isAiEvent: false, time: '10:43' },
  { id: 't5', type: 'MEETING_COMPLETED', title: 'Meeting Completed', description: '21-minute meeting completed. Recording uploaded to secure storage.', isAiEvent: false, time: '11:04' },
  { id: 't6', type: 'AI_ANALYSIS', title: 'AI Analysis Completed', description: 'Transcript processed. 6 requirements, 2 objections, Prestige mentioned.', isAiEvent: true, time: '11:06', metadata: { qualityScore: 78, objections: 2 } },
  { id: 't7', type: 'LEAD_SCORE_UPDATED', title: 'Lead Score → 86', description: 'Score updated from 55 → 86. Intent: HIGH.', isAiEvent: true, time: '11:07', metadata: { prev: 55, next: 86 } },
  { id: 't8', type: 'CEO_NOTIFIED', title: 'CEO Notified', description: 'AI summary sent to CEO via WhatsApp with deep-link to report.', isAiEvent: true, time: '11:08' },
  { id: 't9', type: 'CREATIVE_GENERATED', title: 'Creative Generated', description: 'Payment plan WhatsApp creative — ready for delivery.', isAiEvent: true, time: '11:13' },
  { id: 't10', type: 'CREATIVE_SENT', title: 'Creative Delivered', description: 'Payment plan creative sent via WhatsApp.', isAiEvent: false, time: '11:15' },
  { id: 't11', type: 'CONVERSATION_INACTIVE', title: 'Conversation Inactive', description: 'No response for 5 minutes. Inactivity workflow triggered.', isAiEvent: true, time: '11:20' },
  { id: 't12', type: 'VOICE_AI_TRIGGERED', title: 'Voice AI Triggered', description: 'Eligibility check passed. Voice AI calling with conversation context.', isAiEvent: true, time: '11:25' },
  { id: 't13', type: 'FOLLOW_UP_SCHEDULED', title: 'Follow-up Scheduled', description: 'Site visit confirmed for tomorrow 10AM. Brochure scheduled for delivery.', isAiEvent: true, time: '11:29' },
];

export const DEMO_MEETING_INSIGHT = {
  meetingId: 'm1',
  agentName: 'Aman Sharma',
  customerName: 'Rajesh Kumar',
  customerBusiness: 'Rajesh Electronics',
  duration: '21:00',
  qualityScore: 78,
  summary: 'High-intent meeting. Customer is actively looking for a 3BHK in the ₹80L–₹1Cr range for self-use. Key objection: pricing vs Prestige Malad (₹8L cheaper). Payment plan received positively. Site visit requested for weekend. Family of 4 — school proximity is a positive signal.',
  customerIntent: 'Active buyer, evaluating options, decision pending spouse consultation',
  intentLevel: 'HIGH',
  requirement: {
    configuration: '3BHK',
    budgetMin: 8000000,
    budgetMax: 10000000,
    purpose: 'Self-use',
    location: 'Andheri West',
    timeline: '3-6 months',
    familySize: 4,
    paymentPreference: 'Construction-linked',
  },
  objections: [
    { type: 'PRICE', description: 'Prestige offering similar at ₹72L in Malad — ₹8L cheaper', severity: 'HIGH' },
    { type: 'DECISION', description: 'Needs spouse consultation before final commitment', severity: 'MEDIUM' },
  ],
  competitorMentions: [
    { name: 'Prestige', pricePoint: 7200000, location: 'Malad' },
  ],
  recommendedAction: 'Send payment-plan creative immediately. Schedule site visit this weekend. Prepare Prestige vs Lifestyle comparison asset.',
  qualityBreakdown: {
    requirementDiscovery: 85,
    customerEngagement: 80,
    objectionHandling: 65,
    productKnowledge: 90,
    closingAttempt: 70,
    followUpClarity: 75,
  },
};

export const DEMO_WHATSAPP_MESSAGES = [
  { id: 'wm1', direction: 'INBOUND', content: 'Hello, I saw your property ad. Interested in knowing more about 3BHK options.', time: '09:42', isAi: false },
  { id: 'wm2', direction: 'OUTBOUND', content: 'Hi Rajesh! Welcome to Lifestyle Homes 🏠 We have excellent 3BHK options at Lifestyle Grand, our premium project in Andheri West. What is your budget range?', time: '09:43', isAi: true },
  { id: 'wm3', direction: 'INBOUND', content: 'Looking for something around 80 lakhs to 1 crore. For own use. Family of 4.', time: '09:44', isAi: false },
  { id: 'wm4', direction: 'OUTBOUND', content: 'Great! We have 3BHK units from ₹80L to ₹1Cr at our RERA-registered project. 1150 sq ft with study room. Our agent Aman will visit you today. Is 10:30 AM convenient?', time: '09:45', isAi: true },
  { id: 'wm5', direction: 'INBOUND', content: 'Yes that works.', time: '09:47', isAi: false },
  { id: 'wm6', direction: 'OUTBOUND', content: '✅ Perfect! Aman will be at Rajesh Electronics by 10:30. He will bring detailed project brochures and floor plans for you.', time: '09:48', isAi: true },
];
