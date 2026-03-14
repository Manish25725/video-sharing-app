/**
 * lib/redis.js
 *
 * Shared ioredis clients.
 */

import Redis from "ioredis";
import RedisMock from "ioredis-mock";

const useMock = process.env.NODE_ENV === "production" && !process.env.REDIS_URL;

const redisConfig = {
    host:     process.env.REDIS_HOST     || "127.0.0.1",
    port:     parseInt(process.env.REDIS_PORT  || "6379"),
    password: process.env.REDIS_PASSWORD || undefined, 
    retryStrategy: (times) => {
        if (times > 10) {
            console.error("[redis] Max reconnect attempts reached. Giving up.");
            return null;
        }
        return Math.min(times * 300, 5_000);
    },
    maxRetriesPerRequest: null,
};

let pub;
let sub;

if (useMock) {
    console.log("[redis] Using MOCK Redis instance for free tier compatibility.");
    pub = new RedisMock();
    sub = pub.duplicate();
} else {
    if (process.env.REDIS_URL) {
        pub = new Redis(process.env.REDIS_URL, redisConfig);
    } else {
        pub = new Redis(redisConfig);
    }
    sub = pub.duplicate();
}

pub.on("error",   (err) => console.error("[redis:pub]", err.message));
sub.on("error",   (err) => console.error("[redis:sub]", err.message));
pub.on("connect", ()    => {});
sub.on("connect", ()    => {});

export { pub, sub };
