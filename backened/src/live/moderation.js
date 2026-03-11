/**
 * live/moderation.js
 *
 * Two-layer chat moderation:
 *
 *   1. Banned-word filter  – stateless, runs in-process (no Redis hit).
 *      Extend the baseline list or supply extras via BANNED_WORDS env var
 *      (comma-separated): BANNED_WORDS=badword1,badword2
 *
 *   2. Per-stream muted users  – stored in a Redis SET so the mute list is
 *      shared across all server instances and survives restarts.
 *      Key  : stream:muted:<streamKey>   (SET of userId strings)
 *      TTL  : 12 h (auto-expires after the stream is expected to end)
 */

import { pub } from "../lib/redis.js";

// ── Banned words ──────────────────────────────────────────────────────────────

// Minimal baseline (always applied). Keep this list short and obvious.
const BASELINE = ["spamword", "scammer"];

// Additional words can be injected at deploy-time via env without code changes.
const ENV_WORDS = (process.env.BANNED_WORDS || "")
    .split(",")
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean);

const ALL_BANNED = [...new Set([...BASELINE, ...ENV_WORDS])];

/**
 * Returns true if `message` contains any banned word (case-insensitive).
 * Runs synchronously — no I/O.
 *
 * @param {string} message
 * @returns {boolean}
 */
export function containsBannedWord(message) {
    const lower = message.toLowerCase();
    return ALL_BANNED.some((w) => w && lower.includes(w));
}

// ── Muted users ───────────────────────────────────────────────────────────────

const MUTED_KEY = (streamKey) => `stream:muted:${streamKey}`;
const MUTED_TTL = 43_200; // 12 h

/**
 * Mute a user for the duration of a stream.
 * The set's TTL is refreshed on every mute to ensure the key stays alive.
 *
 * @param {string} streamKey
 * @param {string} userId
 */
export async function muteUserInStream(streamKey, userId) {
    const key = MUTED_KEY(streamKey);
    await pub.sadd(key, String(userId));
    await pub.expire(key, MUTED_TTL);
}

/**
 * Lift a mute. The set remains in Redis (other users may still be muted).
 *
 * @param {string} streamKey
 * @param {string} userId
 */
export async function unmuteUserInStream(streamKey, userId) {
    await pub.srem(MUTED_KEY(streamKey), String(userId));
}

/**
 * Returns true if the given userId is currently muted in this stream.
 * Guests (no userId) are never flagged as muted.
 *
 * @param {string} streamKey
 * @param {string|null} userId
 * @returns {Promise<boolean>}
 */
export async function isUserMuted(streamKey, userId) {
    if (!userId) return false;
    return Boolean(await pub.sismember(MUTED_KEY(streamKey), String(userId)));
}

/**
 * Return the full list of muted user IDs for a stream.
 * Useful for building a moderation panel UI.
 *
 * @param {string} streamKey
 * @returns {Promise<string[]>}
 */
export async function getMutedUsers(streamKey) {
    return pub.smembers(MUTED_KEY(streamKey));
}

/**
 * Wipe all mutes when a stream ends.
 * The 12 h TTL is the fallback; explicit cleanup is faster.
 *
 * @param {string} streamKey
 */
export async function clearStreamModeration(streamKey) {
    await pub.del(MUTED_KEY(streamKey));
}
