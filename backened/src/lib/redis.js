/**
 * lib/redis.js
 *
 * Shared ioredis clients.
 *
 *   pub  – used for all regular Redis commands (INCR, GET, SET, LPUSH …)
 *          and implicitly by the Socket.IO adapter for publishing events.
 *
 *   sub  – dedicated subscriber connection required by createAdapter().
 *          ioredis clients in subscribe mode cannot issue regular commands,
 *          so it must stay isolated.
 *
 * Both clients are exported as singletons and reused everywhere in the app
 * (chat history, viewer counts, rate-limiting, moderation, adapter).
 */

import Redis from "ioredis";

const redisConfig = {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT  || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,  // empty string → undefined
    // Back off exponentially, give up after 10 retries so the process
    // doesn't spin forever when Redis is unavailable.
    retryStrategy: (times) => {
        if (times > 10) {
            console.error("[redis] Max reconnect attempts reached. Giving up.");
            return null;
        }
        return Math.min(times * 300, 5_000);
    },
    // Required by BullMQ-style usage; harmless for general use.
    maxRetriesPerRequest: null,
};

const pub = new Redis(redisConfig);
const sub = pub.duplicate();    // identical config, separate TCP connection

pub.on("error",   (err) => console.error("[redis:pub]", err.message));
sub.on("error",   (err) => console.error("[redis:sub]", err.message));
pub.on("connect", ()    => console.log("[redis] pub client connected"));
sub.on("connect", ()    => console.log("[redis] sub client connected"));

export { pub, sub };
