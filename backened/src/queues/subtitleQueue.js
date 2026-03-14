import { Queue } from "bullmq";

const useMock = process.env.NODE_ENV === "production" && !process.env.REDIS_URL;

export const redisConnection = process.env.REDIS_URL ? {
    url: process.env.REDIS_URL,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false
} : {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    lazyConnect: true,
};

let subtitleQueue = null;

if (!useMock) {
    try {
        subtitleQueue = new Queue("subtitle-generation", {
            connection: redisConnection,
            defaultJobOptions: {
                attempts: 2,
                backoff: { type: "exponential", delay: 5000 },
                removeOnComplete: { age: 3600, count: 200 },
                removeOnFail:     { age: 3600, count: 100 },
            },
        });

        process.on("SIGTERM", async () => { await subtitleQueue?.close(); });
        process.on("SIGINT",  async () => { await subtitleQueue?.close(); });
    } catch (err) {
        console.warn("[queue] Redis unavailable - subtitle queue disabled.");
    }
} else {
    console.warn("[queue] Subtitle queue totally bypassed for Free Plan without REDIS.");
}

export { subtitleQueue };
