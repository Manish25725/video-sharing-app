import { Queue } from "bullmq";

// Redis connection config — reads from .env, falls back to localhost
export const redisConnection = {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,   // empty string → undefined (no auth)
    maxRetriesPerRequest: null,   // required by BullMQ
    enableOfflineQueue: false,    // fail fast instead of queuing commands when Redis is down
    lazyConnect: true,            // don't connect until first command
};

let subtitleQueue = null;

try {
    subtitleQueue = new Queue("subtitle-generation", {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: "exponential", delay: 5000 },
            // Keep completed jobs long enough so the controller can detect
            // an already-running job before adding a duplicate.
            // 1 hour is more than enough for any subtitle pipeline run.
            removeOnComplete: { age: 3600, count: 200 },
            removeOnFail:     { age: 3600, count: 100 },
        },
    });

    // Gracefully close the queue on process exit
    process.on("SIGTERM", async () => { await subtitleQueue?.close(); });
    process.on("SIGINT",  async () => { await subtitleQueue?.close(); });

    console.log(`[queue] Subtitle queue initialised (Redis: ${redisConnection.host}:${redisConnection.port})`);
} catch (err) {
    console.warn("[queue] Redis unavailable — subtitle queue disabled:", err.message);
}

export { subtitleQueue };
