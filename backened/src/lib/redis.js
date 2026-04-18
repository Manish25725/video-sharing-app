/**
 * lib/redis.js
 *
 * Shared ioredis clients.
 */

import Redis from "ioredis";

const redisConfig = {
    retryStrategy: (times) => {
        if (times > 10) {
            console.error("[redis] Max reconnect attempts reached. Giving up.");
            return null;
        }
        return Math.min(times * 300, 5_000);
    },
    maxRetriesPerRequest: null, // Required by BullMQ
};

// Use Upstash REDIS_URL if provided, else fallback to local redis
const pub = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisConfig)
    : new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379"),
        password: process.env.REDIS_PASSWORD || undefined,
        ...redisConfig
    });

const sub = pub.duplicate();

pub.on("error",   (err) => console.error("[redis:pub]", err.message));
sub.on("error",   (err) => console.error("[redis:sub]", err.message));
pub.on("connect", ()    => {});
sub.on("connect", ()    => {});

export { pub, sub };
