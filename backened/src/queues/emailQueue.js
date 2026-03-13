import { Queue } from "bullmq";

// Reuse the same Redis connection config as the rest of the app
const redisConnection = {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
};

let emailQueue = null;

try {
    emailQueue = new Queue("email", {
        connection: redisConnection,
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 5_000 },
            removeOnComplete: { count: 100 },
            removeOnFail:     { count: 50  },
        },
    });

    process.on("SIGTERM", async () => { await emailQueue?.close(); });
    process.on("SIGINT",  async () => { await emailQueue?.close(); });

} catch (err) {
    console.warn("[queue] Email queue disabled — Redis unavailable:", err.message);
}

export { emailQueue };
