/**
 * emailRateLimit.js
 * Fixed-window rate limiter for email sending — max 5 emails per 10 minutes
 * per identifier (userId or email address), backed by Redis INCR.
 */

import { pub } from "../lib/redis.js";

const MAX_EMAILS   = 5;
const WINDOW_SECS  = 600; // 10 minutes

/**
 * Returns true if the rate limit has been exceeded for this identifier.
 * On the first hit it sets a 10-minute TTL so the window auto-resets.
 *
 * @param {string} identifier  userId string or email address
 * @returns {Promise<boolean>}
 */
export async function isEmailRateLimited(identifier) {
    const key   = `ratelimit:email:${identifier}`;
    const count = await pub.incr(key);
    if (count === 1) await pub.expire(key, WINDOW_SECS); // set TTL on first increment
    return count > MAX_EMAILS;
}
