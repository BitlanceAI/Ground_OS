// ============================================================
// BITLANCE GROUND OS — Demo Seed Data
// Lifestyle Homes — Signature Demo Journey
// Aman (Agent) → Rajesh Kumar (Customer) → Full Pipeline
// ============================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Bitlance Ground OS demo data...');

  // ── Organization ──────────────────────────────────────────
  const org = await prisma.organization.upsert({
    where: { slug: 'bitlance tech hub' },
    update: {},
    create: {
      name: 'bitlance tech hub',
      slug: 'bitlance-tech-hub',
      settings: {
        primaryColor: '#6366f1',
        voiceAIEnabled: true,
        whatsappEnabled: true,
        creativeEnabled: true,
        inactivityThresholdMinutes: 5,
      },
    },
  });
  console.log(`✅ Organization: ${org.name}`);

  // ── Users ─────────────────────────────────────────────────
  const pwHash = await bcrypt.hash('demo1234', 12);

  const ceoUser = await prisma.user.upsert({
    where: { email: 'ceo@bitlance.in' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'ceo@bitlance.in',
      passwordHash: pwHash,
      firstName: 'Anurag',
      lastName: 'Dhole',
      role: 'CEO',
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@bitlance.in' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'manager@bitlance.in',
      passwordHash: pwHash,
      firstName: 'Nilesh',
      lastName: 'Somnawane',
      role: 'SALES_MANAGER',
    },
  });

  const amanUser = await prisma.user.upsert({
    where: { email: 'aman@bitlance.in' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'nilesh@bitlance.in',
      passwordHash: pwHash,
      firstName: 'Nilesh',
      lastName: 'Somnawane',
      role: 'AGENT',
    },
  });

  const priyaUser = await prisma.user.upsert({
    where: { email: 'nilesh@bitlance.in' },
    update: {},
    create: {
      organizationId: org.id,
      email: 'nilesh@bitlance.in',
      passwordHash: pwHash,
      firstName: 'Nilesh',
      lastName: 'Somnawane',
      role: 'AGENT',
    },
  });
  console.log('✅ Users: CEO, Manager, Aman, Priya');

  // ── Agents ────────────────────────────────────────────────
  const amanAgent = await prisma.agent.upsert({
    where: { userId: amanUser.id },
    update: {},
    create: {
      organizationId: org.id,
      userId: amanUser.id,
      employeeCode: 'AG001',
      phone: '+91 98765 43210',
      status: 'ONLINE',
      currentLatitude: 19.076,
      currentLongitude: 72.8777,
      territory: 'Andheri West',
    },
  });

  const priyaAgent = await prisma.agent.upsert({
    where: { userId: priyaUser.id },
    update: {},
    create: {
      organizationId: org.id,
      userId: priyaUser.id,
      employeeCode: 'AG002',
      phone: '+91 98765 12345',
      status: 'IN_MEETING',
      currentLatitude: 19.112,
      currentLongitude: 72.8659,
      territory: 'Goregaon East',
    },
  });
  console.log('✅ Agents: Aman, Priya');

  // ── Project ───────────────────────────────────────────────
  const project = await prisma.project.create({
    data: {
      organizationId: org.id,
      name: 'Lifestyle Grand',
      description: 'Premium residential and commercial complex in Andheri West',
      type: 'MIXED',
      location: 'Andheri West, Mumbai',
      latitude: 19.136,
      longitude: 72.8278,
      reraNumber: 'P51800048924',
      isActive: true,
    },
  });

  // ── Inventory ─────────────────────────────────────────────
  await prisma.inventory.createMany({
    data: [
      {
        organizationId: org.id,
        projectId: project.id,
        unitType: '2BHK',
        configuration: '2 Bed, 2 Bath, Living',
        floorArea: 850,
        priceMin: 6500000,
        priceMax: 7500000,
        availableUnits: 12,
      },
      {
        organizationId: org.id,
        projectId: project.id,
        unitType: '3BHK',
        configuration: '3 Bed, 2 Bath, Living, Study',
        floorArea: 1150,
        priceMin: 8000000,
        priceMax: 10000000,
        availableUnits: 8,
      },
      {
        organizationId: org.id,
        projectId: project.id,
        unitType: 'Shop',
        configuration: 'Ground Floor Commercial',
        floorArea: 320,
        priceMin: 4500000,
        priceMax: 6000000,
        availableUnits: 5,
      },
    ],
  });
  console.log('✅ Project: Lifestyle Grand + Inventory');

  // ── KEY CUSTOMER: Rajesh Kumar / Rajesh Electronics ───────
  const rajesh = await prisma.customer.create({
    data: {
      organizationId: org.id,
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91 99887 76655',
      email: 'rajesh.kumar@gmail.com',
      type: 'SHOP_OWNER',
      businessName: 'Rajesh Electronics',
      address: 'Shop 14, Andheri West Market, Mumbai',
      latitude: 19.1236,
      longitude: 72.8371,
      whatsappOptIn: true,
    },
  });

  // Lead for Rajesh
  const rajeshLead = await prisma.lead.create({
    data: {
      organizationId: org.id,
      customerId: rajesh.id,
      status: 'QUALIFIED',
      score: 86,
      intentLevel: 'HIGH',
      purchaseProbability: 0.72,
      scoreExplanation:
        'High intent based on 3BHK requirement, budget fit, meeting engagement. Pricing objection noted.',
    },
  });

  // Score history
  await prisma.leadScoreHistory.createMany({
    data: [
      { leadId: rajeshLead.id, score: 30, reason: 'Initial WhatsApp enquiry received' },
      { leadId: rajeshLead.id, score: 55, reason: 'AI qualification — budget and requirement confirmed' },
      { leadId: rajeshLead.id, score: 86, reason: 'Post-meeting AI analysis — high intent, pricing objection detected' },
    ],
  });
  console.log('✅ Customer: Rajesh Kumar (Rajesh Electronics) — Lead score 86');

  // ── Additional Customers ───────────────────────────────────
  const suresh = await prisma.customer.create({
    data: {
      organizationId: org.id,
      firstName: 'Suresh',
      lastName: 'Mehta',
      phone: '+91 99112 33445',
      type: 'SHOP_OWNER',
      businessName: 'Mehta Textiles',
      address: 'Shop 7, Goregaon East, Mumbai',
      latitude: 19.165,
      longitude: 72.8496,
      whatsappOptIn: true,
    },
  });

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      customerId: suresh.id,
      status: 'CONTACTED',
      score: 42,
      intentLevel: 'MEDIUM',
      purchaseProbability: 0.35,
    },
  });

  const kavitha = await prisma.customer.create({
    data: {
      organizationId: org.id,
      firstName: 'Kavitha',
      lastName: 'Nair',
      phone: '+91 98001 23456',
      type: 'INDIVIDUAL',
      address: 'Versova, Andheri West',
      latitude: 19.145,
      longitude: 72.818,
      whatsappOptIn: true,
    },
  });

  await prisma.lead.create({
    data: {
      organizationId: org.id,
      customerId: kavitha.id,
      status: 'SITE_VISIT_SCHEDULED',
      score: 71,
      intentLevel: 'HIGH',
      purchaseProbability: 0.61,
    },
  });
  console.log('✅ Additional Customers: Suresh Mehta, Kavitha Nair');

  // ── WhatsApp Conversation (Rajesh) ────────────────────────
  const rajeshConv = await prisma.conversation.create({
    data: {
      organizationId: org.id,
      customerId: rajesh.id,
      channel: 'WHATSAPP',
      status: 'INACTIVE',
      lastMessageAt: new Date('2026-09-14T09:45:00.000Z'),
      inactiveSince: new Date('2026-09-14T11:20:00.000Z'),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: rajeshConv.id,
        direction: 'INBOUND',
        status: 'READ',
        content: 'Hello, I saw your property ad. Interested in knowing more about 3BHK options.',
        intent: 'ENQUIRY',
        createdAt: new Date('2026-09-14T09:42:00.000Z'),
      },
      {
        conversationId: rajeshConv.id,
        direction: 'OUTBOUND',
        status: 'READ',
        content: 'Hi Rajesh! Welcome to Lifestyle Homes. We have excellent 3BHK options at Lifestyle Grand. What is your budget range?',
        aiGenerated: true,
        createdAt: new Date('2026-09-14T09:43:00.000Z'),
      },
      {
        conversationId: rajeshConv.id,
        direction: 'INBOUND',
        status: 'READ',
        content: 'Looking for something around 80 lakhs to 1 crore. For own use. Family of 4.',
        intent: 'REQUIREMENT',
        createdAt: new Date('2026-09-14T09:44:00.000Z'),
      },
      {
        conversationId: rajeshConv.id,
        direction: 'OUTBOUND',
        status: 'READ',
        content: 'Great! We have 3BHK units ranging from ₹80L to ₹1Cr at our prime Andheri West project. Our agent Aman will visit you today to show you the details. Is that okay?',
        aiGenerated: true,
        createdAt: new Date('2026-09-14T09:45:00.000Z'),
      },
    ],
  });
  console.log('✅ WhatsApp conversation seeded');

  // ── Visit ─────────────────────────────────────────────────
  const visit = await prisma.visit.create({
    data: {
      organizationId: org.id,
      agentId: amanAgent.id,
      customerId: rajesh.id,
      status: 'REPORT_READY',
      scheduledAt: new Date('2026-09-14T10:30:00.000Z'),
      arrivedAt: new Date('2026-09-14T10:41:00.000Z'),
      verifiedAt: new Date('2026-09-14T10:42:00.000Z'),
      completedAt: new Date('2026-09-14T11:06:00.000Z'),
      destination: 'Rajesh Electronics, Shop 14, Andheri West',
      destinationLat: 19.1236,
      destinationLng: 72.8371,
      arrivalLatitude: 19.1234,
      arrivalLongitude: 72.8369,
    },
  });

  await prisma.visitEvent.createMany({
    data: [
      { visitId: visit.id, type: 'ASSIGNED', payload: { agentId: amanAgent.id }, createdAt: new Date('2026-09-14T10:00:00.000Z') },
      { visitId: visit.id, type: 'DEPARTED', payload: { lat: 19.076, lng: 72.8777 }, createdAt: new Date('2026-09-14T10:20:00.000Z') },
      { visitId: visit.id, type: 'ARRIVED', payload: { lat: 19.1234, lng: 72.8369 }, createdAt: new Date('2026-09-14T10:41:00.000Z') },
      { visitId: visit.id, type: 'LOCATION_VERIFIED', payload: { accuracy: 12 }, createdAt: new Date('2026-09-14T10:42:00.000Z') },
    ],
  });

  // ── Meeting ───────────────────────────────────────────────
  const meeting = await prisma.meeting.create({
    data: {
      organizationId: org.id,
      agentId: amanAgent.id,
      customerId: rajesh.id,
      visitId: visit.id,
      status: 'ANALYSED',
      startedAt: new Date('2026-09-14T10:43:00.000Z'),
      endedAt: new Date('2026-09-14T11:04:00.000Z'),
      durationSeconds: 1260,
      qualityScore: 78,
    },
  });

  // Transcript
  await prisma.transcript.create({
    data: {
      meetingId: meeting.id,
      rawText: `Agent: Good morning Rajesh sir, I am Aman from Lifestyle Homes.
Rajesh: Yes, come in. I got a WhatsApp message about the 3BHK.
Agent: Yes sir. We have beautiful 3BHK units at our Andheri West project — Lifestyle Grand. RERA registered.
Rajesh: What is the price? I told your bot, around 80 to 1 crore.
Agent: We have options from 80 lakhs to 1 crore. 1150 square feet. 3 bed 2 bath with a study room.
Rajesh: Hmm. What about Prestige? They are offering similar at 72 lakhs in Malad.
Agent: I understand sir. But Lifestyle Grand is closer — 5 minutes from the highway. And our amenities package is premium.
Rajesh: The price difference is still 8 lakhs. That is not small.
Agent: We do have a flexible payment plan, sir. 20-40-40 construction-linked. Very manageable.
Rajesh: That is interesting. My family is 4 — me, wife and two children. School is important.
Agent: The project is 3 minutes from DPS and Ryan International. That makes it very family-friendly.
Rajesh: When can I see the sample flat?
Agent: This weekend, sir. I will arrange a proper site visit with the developer team.
Rajesh: Okay. Let me discuss with my wife also.`,
      segments: [
        { speaker: 'Agent', start: 0, end: 10, text: 'Good morning Rajesh sir, I am Aman from Lifestyle Homes.' },
        { speaker: 'Customer', start: 11, end: 20, text: 'Yes, come in. I got a WhatsApp message about the 3BHK.' },
        { speaker: 'Agent', start: 21, end: 45, text: 'Yes sir. We have beautiful 3BHK units at our Andheri West project — Lifestyle Grand. RERA registered.' },
        { speaker: 'Customer', start: 46, end: 60, text: 'What is the price? I told your bot, around 80 to 1 crore.' },
        { speaker: 'Customer', start: 180, end: 200, text: 'What about Prestige? They are offering similar at 72 lakhs in Malad.' },
        { speaker: 'Customer', start: 400, end: 420, text: 'The price difference is still 8 lakhs. That is not small.' },
        { speaker: 'Customer', start: 600, end: 620, text: 'When can I see the sample flat?' },
      ],
      language: 'en',
      confidence: 0.94,
    },
  });

  // AI Meeting Insight
  await prisma.meetingInsight.create({
    data: {
      meetingId: meeting.id,
      summary: 'High-intent meeting with Rajesh Kumar of Rajesh Electronics. Customer is actively looking for a 3BHK in the ₹80L–₹1Cr range for self-use. Key objection: pricing vs Prestige Malad. Payment plan received positively. Site visit requested for weekend. Family of 4 — school proximity is a positive buying signal.',
      customerIntent: 'Purchase for self-use, urgent timeline, decision-making pending spouse consultation',
      intentLevel: 'HIGH',
      requirement: {
        propertyType: 'Residential',
        configuration: '3BHK',
        budgetMin: 8000000,
        budgetMax: 10000000,
        purpose: 'self-use',
        timeline: '3-6 months',
        familySize: 4,
      },
      budget: { min: 8000000, max: 10000000, flexibility: 'LOW', paymentPlanInterest: true },
      locationPreference: 'Andheri West, proximity to schools',
      urgency: 'MEDIUM',
      isDecisionMaker: true,
      objections: [
        { type: 'PRICE', description: 'Prestige offering similar at 72L in Malad — 8L cheaper', severity: 'HIGH' },
        { type: 'DECISION', description: 'Needs spouse consultation before committing', severity: 'MEDIUM' },
      ],
      competitorMentions: [
        { name: 'Prestige', project: 'Unknown Malad Project', pricePoint: 7200000, location: 'Malad' },
      ],
      sentiment: 'POSITIVE',
      qualityScore: 78,
      qualityBreakdown: {
        requirementDiscovery: 85,
        customerEngagement: 80,
        objectionHandling: 65,
        productKnowledge: 90,
        closingAttempt: 70,
        followUpClarity: 75,
      },
      recommendedAction: 'Send payment-plan creative immediately. Schedule site visit this weekend. Prepare Prestige vs Lifestyle comparison asset.',
      recommendedFollowupAt: new Date('2026-09-15T10:00:00.000Z'),
    },
  });
  console.log('✅ Meeting, Transcript & AI Insight seeded');

  // ── Requirements ──────────────────────────────────────────
  await prisma.requirement.create({
    data: {
      customerId: rajesh.id,
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
      objections: ['Price vs Prestige Malad'],
      competitorMentions: ['Prestige'],
      preferredChannel: 'WHATSAPP',
      confidence: 0.91,
    },
  });

  // ── Creative Request ───────────────────────────────────────
  const creative = await prisma.creativeRequest.create({
    data: {
      organizationId: org.id,
      customerId: rajesh.id,
      type: 'WHATSAPP_CREATIVE',
      brief: {
        title: 'Flexible Payment Plan — Lifestyle Grand 3BHK',
        customerName: 'Rajesh Kumar',
        objectionAddressed: 'Price Comparison',
        keyMessages: ['20-40-40 Construction Linked Plan', 'School Proximity — DPS & Ryan International', 'RERA Registered', 'Premium Andheri West Location'],
        tone: 'Professional, Reassuring',
        format: 'WhatsApp Image Card',
      },
      status: 'READY',
      assetUrl: '/demo/creatives/rajesh-payment-plan-card.png',
    },
  });
  console.log('✅ Creative request seeded');

  // ── Voice Call ─────────────────────────────────────────────
  await prisma.voiceCall.create({
    data: {
      customerId: rajesh.id,
      conversationId: rajeshConv.id,
      status: 'COMPLETED',
      triggerReason: 'CUSTOMER_INACTIVE_5MIN',
      duration: 187,
      intent: 'FOLLOW_UP',
      sentiment: 'POSITIVE',
      requirementDelta: { siteVisitRequested: true, paymentPlanInterest: 'CONFIRMED' },
      objections: [{ type: 'SPOUSE_CONSULTATION', resolved: false }],
      outcome: 'SITE_VISIT_SCHEDULED',
      nextAction: 'Send site visit confirmation + property brochure',
      followUpDate: new Date('2026-09-15T10:00:00.000Z'),
      startedAt: new Date('2026-09-14T11:25:00.000Z'),
      endedAt: new Date('2026-09-14T11:28:07.000Z'),
    },
  });
  console.log('✅ Voice AI call seeded');

  // ── Follow-up ─────────────────────────────────────────────
  await prisma.followUp.create({
    data: {
      customerId: rajesh.id,
      assignedTo: amanAgent.id,
      type: 'SITE_VISIT',
      reason: 'High-intent customer requested weekend site visit during meeting',
      dueAt: new Date('2026-09-15T10:00:00.000Z'),
      status: 'PENDING',
      aiGenerated: true,
    },
  });
  console.log('✅ Follow-up seeded');

  // ── Customer 360 Timeline ─────────────────────────────────
  await prisma.timelineEvent.createMany({
    data: [
      {
        customerId: rajesh.id,
        type: 'WHATSAPP_ENQUIRY',
        title: 'WhatsApp Enquiry',
        description: 'Customer enquired about 3BHK via Lifestyle Homes chatbot',
        isAiEvent: false,
        occurredAt: new Date('2026-09-14T09:42:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'AI_QUALIFICATION',
        title: 'AI Qualification',
        description: 'Budget ₹80L–₹1Cr confirmed. 3BHK, self-use, family of 4.',
        isAiEvent: true,
        occurredAt: new Date('2026-09-14T09:45:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'AGENT_ARRIVED',
        title: 'Agent Arrived',
        description: 'Aman arrived at Rajesh Electronics. GPS verified.',
        isAiEvent: false,
        occurredAt: new Date('2026-09-14T10:41:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'MEETING_STARTED',
        title: 'Meeting Started',
        description: 'Field meeting started. Recording active.',
        isAiEvent: false,
        occurredAt: new Date('2026-09-14T10:43:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'MEETING_COMPLETED',
        title: 'Meeting Completed',
        description: '21-minute meeting completed. Recording uploaded.',
        isAiEvent: false,
        occurredAt: new Date('2026-09-14T11:04:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'AI_ANALYSIS',
        title: 'AI Analysis Completed',
        description: 'Transcript processed. Requirements, objections, and intent extracted.',
        isAiEvent: true,
        metadata: { qualityScore: 78, objections: 2, requirements: 6 },
        occurredAt: new Date('2026-09-14T11:06:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'LEAD_SCORE_UPDATED',
        title: 'Lead Score → 86',
        description: 'Lead score updated from 55 to 86. Intent: HIGH.',
        isAiEvent: true,
        metadata: { previousScore: 55, newScore: 86 },
        occurredAt: new Date('2026-09-14T11:07:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'CEO_NOTIFIED',
        title: 'CEO Notified',
        description: 'AI intelligence summary sent to CEO via WhatsApp.',
        isAiEvent: true,
        occurredAt: new Date('2026-09-14T11:08:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'CREATIVE_GENERATED',
        title: 'Creative Generated',
        description: 'Payment plan WhatsApp creative generated and ready for delivery.',
        isAiEvent: true,
        occurredAt: new Date('2026-09-14T11:13:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'CREATIVE_SENT',
        title: 'Creative Delivered',
        description: 'Payment plan creative sent via WhatsApp.',
        isAiEvent: false,
        occurredAt: new Date('2026-09-14T11:15:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'CONVERSATION_INACTIVE',
        title: 'Conversation Inactive',
        description: 'No response for 5 minutes. Inactivity workflow triggered.',
        isAiEvent: true,
        occurredAt: new Date('2026-09-14T11:20:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'VOICE_AI_TRIGGERED',
        title: 'Voice AI Triggered',
        description: 'Eligibility check passed. Voice AI calling with conversation context.',
        isAiEvent: true,
        occurredAt: new Date('2026-09-14T11:25:00.000Z'),
      },
      {
        customerId: rajesh.id,
        type: 'FOLLOW_UP_SCHEDULED',
        title: 'Follow-up Scheduled',
        description: 'Site visit confirmed for tomorrow 10AM. Brochure to be sent.',
        isAiEvent: true,
        occurredAt: new Date('2026-09-14T11:29:00.000Z'),
      },
    ],
  });
  console.log('✅ Customer 360 timeline seeded (13 events)');

  // ── Inactivity Workflow ───────────────────────────────────
  const inactivityWorkflow = await prisma.workflow.create({
    data: {
      organizationId: org.id,
      name: 'WhatsApp Inactivity → Voice AI',
      description: 'After 5 minutes of customer inactivity, check eligibility and trigger Voice AI follow-up',
      trigger: {
        type: 'CUSTOMER_INACTIVE',
        conditions: { inactivityMinutes: 5, channel: 'WHATSAPP' },
      },
      nodes: [
        { id: 'n1', type: 'TRIGGER', label: 'Customer Inactive 5min', next: 'n2' },
        { id: 'n2', type: 'CONDITION', label: 'Eligibility Check', conditions: ['calling_hours', 'opt_out', 'cooldown', 'lead_eligible'], next: 'n3', onFail: 'n6' },
        { id: 'n3', type: 'AI', label: 'Inject Conversation Context', next: 'n4' },
        { id: 'n4', type: 'VOICE', label: 'Trigger Voice AI Call', next: 'n5' },
        { id: 'n5', type: 'CRM_UPDATE', label: 'Update CRM with Call Analysis', next: 'n6' },
        { id: 'n6', type: 'ANALYTICS', label: 'Log Workflow Outcome', next: null },
      ],
      status: 'ACTIVE',
    },
  });
  console.log('✅ Inactivity workflow seeded');

  // ── Notifications ─────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        organizationId: org.id,
        type: 'HIGH_INTENT_LEAD',
        title: '🔥 High Intent Lead — Rajesh Kumar',
        body: 'Lead score: 86/100. 3BHK, ₹80L–₹1Cr. Pricing objection vs Prestige. Recommend: payment-plan creative + site visit.',
        metadata: { customerId: rajesh.id, score: 86 },
        channel: 'WHATSAPP',
      },
      {
        organizationId: org.id,
        type: 'AI_MEETING_REPORT',
        title: 'AI Meeting Report Ready — Rajesh Kumar',
        body: 'Meeting with Aman (21 min). Quality score 78. 2 objections detected. Site visit requested.',
        metadata: { meetingId: meeting.id },
        channel: 'IN_APP',
      },
      {
        organizationId: org.id,
        type: 'VOICE_AI_COMPLETED',
        title: 'Voice AI Call Completed — Rajesh Kumar',
        body: 'Call duration: 3:07. Outcome: Site visit scheduled. Sentiment: Positive.',
        metadata: { customerId: rajesh.id },
        channel: 'IN_APP',
      },
    ],
  });
  console.log('✅ Notifications seeded');

  console.log('\n🎉 Bitlance Ground OS demo seed complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('   CEO:     ceo@lifestylehomes.in / demo1234');
  console.log('   Manager: manager@lifestylehomes.in / demo1234');
  console.log('   Agent:   aman@lifestylehomes.in / demo1234');
  console.log('\n🏠 Demo Tenant: Lifestyle Homes');
  console.log('👤 Key Customer: Rajesh Kumar (Score: 86)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
