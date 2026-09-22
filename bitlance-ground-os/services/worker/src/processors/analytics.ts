import { Worker, Job } from 'bullmq';
import prisma from '@ground-os/database';

export const setupAnalyticsWorker = (redisConnection: any, eventBus: any, providers: any, logger: any) => {
  return new Worker(

  'analytics',
  async (job: Job) => {
    const { eventName, payload } = job.data;

    if (payload?.customerId) {
      try {
        await prisma.timelineEvent.create({
          data: {
            customerId: payload.customerId,
            type: eventName,
            title: eventName.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()),
            description: `${eventName} event recorded`,
            metadata: payload,
            isAiEvent: eventName.startsWith('AI_') || eventName.startsWith('TRANSCRIPT'),
            occurredAt: new Date(),
          },
        });
      } catch {
        // Non-fatal
      }
    }

    return { success: true, eventName };
  },
  { connection: redisConnection as any, concurrency: 20 }
  );
};
