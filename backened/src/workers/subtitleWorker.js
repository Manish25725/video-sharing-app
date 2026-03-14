import { Worker } from "bullmq";
import { redisConnection } from "../queues/subtitleQueue.js";
import { autoGenerateSubtitle } from "../utils/autoSubtitle.js";
import { Video } from "../models/video.model.js";

const useMock = process.env.NODE_ENV === "production" && !process.env.REDIS_URL;

let subtitleWorker = null;

if (!useMock) {
    try {
        subtitleWorker = new Worker(
            "subtitle-generation",
            async (job) => {
                const { videoId, videoFileUrl, language, ownerId } = job.data;
                const result = await autoGenerateSubtitle(
                    videoFileUrl,
                    language,
                    async (step, message) => {
                        await job.updateProgress({ step, message });
                    }
                );

                const video = await Video.findById(videoId);
                if (!video) throw new Error(`Video ${videoId} not found`);
                const existing = video.subtitles.findIndex(s => s.language === language);
                if (existing >= 0) {
                    video.subtitles[existing] = result;
                } else {
                    video.subtitles.push(result);
                }
                await video.save();

                if (global.io) {
                    global.io.to(`user:${ownerId}`).emit("subtitle-ready", {
                        videoId,
                        subtitles: video.subtitles,
                    });
                }
                return { subtitles: video.subtitles };
            },
            {
                connection: redisConnection,
                concurrency: 2,
                lockDuration: 300_000,
            }
        );

        subtitleWorker.on("failed", (job, err) => {
            console.error(`[subtitle worker] failed:`, err.message);
        });

        subtitleWorker.on("error", (err) => {
            if (err.code !== "ECONNREFUSED") console.error("Worker error:", err.message);
        });

        process.on("SIGTERM", async () => { await subtitleWorker?.close(); });
        process.on("SIGINT",  async () => { await subtitleWorker?.close(); });
    } catch (err) {
        console.warn("[subtitle worker] Redis unavailable");
    }
} else {
    console.warn("[subtitle worker] Bypassed for Free Plan without REDIS.");
}

export { subtitleWorker };
