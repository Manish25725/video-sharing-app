import { Queue } from "bullmq";

const useMock = process.env.NODE_ENV === "production" && !process.env.REDIS_URL;

const redisConnection = process.env.REDIS_URL ? {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
} : {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
};

let emailQueue = null;

if (!useMock) {
    try {
        emailQueue = new Queue("email", {
            connection: redisConnection,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: "exponential", delay: 5_000 },
                removeOnComplete: { count: 100 },
                removeOnFail:     { count: 50 },
            },
        });
        process.on("SIGTERM", async () => { await emailQueue?.close(); });
        process.on("SIGINT",  async () => { await emailQueue?.close(); });
    } catch (err) {
        console.warn("[queue] Email queue disabled - Redis unavailable:", err.message);
    }
} else {
    console.warn("[queue] Email queue completely bypassed for Free Plan without REDIS.");
}

export { emailQueue };
