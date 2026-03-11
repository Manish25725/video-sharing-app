/**
 * live/viewerCount.js
 *
 * Redis-backed viewer count per stream.
 *
 * Replaces the previous in-memory `global.streamViewers` Map.
 * Because the counter lives in Redis, every Node.js instance behind
 * the load balancer shares the same number.
 *
 * Key  : stream:viewers:<streamKey>   (integer)
 * TTL  : 24 h (rolling)
 */

import { pub } from "../lib/redis.js";
import { Stream } from "../models/stream.model.js";

const KEY = (streamKey) => `stream:viewers:${streamKey}`;
const TTL_SECONDS = 86_400;

/**
 * Increment the count when a viewer joins.
 * @returns {number} updated count
 */
export async function incrementViewer(streamKey) {
    const pipeline = pub.pipeline();
    pipeline.incr(KEY(streamKey));
    pipeline.expire(KEY(streamKey), TTL_SECONDS);
    const [[, count]] = await pipeline.exec();
    return count;
}

/**
 * Decrement the count when a viewer leaves or disconnects.
 * Floors at 0 so counts never go negative due to race conditions.
 * @returns {number} updated count
 */
export async function decrementViewer(streamKey) {
    const value = await pub.decr(KEY(streamKey));
    if (value < 0) {
        await pub.set(KEY(streamKey), 0);
        return 0;
    }
    return value;
}

/**
 * Read the current viewer count without modifying it.
 * @returns {number}
 */
export async function getViewerCount(streamKey) {
    const val = await pub.get(KEY(streamKey));
    return parseInt(val || "0");
}

/**
 * Flush the Redis count to MongoDB (called fire-and-forget after each join/leave).
 * Errors are caught so they never crash the socket handler.
 */
export async function syncViewerCountToDB(streamKey, count) {
    try {
        await Stream.findOneAndUpdate({ streamKey }, { viewerCount: count });
    } catch (err) {
        console.error("[viewerCount] DB sync failed:", err.message);
    }
}

/**
 * Remove the key entirely (e.g. when a stream ends).
 */
export async function resetViewerCount(streamKey) {
    await pub.del(KEY(streamKey));
}
