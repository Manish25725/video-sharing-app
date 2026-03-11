/**
 * autoSubtitle.js
 *
 * Uses Groq's FREE Whisper API to generate subtitles from a video URL.
 *
 * Flow:
 *  1. Download the video file to a temp path.
 *  2. Send it to Groq Whisper (response_format: "vtt" → get VTT text directly).
 *  3. Write the VTT to a temp file and upload to Cloudinary.
 *  4. Delete both temp files (always, via finally).
 *  5. Return the Cloudinary subtitle URL.
 *
 * Free tier: 7,200 audio-seconds / day  |  File size limit: 25 MB
 * Get a free API key at: https://console.groq.com
 * Requires env variable: GROQ_API_KEY
 */

import fs   from "fs";
import path from "path";
import axios from "axios";
import Groq from "groq-sdk";
import { uploadSubtitleToCloudinary } from "./cloudinary.js";

/** Safely delete a file if it exists — never throws. */
function cleanupFile(filePath) {
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch {
        // Ignore cleanup errors — they should never block the main flow
    }
}

/**
 * @param {string} videoUrl  - Public URL of the video (e.g. from Cloudinary).
 * @param {string} language  - BCP-47 language hint, e.g. "en", "hi", "fr" (default "en").
 * @returns {{ url: string, language: string, label: string }}
 */
export async function autoGenerateSubtitle(videoUrl, language = "en") {
    if (!process.env.GROQ_API_KEY) {
        throw new Error(
            "GROQ_API_KEY is not set. Get a free key at https://console.groq.com and add it to your .env file."
        );
    }

    // Instantiate lazily so dotenv has already loaded the env vars
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const ts       = Date.now();
    const tmpDir   = path.resolve("./public/temp");
    const tmpVideo = path.join(tmpDir, `sub_input_${ts}.mp4`);
    const tmpVtt   = path.join(tmpDir, `sub_output_${ts}.vtt`);

    try {
        // 1. Download video ─────────────────────────────────────────────────
        console.log("[subtitle] Downloading video…");
        const writer = fs.createWriteStream(tmpVideo);
        const { data: stream } = await axios.get(videoUrl, { responseType: "stream" });
        await new Promise((resolve, reject) => {
            stream.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error",  reject);
        });

        // 2. Check file size (Groq free limit = 25 MB) ──────────────────────
        const fileSizeMB = fs.statSync(tmpVideo).size / (1024 * 1024);
        if (fileSizeMB > 25) {
            throw new Error(
                `File is ${fileSizeMB.toFixed(1)} MB. Groq's free Whisper API supports up to 25 MB per file. ` +
                `Try a shorter video or compress it first.`
            );
        }
        console.log(`[subtitle] File size: ${fileSizeMB.toFixed(1)} MB — sending to Groq Whisper…`);

        // 3. Transcribe with Groq Whisper (returns VTT string directly) ─────
        const vttText = await groq.audio.transcriptions.create({
            file:            fs.createReadStream(tmpVideo),
            model:           "whisper-large-v3",
            language:        language,
            response_format: "vtt",          // Groq returns WebVTT text directly
        });
        console.log("[subtitle] Groq transcription complete.");

        if (!vttText || vttText.trim().length < 10) {
            throw new Error("Groq returned an empty transcription. The video may have no speech.");
        }

        // 4. Write VTT to temp file ──────────────────────────────────────────
        fs.writeFileSync(tmpVtt, vttText, "utf8");

        // 5. Upload .vtt to Cloudinary ───────────────────────────────────────
        console.log("[subtitle] Uploading VTT to Cloudinary…");
        const uploaded = await uploadSubtitleToCloudinary(tmpVtt);
        if (!uploaded?.url) throw new Error("Cloudinary VTT upload failed.");

        console.log("[subtitle] Done –", uploaded.url);
        return { url: uploaded.url, language, label: "English" };

    } finally {
        // Always clean up both temp files, regardless of success or failure
        cleanupFile(tmpVideo);
        cleanupFile(tmpVtt);
    }
}
