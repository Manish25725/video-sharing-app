import { Worker } from "bullmq";
import { redisConnection } from "../queues/subtitleQueue.js";
import { autoGenerateSubtitle } from "../utils/autoSubtitle.js";
import { Video } from "../models/video.model.js";

const subtitleWorker = new Worker(
    "subtitle-generation",
    async (job) => {
        const { videoId, videoFileUrl, language, ownerId } = job.data;
        console.log(`[subtitle worker] Starting job ${job.id} for video ${videoId}`);

        // 1. Run the Groq Whisper transcription (download → transcribe → upload to Cloudinary)
        const result = await autoGenerateSubtitle(videoFileUrl, language);

        // 2. Persist the subtitle URL in MongoDB
        const video = await Video.findById(videoId);
        if (!video) throw new Error(`Video ${videoId} not found in DB`);

        const existing = video.subtitles.findIndex(s => s.language === language);
        if (existing >= 0) {
            video.subtitles[existing] = result;
        } else {
            video.subtitles.push(result);
        }
        await video.save();

        // 3. Notify owner via Socket.io (real-time) if they are still connected
        if (global.io) {
            global.io.to(`user:${ownerId}`).emit("subtitle-ready", {
                videoId,
                subtitles: video.subtitles,
            });
        }

        console.log(`[subtitle worker] Done job ${job.id} for video ${videoId}`);
        return { subtitles: video.subtitles };
    },
    {
        connection: redisConnection,
        concurrency: 2,
        lockDuration: 300_000,   // 5-minute lock — prevents duplicate processing
    }
);

subtitleWorker.on("failed", (job, err) => {
    console.error(`[subtitle worker] Job ${job?.id} FAILED:`, err.message);
});

subtitleWorker.on("completed", (job) => {
    console.log(`[subtitle worker] Job ${job.id} COMPLETED`);
});

subtitleWorker.on("error", (err) => {
    console.error("[subtitle worker] Worker error:", err.message);
});

// Graceful shutdown — finish current job before stopping
process.on("SIGTERM", async () => {
    await subtitleWorker.close();
});
process.on("SIGINT", async () => {
    await subtitleWorker.close();
});

export { subtitleWorker };
