import { Worker, Job } from 'bullmq';
import prisma from '@ground-os/database';

export const setupCreativeGenerationWorker = (redisConnection: any, eventBus: any, providers: any, logger: any) => {
  return new Worker(

  'creative-generation',
  async (job: Job) => {
    logger.info(`[creative-generation] Processing: ${job.name}`);
    const { payload } = job.data;
    const { requestId, customerId, type, brief } = payload;

    const result = await providers.creativeProvider.generate({ type, brief });

    const creativeRequest = await prisma.creativeRequest.findUnique({ where: { id: requestId } });

    if (creativeRequest) {
      await prisma.creativeRequest.update({
        where: { id: requestId },
        data: { status: 'READY', assetUrl: result.assetUrl },
      });

      await eventBus.creativeGenerated(creativeRequest.organizationId, {
        requestId,
        customerId: customerId || '',
        assetUrl: result.assetUrl,
      });
    }

    logger.info(`[creative-generation] ✅ Creative ready: ${result.assetUrl}`);
    return { success: true, assetUrl: result.assetUrl };
  },
  { connection: redisConnection as any, concurrency: 2 }
  );
};
