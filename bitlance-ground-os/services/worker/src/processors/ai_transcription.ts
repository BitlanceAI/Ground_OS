import { Worker, Job } from 'bullmq';
import prisma from '@ground-os/database';

export const setupAiTranscriptionWorker = (redisConnection: any, eventBus: any, providers: any, logger: any) => {
  return new Worker(

  'ai-transcription',
  async (job: Job) => {
    logger.info(`[ai-transcription] Processing: ${job.name} (id: ${job.id})`);
    const { eventName, payload } = job.data;

    if (!['RECORDING_UPLOADED', 'MEETING_ENDED'].includes(eventName)) {
      return { skipped: true, reason: 'Not a transcription trigger event' };
    }

    const { meetingId, audioUrl } = payload;
    logger.info(`[ai-transcription] Transcribing meeting ${meetingId} from ${audioUrl}`);

    try {
      const result = await providers.sttProvider.transcribe(audioUrl);

      // Save transcript
      await prisma.transcript.upsert({
        where: { meetingId },
        create: {
          meetingId,
          rawText: result.text,
          confidence: result.confidence,
          language: 'en',
          segments: result.segments as any,
        },
        update: {
          rawText: result.text,
          confidence: result.confidence,
          processedAt: new Date(),
        },
      });

      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'PROCESSING' },
      });

      // Emit transcript ready for analysis
      const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
      await eventBus.transcriptReady(meeting?.organizationId || '', {
        meetingId,
        transcript: result.text,
        confidence: result.confidence,
      });

      logger.info(`[ai-transcription] ✅ Transcript saved for meeting ${meetingId} (${result.text.length} chars)`);
      return { success: true, meetingId, transcriptLength: result.text.length, confidence: result.confidence };
    } catch (err) {
      logger.error(`[ai-transcription] ❌ Failed: ${(err as Error).message}`);
      throw err;
    }
  },
  { connection: redisConnection as any, concurrency: 2 }
  );
};
