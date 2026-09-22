import { Worker, Job } from 'bullmq';
import prisma from '@ground-os/database';

export const setupWhatsappOutboundWorker = (redisConnection: any, eventBus: any, providers: any, logger: any) => {
  return new Worker(

  'whatsapp-outbound',
  async (job: Job) => {
    logger.info(`[whatsapp-outbound] Processing: ${job.name}`);
    const { to, message, mediaUrl, templateName, params } = job.data;

    let result;
    if (mediaUrl) {
      result = await providers.whatsappProvider.sendImage(to, mediaUrl, message);
    } else if (templateName) {
      result = await providers.whatsappProvider.sendTemplate(to, templateName, params || []);
    } else {
      result = await providers.whatsappProvider.sendMessage(to, message);
    }

    logger.info(`[whatsapp-outbound] ✅ Message sent to ${to}: ${JSON.stringify(result)}`);
    return { success: true, messageId: result.messageId, to };
  },
  { connection: redisConnection as any, concurrency: 5 }
  );
};
