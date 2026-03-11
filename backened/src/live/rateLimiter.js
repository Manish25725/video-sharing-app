/**
 * live/rateLimiter.js
 *
 * Fixed-window rate limiter for chat messages.
 *
 * Each user (identified by userId or, for guests, socket.id) gets a
 * Redis counter per stream, scoped to a rolling time window.
 * If they exceed MAX_MESSAGES within WINDOW_SECONDS, `isChatRateLimited`
 * returns true and the socket handler can reject the message early.
 *
 * Key  : ratelimit:chat:<identifier>:<streamKey>
 * TTL  : WINDOW_SECONDS (auto-expires the counter)
 */

import { pub } from "../lib/redis.js";

const WINDOW_SECONDS = 10;  // sliding window duration
const MAX_MESSAGES   = 5;   // messages per window per user

/**
 * Returns true (blocked) if the user has sent more than MAX_MESSAGES
 * within the current WINDOW_SECONDS window.
 *
 * Uses a two-command pipeline (INCR + TTL) so the window start is set
 * accurately on the FIRST message in a window without a race condition.
 *
 * @param {string} identifier  userId or socket.id for guests
 * @param {string} streamKey
 * @returns {Promise<boolean>}
 */
export async function isChatRateLimited(identifier, streamKey) {
    const key = `ratelimit:chat:${identifier}:${streamKey}`;

    const pipeline = pub.pipeline();
    pipeline.incr(key);
    pipeline.ttl(key);
    const [[, count], [, ttl]] = await pipeline.exec();

    // Set expiry only when the key is brand new (TTL === -1 means no expiry set)
    if (ttl === -1) await pub.expire(key, WINDOW_SECONDS);

    return count > MAX_MESSAGES;
}
