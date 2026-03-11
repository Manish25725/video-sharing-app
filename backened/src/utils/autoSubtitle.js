/**
 * autoSubtitle.js — chunk-based subtitle generation for videos of any size
 *
 * Why chunking is necessary
 * ─────────────────────────
 * Groq's free Whisper API rejects files larger than 25 MB.  A typical
 * 1-hour 1080p video can easily exceed 1 GB.  By extracting the audio
 * track (which shrinks a 1 GB video to ~55 MB at 128 kbps) and then
 * splitting it into 5-minute segments (~4.8 MB each), every chunk is
 * comfortably under the limit regardless of how long the original video is.
 *
 * Pipeline
 * ────────
 *   downloadVideo()   → temp/sub_video_<ts>.mp4      (stream download)
 *   extractAudio()    → temp/sub_audio_<ts>.mp3      (FFmpeg, 16 kHz mono)
 *   splitAudio()      → temp/sub_chunks_<ts>/chunk_NNN.mp3  (FFmpeg segment)
 *   transcribeChunk() → VTT string per chunk          (Groq Whisper)
 *   mergeVtt()        → single valid WebVTT file      (timestamp offsetting)
 *   Cloudinary upload → permanent subtitle URL
 *   cleanupFiles()    → temp video, audio, chunks and final vtt (always)
 *
 * Environment variables required
 * ──────────────────────────────
 *   GROQ_API_KEY      – https://console.groq.com (free tier)
 *   FFMPEG_PATH       – override if ffmpeg is not in PATH (optional)
 *   FFPROBE_PATH      – override if ffprobe is not in PATH (optional)
 */

import fs            from "fs";
import path          from "path";
import { execFile }  from "child_process";
import { promisify } from "util";
import axios         from "axios";
import Groq          from "groq-sdk";
import { uploadSubtitleToCloudinary } from "./cloudinary.js";

const execFileAsync = promisify(execFile);

const FFMPEG        = process.env.FFMPEG_PATH  || "ffmpeg";
const FFPROBE       = process.env.FFPROBE_PATH || "ffprobe";
const CHUNK_SECONDS = 300; // 5 min × 128 kbps ≈ 4.8 MB — well under the 25 MB limit

// ─── Helper: safe file deletion ───────────────────────────────────────────────

/** Delete a single file; never throws so cleanup never blocks the main flow. */
function safeUnlink(filePath) {
    try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch { /* ignore */ }
}

/**
 * Delete every file in `files` and optionally remove an entire `directory`.
 * Failures are logged but never re-thrown.
 *
 * @param {string[]} files
 * @param {string|null} directory
 */
function cleanupFiles(files = [], directory = null) {
    for (const f of files) safeUnlink(f);
    if (directory) {
        try { fs.rmSync(directory, { recursive: true, force: true }); } catch { /* ignore */ }
    }
}

// ─── Step 1: download ─────────────────────────────────────────────────────────

/**
 * Stream-download a remote URL to a local file path.
 * No timeout is set on the HTTP request so huge files (multi-GB) can finish.
 *
 * @param {string} url
 * @param {string} dest  absolute path to write to
 */
async function downloadVideo(url, dest) {
    console.log(`[subtitle] Downloading video…`);
    const writer = fs.createWriteStream(dest);
    const { data: stream } = await axios.get(url, {
        responseType: "stream",
        timeout: 0,           // no timeout — large files need as long as they need
    });
    await new Promise((resolve, reject) => {
        stream.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error",  reject);
    });
    const mb = (fs.statSync(dest).size / 1_048_576).toFixed(1);
    console.log(`[subtitle] Download complete — ${mb} MB`);
}

// ─── Step 2: extract audio ────────────────────────────────────────────────────

/**
 * Use FFmpeg to strip the video track and write a compact MP3.
 *
 *   -ac 1        mono  → halves file size vs stereo, no quality loss for speech
 *   -ar 16000    16 kHz sample rate — exactly what Whisper was trained on
 *   -b:a 128k    constant bitrate keeps size predictable per second of audio
 *
 * @param {string} videoPath
 * @param {string} audioPath  destination .mp3 path
 */
async function extractAudio(videoPath, audioPath) {
    console.log("[subtitle] Extracting audio with FFmpeg…");
    await execFileAsync(FFMPEG, [
        "-y",                        // overwrite output without prompting
        "-i",    videoPath,
        "-vn",                       // drop video stream entirely
        "-ac",   "1",                // mono
        "-ar",   "16000",            // 16 kHz
        "-b:a",  "128k",             // 128 kbps CBR
        "-f",    "mp3",
        audioPath,
    ]);
    const mb = (fs.statSync(audioPath).size / 1_048_576).toFixed(1);
    console.log(`[subtitle] Audio extracted — ${mb} MB`);
}

// ─── Step 3: split audio ──────────────────────────────────────────────────────

/**
 * Split a single MP3 into CHUNK_SECONDS-length segments using FFmpeg's
 * segment muxer.  `-reset_timestamps 1` makes each chunk start at t=0,
 * so Groq's VTT timestamps are always relative to the chunk start — we
 * add the cumulative offset ourselves in mergeVtt().
 *
 * @param {string} audioPath
 * @param {string} chunksDir  directory that will hold chunk_000.mp3, chunk_001.mp3, …
 * @returns {Promise<Array<{chunkPath: string, durationSeconds: number}>>}
 */
async function splitAudio(audioPath, chunksDir) {
    fs.mkdirSync(chunksDir, { recursive: true });
    const pattern = path.join(chunksDir, "chunk_%03d.mp3");

    console.log(`[subtitle] Splitting audio into ${CHUNK_SECONDS}s segments…`);
    await execFileAsync(FFMPEG, [
        "-y",
        "-i",              audioPath,
        "-f",              "segment",
        "-segment_time",   String(CHUNK_SECONDS),
        "-c",              "copy",          // stream-copy: no re-encode, nearly instant
        "-reset_timestamps", "1",           // each chunk's timestamps start at 0
        pattern,
    ]);

    // Collect output files in sorted order
    const files = fs.readdirSync(chunksDir)
        .filter((f) => f.startsWith("chunk_") && f.endsWith(".mp3"))
        .sort();

    if (files.length === 0) throw new Error("[subtitle] FFmpeg produced no audio chunks.");

    // Probe the real duration of every chunk (the last chunk is always shorter)
    const chunks = await Promise.all(
        files.map(async (file) => {
            const chunkPath = path.join(chunksDir, file);
            const { stdout } = await execFileAsync(FFPROBE, [
                "-v",              "error",
                "-show_entries",   "format=duration",
                "-of",             "default=noprint_wrappers=1:nokey=1",
                chunkPath,
            ]);
            return {
                chunkPath,
                durationSeconds: parseFloat(stdout.trim()) || CHUNK_SECONDS,
            };
        })
    );

    console.log(`[subtitle] ${chunks.length} chunk(s) ready.`);
    return chunks;
}

// ─── Step 4: transcribe ───────────────────────────────────────────────────────

/**
 * Send one audio chunk to Groq Whisper and return the raw VTT string.
 * Retries once (after a 3-second back-off) on any transient API error.
 *
 * @param {string} chunkPath
 * @param {string} language   BCP-47 code
 * @param {Groq}   groq       Groq SDK instance
 * @param {number} attempt    internal retry counter — do not pass
 * @returns {Promise<string>} raw VTT text
 */
async function transcribeChunk(chunkPath, language, groq, attempt = 1) {
    const mb = (fs.statSync(chunkPath).size / 1_048_576).toFixed(1);
    console.log(`[subtitle] Transcribing ${path.basename(chunkPath)} (${mb} MB, attempt ${attempt})…`);

    try {
        const result = await groq.audio.transcriptions.create({
            file:            fs.createReadStream(chunkPath),
            model:           "whisper-large-v3",
            language,
            response_format: "vtt",          // Groq returns WebVTT text directly
        });
        // Groq SDK returns a plain string for response_format "vtt"
        return typeof result === "string" ? result : String(result);
    } catch (err) {
        if (attempt < 2) {
            console.warn(`[subtitle] Retrying ${path.basename(chunkPath)} after error:`, err.message);
            await new Promise((r) => setTimeout(r, 3_000));
            return transcribeChunk(chunkPath, language, groq, attempt + 1);
        }
        throw err;
    }
}

// ─── Step 5: merge VTT ───────────────────────────────────────────────────────

/**
 * Parse a VTT timestamp ("HH:MM:SS.mmm" or "MM:SS.mmm") to total seconds.
 * @param {string} ts
 * @returns {number}
 */
function parseVttTs(ts) {
    const parts = ts.trim().split(":");
    if (parts.length === 3) {
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    }
    return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
}

/**
 * Format total seconds to "HH:MM:SS.mmm" (always three-part, required by WebVTT spec).
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatVttTs(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = (totalSeconds % 60).toFixed(3).padStart(6, "0");
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${s}`;
}

/**
 * Shift every cue line "A --> B" in a VTT block by `offsetSeconds`.
 * @param {string} vttText
 * @param {number} offsetSeconds
 * @returns {string}
 */
function offsetVttBlock(vttText, offsetSeconds) {
    if (offsetSeconds === 0) return vttText;
    return vttText.replace(
        /(\d{1,2}:\d{2}[:.]\d{3})\s*-->\s*(\d{1,2}:\d{2}[:.]\d{3})/g,
        (_, start, end) =>
            `${formatVttTs(parseVttTs(start) + offsetSeconds)} --> ${formatVttTs(parseVttTs(end) + offsetSeconds)}`
    );
}

/**
 * Merge multiple VTT strings into one valid WebVTT file.
 *
 * Each VTT string's timestamps are offset by the cumulative start time of
 * that chunk so all cues are correctly placed on a single timeline.
 *
 * Example for three 300-second chunks:
 *   offsets = [0, 300, 598]   (last chunk was actually 298 s long)
 *
 * @param {string[]} vttTexts      one VTT string per chunk, in order
 * @param {number[]} offsetsSeconds cumulative start-second for each chunk
 * @returns {string} final merged VTT content
 */
function mergeVtt(vttTexts, offsetsSeconds) {
    const cueBlocks = [];

    for (let i = 0; i < vttTexts.length; i++) {
        const offset = offsetsSeconds[i];
        // Strip the "WEBVTT" header line — we add a single one at the top.
        // Also trim leading blank lines so blocks join cleanly.
        const body = vttTexts[i]
            .replace(/^WEBVTT[^\n]*\n/, "")
            .replace(/^\s+/, "");

        if (!body.trim()) continue;   // silent chunk — no cues, skip

        cueBlocks.push(offsetVttBlock(body, offset).trim());
    }

    return "WEBVTT\n\n" + cueBlocks.join("\n\n") + "\n";
}

// ─── Language label map ───────────────────────────────────────────────────────

function languageLabel(code) {
    const MAP = {
        en: "English",  hi: "Hindi",    fr: "French",  es: "Spanish",
        de: "German",   ja: "Japanese", zh: "Chinese", ar: "Arabic",
        pt: "Portuguese", ru: "Russian", ko: "Korean", it: "Italian",
    };
    return MAP[code] ?? code.toUpperCase();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate WebVTT subtitles for a video of any size.
 *
 * @param {string} videoUrl  Public Cloudinary video URL
 * @param {string} language  BCP-47 code (default "en")
 * @returns {Promise<{ url: string, language: string, label: string }>}
 */
export async function autoGenerateSubtitle(videoUrl, language = "en") {
    if (!process.env.GROQ_API_KEY) {
        throw new Error(
            "GROQ_API_KEY is not set. Get a free key at https://console.groq.com"
        );
    }

    const groq    = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const ts      = Date.now();
    const tmpDir  = path.resolve("./public/temp");
    fs.mkdirSync(tmpDir, { recursive: true });

    const videoPath = path.join(tmpDir, `sub_video_${ts}.mp4`);
    const audioPath = path.join(tmpDir, `sub_audio_${ts}.mp3`);
    const chunksDir = path.join(tmpDir, `sub_chunks_${ts}`);
    const vttPath   = path.join(tmpDir, `sub_final_${ts}.vtt`);

    try {
        // ── 1. Download ───────────────────────────────────────────────────
        await downloadVideo(videoUrl, videoPath);

        // ── 2. Extract audio ──────────────────────────────────────────────
        await extractAudio(videoPath, audioPath);
        safeUnlink(videoPath);   // free disk space — no longer needed

        // ── 3. Split ──────────────────────────────────────────────────────
        const chunks = await splitAudio(audioPath, chunksDir);
        safeUnlink(audioPath);   // free disk space — no longer needed

        // ── 4. Transcribe (sequential to respect Groq rate limits) ────────
        const vttTexts = [];
        for (const chunk of chunks) {
            const text = await transcribeChunk(chunk.chunkPath, language, groq);
            vttTexts.push(text);
        }

        // ── 5. Build cumulative time offsets ──────────────────────────────
        // offsets[0] = 0
        // offsets[i] = offsets[i-1] + chunks[i-1].durationSeconds
        const offsets = chunks.reduce((acc, { durationSeconds }, i) => {
            acc.push(i === 0 ? 0 : acc[i - 1] + chunks[i - 1].durationSeconds);
            return acc;
        }, /** @type {number[]} */ ([]));

        // ── 6. Merge into a single VTT file ───────────────────────────────
        const mergedVtt = mergeVtt(vttTexts, offsets);
        if (!mergedVtt || mergedVtt.trim() === "WEBVTT") {
            throw new Error("Transcription produced no readable speech.");
        }
        fs.writeFileSync(vttPath, mergedVtt, "utf8");

        // ── 7. Upload to Cloudinary ───────────────────────────────────────
        console.log("[subtitle] Uploading merged VTT to Cloudinary…");
        const uploaded = await uploadSubtitleToCloudinary(vttPath);
        if (!uploaded?.url) throw new Error("Cloudinary VTT upload failed.");

        console.log("[subtitle] Complete —", uploaded.url);
        return { url: uploaded.url, language, label: languageLabel(language) };

    } finally {
        // Always delete every temp file, even if an error was thrown mid-way.
        cleanupFiles([videoPath, audioPath, vttPath], chunksDir);
    }
}

