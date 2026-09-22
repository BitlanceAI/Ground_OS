import { Worker, Job } from 'bullmq';
import prisma from '@ground-os/database';

export const setupNotificationsWorker = (redisConnection: any, eventBus: any, providers: any, logger: any) => {
  return new Worker(

  'notifications',
  async (job: Job) => {
    logger.info(`[notifications] Processing: ${job.name}`);
    const { eventName, payload, organizationId } = job.data;

    if (eventName === 'LEAD_SCORE_UPDATED' && payload.newScore >= 80) {
      await prisma.notification.create({
        data: {
          organizationId,
          type: 'HIGH_INTENT_LEAD',
          title: `🔥 High Intent Lead — Score ${payload.newScore}`,
          body: `Lead score updated to ${payload.newScore}/100. Intent: ${payload.intentLevel}.`,
          metadata: { customerId: payload.customerId, score: payload.newScore },
          channel: 'IN_APP',
        },
      });
      logger.info(`[notifications] ✅ High intent notification created (score: ${payload.newScore})`);
    }

    if (eventName === 'AI_REPORT_READY') {
      await prisma.notification.create({
        data: {
          organizationId,
          type: 'AI_MEETING_REPORT',
          title: 'AI Meeting Report Ready',
          body: `Meeting analysis complete. Score: ${payload.leadScore}. Intent: ${payload.intentLevel}.`,
          metadata: { meetingId: payload.meetingId },
          channel: 'IN_APP',
        },
      });
    }

    return { success: true };
  },
  { connection: redisConnection as any, concurrency: 10 }
  );
};
