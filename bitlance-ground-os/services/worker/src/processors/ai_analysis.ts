import { Worker, Job } from 'bullmq';
import prisma from '@ground-os/database';

export const setupAiAnalysisWorker = (redisConnection: any, eventBus: any, providers: any, logger: any) => {
  return new Worker(

  'ai-analysis',
  async (job: Job) => {
    logger.info(`[ai-analysis] Processing: ${job.name} (id: ${job.id})`);
    const { eventName, payload } = job.data;

    if (eventName === 'TRANSCRIPT_READY') {
      const { meetingId } = payload;
      logger.info(`[ai-analysis] Analysing meeting ${meetingId}`);

      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          agent: { include: { user: { select: { firstName: true, lastName: true } } } },
          customer: { select: { id: true, firstName: true, lastName: true } },
          recording: true,
          visit: { include: { customer: { select: { id: true } } } },
        },
      });

      if (!meeting) throw new Error(`Meeting ${meetingId} not found`);

      const customerName = meeting.customer ? `${meeting.customer.firstName} ${meeting.customer.lastName}`.trim() : 'Customer';
      const agentName = meeting.agent?.user ? `${meeting.agent.user.firstName} ${meeting.agent.user.lastName}`.trim() : 'Agent';
      const audioUrl = meeting.recording?.storageUrl || '';

      // Resolve project name from visit/customer relation instead of hardcoding
      const projectName = (meeting as any).project?.name || 'Ground OS Project';

      const insight = await providers.aiOrchestrator.processMeeting(meetingId, audioUrl, {
        customerName,
        agentName,
        projectName,
      });

      // Persist insight
      await prisma.meetingInsight.upsert({
        where: { meetingId },
        create: {
          meetingId,
          summary: insight.summary,
          customerIntent: insight.customerIntent,
          intentLevel: insight.intentLevel,
          sentiment: insight.sentiment,
          qualityScore: insight.qualityScore,
          requirement: insight.requirement as any,
          objections: insight.objections as any,
          competitorMentions: insight.competitorMentions as any,
          recommendedAction: insight.recommendedAction,
        },
        update: {
          summary: insight.summary,
          intentLevel: insight.intentLevel,
          qualityScore: insight.qualityScore,
          processedAt: new Date(),
        },
      });

      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'ANALYSED' },
      });

      // Update lead score
      if (meeting.customer) {
        const lead = await prisma.lead.findFirst({ where: { customerId: meeting.customer.id } });
        if (lead) {
          const previousScore = lead.score;
          await prisma.lead.update({
            where: { id: lead.id },
            data: { score: insight.qualityScore, intentLevel: insight.intentLevel as any },
          });

          await eventBus.leadScoreUpdated(meeting.organizationId, {
            customerId: meeting.customer.id,
            leadId: lead.id,
            previousScore,
            newScore: insight.qualityScore,
            intentLevel: insight.intentLevel,
          });

          await eventBus.aiReportReady(meeting.organizationId, {
            meetingId,
            customerId: meeting.customer.id,
            leadScore: insight.qualityScore,
            intentLevel: insight.intentLevel,
          });
        }
      }

      logger.info(`[ai-analysis] ✅ Meeting ${meetingId} analysed. Score: ${insight.qualityScore}, Intent: ${insight.intentLevel}`);
      return { success: true, meetingId, score: insight.qualityScore, intentLevel: insight.intentLevel };
    }

    if (eventName === 'VOICE_CALL_COMPLETED') {
      const { callId, transcript } = payload;
      logger.info(`[ai-analysis] Analysing voice call ${callId}`);

      const analysis = await providers.aiOrchestrator.analyseVoiceCall(transcript || '', 'Follow-up call');

      await prisma.voiceCall.update({
        where: { id: callId },
        data: {
          transcript,
          intent: analysis.intent,
          sentiment: analysis.sentiment,
          outcome: analysis.outcome,
          nextAction: analysis.nextAction,
          status: 'COMPLETED',
        },
      });

      logger.info(`[ai-analysis] ✅ Voice call ${callId} analysed. Outcome: ${analysis.outcome}`);
      return { success: true, callId, outcome: analysis.outcome };
    }

    return { skipped: true };
  },
  { connection: redisConnection as any, concurrency: 3 }
  );
};
