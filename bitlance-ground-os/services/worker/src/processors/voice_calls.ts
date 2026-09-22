import { Worker, Job } from 'bullmq';
import prisma from '@ground-os/database';

export const setupVoiceCallsWorker = (redisConnection: any, eventBus: any, providers: any, logger: any) => {
  return new Worker(

  'voice-calls',
  async (job: Job) => {
    logger.info(`[voice-calls] Processing: ${job.name}`);
    const { payload } = job.data;
    const { callId, customerId, to } = payload;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { conversations: { take: 1, orderBy: { updatedAt: 'desc' } } },
    });

    if (!customer) throw new Error(`Customer ${customerId} not found`);

    const customerName = `${customer.firstName} ${customer.lastName}`.trim();
    const context = `Customer ${customerName} previously enquired about properties. This is an automated follow-up call.`;

    const result = await providers.voiceProvider.initiateCall({
      to: to || customer.phone,
      customerName,
      context,
    });

    await prisma.voiceCall.update({
      where: { id: callId },
      data: { externalCallId: result.callId, status: 'DIALING', startedAt: new Date() },
    });

    logger.info(`[voice-calls] ✅ Call initiated for ${customerName}: ${result.callId}`);
    return { success: true, callId: result.callId, customerName };
  },
  { connection: redisConnection as any, concurrency: 2 }
  );
};
