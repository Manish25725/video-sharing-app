import { Queue } from "bullmq";

// Redis connection config — reads from .env, falls back to localhost
export const redisConnection = {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,   // required by BullMQ
};

export const subtitleQueue = new Queue("subtitle-generation", {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 5000 },
        // Auto-remove old jobs so Redis doesn't fill up
        removeOnComplete: { count: 200 },
        removeOnFail:     { count: 100 },
    },
});

// Gracefully close the queue on process exit
process.on("SIGTERM", async () => { await subtitleQueue.close(); });
process.on("SIGINT",  async () => { await subtitleQueue.close(); });
