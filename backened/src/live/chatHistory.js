/**
 * live/chatHistory.js
 *
 * Stores the last N chat messages for each active stream in a Redis LIST.
 *
 * Key  : chat:history:<streamKey>
 * TTL  : 24 h (reset on every push so the key stays alive while streaming)
 *
 * When a new viewer joins, `getChatHistory` returns all stored messages
 * in chronological order so they can catch up on recent conversation.
 */

import { pub } from "../lib/redis.js";

const KEY = (streamKey) => `chat:history:${streamKey}`;
const MAX_MESSAGES = 100;
const TTL_SECONDS  = 86_400; // 24 h

/**
 * Append a message object to the stream's history list and trim to MAX_MESSAGES.
 * Uses a pipeline to execute RPUSH + LTRIM + EXPIRE atomically in one round-trip.
 *
 * @param {string} streamKey
 * @param {object} message  – serialisable chat payload
 */
export async function pushChatHistory(streamKey, message) {
    const key      = KEY(streamKey);
    const pipeline = pub.pipeline();
    pipeline.rpush(key, JSON.stringify(message)); // append to tail (newest last)
    pipeline.ltrim(key, -MAX_MESSAGES, -1);       // keep only the last 100
    pipeline.expire(key, TTL_SECONDS);            // rolling 24 h TTL
    await pipeline.exec();
}

/**
 * Retrieve all cached messages in chronological order (oldest → newest).
 *
 * @param {string} streamKey
 * @returns {object[]}
 */
export async function getChatHistory(streamKey) {
    const raw = await pub.lrange(KEY(streamKey), 0, -1);
    return raw
        .map((s) => { try { return JSON.parse(s); } catch { return null; } })
        .filter(Boolean);
}

/**
 * Delete the history when a stream ends.
 * The 24 h TTL also handles automatic cleanup, but calling this gives
 * an instant reset so the streamer's next session starts fresh.
 *
 * @param {string} streamKey
 */
export async function clearChatHistory(streamKey) {
    await pub.del(KEY(streamKey));
}

