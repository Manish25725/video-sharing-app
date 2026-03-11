/**
 * live/socketHandlers.js
 *
 * All Socket.IO event handlers for the live streaming + chat feature.
 *
 * Extracted from src/index.js so the server entry-point stays concise
 * and this module can be tested or replaced independently.
 *
 * Redis integration points
 * ────────────────────────
 * • Viewer count  – incrementViewer / decrementViewer (Redis INCR/DECR)
 * • Chat history  – pushChatHistory / getChatHistory  (Redis LIST)
 * • Rate limiting – isChatRateLimited                 (Redis fixed-window counter)
 * • Moderation    – isUserMuted / containsBannedWord   (Redis SET + in-process filter)
 * • Pub/Sub sync  – handled transparently by the Socket.IO Redis adapter
 *                   attached in index.js before this function is called.
 */

import { Stream }  from "../models/stream.model.js";
import { Message } from "../models/message.model.js";
import { pushChatHistory, getChatHistory }                   from "./chatHistory.js";
import { incrementViewer, decrementViewer, syncViewerCountToDB } from "./viewerCount.js";
import { isChatRateLimited }                                 from "./rateLimiter.js";
import { containsBannedWord, isUserMuted }                   from "./moderation.js";

/**
 * Attach all Socket.IO event listeners to the given `io` instance.
 *
 * Must be called AFTER `io.adapter(createAdapter(...))` is set so that
 * room broadcasts automatically propagate to all server instances via Redis.
 *
 * @param {import("socket.io").Server} io
 */
export function registerSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log("[socket] connected:", socket.id);

        // ── Personal notification room ────────────────────────
        // The subtitle worker and notification controller use this to
        // push events directly to a specific logged-in user.
        socket.on("join-user", (userId) => {
            if (userId) socket.join(`user:${userId}`);
        });

        // ── Video interaction room ────────────────────────────
        // Used for real-time like/comment events on a video page.
        socket.on("join-video", (videoId) => {
            if (videoId) socket.join(`video:${videoId}`);
        });

        // ── Join live stream ──────────────────────────────────
        socket.on("join-stream", async ({ streamKey, userId } = {}) => {
            if (!streamKey) return;

            socket.join(`stream:${streamKey}`);

            // Store stream association on the socket so disconnect can clean up
            socket._streamKey = streamKey;
            socket._userId    = userId || null;

            try {
                // 1. Increment the Redis viewer counter (shared across servers)
                const count = await incrementViewer(streamKey);

                // Broadcast updated count to everyone in the room
                io.to(`stream:${streamKey}`).emit("viewer-count", { count });

                // Persist to MongoDB asynchronously — don't await to keep join fast
                syncViewerCountToDB(streamKey, count);

                // 2. Send chat history to only the newly joined socket
                const history = await getChatHistory(streamKey);
                socket.emit("chat-history", history);
            } catch (err) {
                console.error("[socket] join-stream error:", err.message);
            }
        });

        // ── Leave live stream ─────────────────────────────────
        socket.on("leave-stream", async ({ streamKey } = {}) => {
            if (!streamKey) return;

            socket.leave(`stream:${streamKey}`);
            socket._streamKey = null;

            try {
                const count = await decrementViewer(streamKey);
                io.to(`stream:${streamKey}`).emit("viewer-count", { count });
                syncViewerCountToDB(streamKey, count);
            } catch (err) {
                console.error("[socket] leave-stream error:", err.message);
            }
        });

        // ── Chat message ──────────────────────────────────────
        socket.on("chat-message", async (data) => {
            const { streamKey, message, userId, username } = data || {};
            if (!streamKey || !message?.trim()) return;

            // Sanitize: strip HTML, enforce length limits
            const sanitized    = message.trim().replace(/<[^>]*>/g, "").substring(0, 500);
            const safeUsername = (username || "Viewer").replace(/<[^>]*>/g, "").substring(0, 60);

            try {
                // ── Guard 1: rate limiting ────────────────────
                // Use userId for authenticated users; fall back to socket.id for guests
                // so guests are rate-limited per connection, not globally.
                const limited = await isChatRateLimited(userId || socket.id, streamKey);
                if (limited) {
                    socket.emit("chat-error", {
                        code:    "RATE_LIMITED",
                        message: "Slow down — you are sending messages too quickly."
                    });
                    return;
                }

                // ── Guard 2: mute check ───────────────────────
                const muted = await isUserMuted(streamKey, userId);
                if (muted) {
                    socket.emit("chat-error", {
                        code:    "MUTED",
                        message: "You have been muted by the streamer."
                    });
                    return;
                }

                // ── Guard 3: banned-word filter ───────────────
                if (containsBannedWord(sanitized)) {
                    socket.emit("chat-error", {
                        code:    "BANNED_WORD",
                        message: "Your message was removed for violating community guidelines."
                    });
                    return;
                }

                // ── Persist to MongoDB ────────────────────────
                const stream = await Stream.findOne({ streamKey }).lean();
                if (!stream) return;

                const msg = await Message.create({
                    streamId: stream._id,
                    userId:   userId || null,
                    username: safeUsername,
                    message:  sanitized,
                });

                const payload = {
                    _id:       msg._id,
                    userId:    msg.userId,
                    username:  msg.username,
                    message:   msg.message,
                    createdAt: msg.createdAt,
                };

                // ── Cache in Redis ────────────────────────────
                await pushChatHistory(streamKey, payload);

                // ── Broadcast to all servers via Redis adapter ─
                // The adapter's pub/sub ensures every Node.js instance
                // delivers this to their local sockets in the room.
                io.to(`stream:${streamKey}`).emit("chat-message", payload);
            } catch (err) {
                console.error("[socket] chat-message error:", err.message);
            }
        });

        // ── Disconnect ────────────────────────────────────────
        // socket._streamKey is set by join-stream and cleared by leave-stream.
        // If the browser closes without explicitly leaving, we clean up here.
        socket.on("disconnect", async () => {
            console.log("[socket] disconnected:", socket.id);
            const streamKey = socket._streamKey;
            if (!streamKey) return;

            try {
                const count = await decrementViewer(streamKey);
                io.to(`stream:${streamKey}`).emit("viewer-count", { count });
                syncViewerCountToDB(streamKey, count);
            } catch (err) {
                console.error("[socket] disconnect cleanup error:", err.message);
            }
        });
    });
}
