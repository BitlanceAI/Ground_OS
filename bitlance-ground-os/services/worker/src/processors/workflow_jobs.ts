import { Worker, Job } from 'bullmq';
import prisma from '@ground-os/database';

export const setupWorkflowJobsWorker = (redisConnection: any, eventBus: any, providers: any, logger: any) => {
  return new Worker(

  'workflow-jobs',
  async (job: Job) => {
    logger.info(`[workflow-jobs] Processing: ${job.name} (event: ${job.data.eventName})`);
    const { eventName, organizationId, entityId, payload } = job.data;

    // Find workflows triggered by this event, then check conditions
    const workflows = await prisma.workflow.findMany({
      where: {
        organizationId,
        status: 'ACTIVE',
      },
    });

    let triggeredCount = 0;
    for (const workflow of workflows) {
      const trigger = workflow.trigger as { type: string; conditions?: Record<string, any> };
      if (trigger.type !== eventName) continue;

      // Check optional trigger conditions against payload
      if (trigger.conditions && payload) {
        const conditionsMet = Object.entries(trigger.conditions).every(([key, val]) => {
          return payload[key] === val;
        });
        if (!conditionsMet) {
          logger.info(`[workflow-jobs] Skipping "${workflow.name}" — conditions not met`);
          continue;
        }
      }

      // Create a workflow run
      await prisma.workflowRun.create({
        data: {
          workflowId: workflow.id,
          entityType: payload?.entityType || 'customer',
          entityId: entityId || '',
          status: 'RUNNING',
          currentNode: 'n1',
          state: { triggeredBy: eventName, payload },
        },
      });

      triggeredCount++;
      logger.info(`[workflow-jobs] Triggered workflow "${workflow.name}" for entity ${entityId}`);
    }

    return { success: true, workflowsTriggered: triggeredCount };
  },
  { connection: redisConnection as any, concurrency: 5 }
  );
};
