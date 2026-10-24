// ============================================================
// BITLANCE GROUND OS — In-Memory Queue & Worker Replacement
// Replaces BullMQ & Redis with pure Node.js in-memory async processing
// ============================================================

import { randomUUID } from 'crypto';

export interface Job<T = any> {
  id: string;
  name: string;
  data: T;
}

export interface WorkerOptions {
  connection?: any;
  concurrency?: number;
}

export type Processor<T = any> = (job: Job<T>) => Promise<any>;

// In-memory worker registry
const workers = new Map<string, Worker<any>>();

export class Worker<T = any> {
  public name: string;
  public processor: Processor<T>;
  private errorListeners: ((err: Error) => void)[] = [];

  constructor(
    name: string,
    processor: Processor<T>,
    _options?: WorkerOptions
  ) {
    this.name = name;
    this.processor = processor;
    workers.set(name, this);
  }

  on(event: string, listener: (...args: any[]) => void) {
    if (event === 'error') {
      this.errorListeners.push(listener);
    }
    return this;
  }

  emitError(err: Error) {
    for (const listener of this.errorListeners) {
      listener(err);
    }
  }

  async close() {
    workers.delete(this.name);
  }
}

export class Queue {
  constructor(public name: string, _options?: any) {}

  async add(jobName: string, data: any, _options?: any) {
    const job: Job = {
      id: randomUUID(),
      name: jobName,
      data,
    };

    const worker = workers.get(this.name);
    if (worker) {
      // Process asynchronously in background
      setImmediate(async () => {
        try {
          await worker.processor(job);
        } catch (err: any) {
          worker.emitError(err);
        }
      });
    } else {
      console.warn(`[Queue:${this.name}] No worker registered for queue`);
    }

    return job;
  }
}

export async function processJobDirect(queueName: string, jobName: string, data: any) {
  const worker = workers.get(queueName);
  if (!worker) {
    throw new Error(`No worker registered for queue: ${queueName}`);
  }
  const job: Job = {
    id: randomUUID(),
    name: jobName,
    data,
  };
  return worker.processor(job);
}
