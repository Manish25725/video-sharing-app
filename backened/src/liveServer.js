import NodeMediaServer from "node-media-server";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawn, execSync } from "child_process";
import { Stream } from "./models/stream.model.js";
import { clearChatHistory } from "./live/chatHistory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Media root: backened/public/media/
const mediaRoot = path.join(__dirname, "..", "public", "media");

// ── Detect FFmpeg availability ──────────────────────────────
const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
const ffmpegAvailable = (() => {
  try {
    execSync(`"${ffmpegPath}" -version`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

if (!ffmpegAvailable) {
  console.warn("[NMS] FFmpeg not found — HLS transcoding disabled.");
  console.warn("[NMS] Install FFmpeg and set FFMPEG_PATH in .env to enable HLS.");
} else {
  console.log("[NMS] FFmpeg detected — HLS transcoding enabled.");
}

// Track running FFmpeg processes keyed by streamKey
const ffmpegProcesses = new Map();

// ── NMS v4 configuration ────────────────────────────────────
// NMS v4 has NO built-in trans/HLS — we spawn FFmpeg manually per stream.
// The HTTP server serves static files from mediaRoot via the `static` config.
const RTMP_PORT = parseInt(process.env.RTMP_PORT || "1935");
const HLS_PORT  = parseInt(process.env.HLS_PORT  || "8001");

const nmsConfig = {
  rtmp: {
    port: RTMP_PORT,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: HLS_PORT,
    allow_origin: "*",
  },
  // NMS v4 static file serving — serves /live/<key>/index.m3u8 from mediaRoot
  static: {
    router: "/",
    root: mediaRoot,
  },
};

const nms = new NodeMediaServer(nmsConfig);

// ── Start HLS transcoding + MP4 recording for a stream ──────
function startHls(streamKey) {
  if (!ffmpegAvailable) return;
  if (ffmpegProcesses.has(streamKey)) return; // already running

  const hlsDir = path.join(mediaRoot, "live", streamKey);
  const recDir = path.join(mediaRoot, "recordings");
  fs.mkdirSync(hlsDir, { recursive: true });
  fs.mkdirSync(recDir, { recursive: true });

  const rtmpUrl = `rtmp://127.0.0.1:${RTMP_PORT}/live/${streamKey}`;
  const m3u8    = path.join(hlsDir, "index.m3u8");
  const recPath = path.join(recDir, `${streamKey}.mp4`);

  // Dual FFmpeg output: HLS segments for live viewers + full MP4 saved as VOD
  const args = [
    "-re",
    "-i", rtmpUrl,
    // ── HLS (live viewers) ──────────────────────────────────
    "-c:v", "copy",
    "-c:a", "aac",
    "-f", "hls",
    "-hls_time", "2",
    "-hls_list_size", "3",
    "-hls_flags", "delete_segments",
    "-hls_segment_filename", path.join(hlsDir, "seg%03d.ts"),
    m3u8,
    // ── MP4 recording (full file for VOD after stream ends) ──
    "-c:v", "copy",
    "-c:a", "aac",
    "-movflags", "+faststart",
    recPath,
  ];

  const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "ignore", "pipe"] });
  ffmpegProcesses.set(streamKey, proc);

  proc.stderr.on("data", (d) => {
    const line = d.toString().trim();
    if (line.includes("Error") || line.includes("error")) {
      console.error(`[FFmpeg:${streamKey}]`, line);
    }
  });

  proc.on("exit", (code) => {
    console.log(`[FFmpeg:${streamKey}] exited with code ${code}`);
    ffmpegProcesses.delete(streamKey);
  });

  console.log(`[NMS] HLS + MP4 recording started for: ${streamKey}`);  console.log(`[NMS] Recording path: ${path.join(mediaRoot, "recordings", streamKey + ".mp4")}`);
}

// ── Stop HLS transcoding ────────────────────────────────────
function stopHls(streamKey) {
  const proc = ffmpegProcesses.get(streamKey);
  if (proc) {
    proc.kill("SIGTERM");
    ffmpegProcesses.delete(streamKey);
    console.log(`[NMS] HLS transcoding stopped for: ${streamKey}`);
  }
}

// ── NMS event hooks ─────────────────────────────────────────
nms.on("prePublish", async (session) => {
  const streamKey = session.streamPath?.split("/").pop();
  if (!streamKey) return;
  try {
    const stream = await Stream.findOne({ streamKey });
    if (!stream) {
      console.warn(`[NMS] Unknown stream key rejected: ${streamKey}`);
      session.socket?.end();
    }
  } catch (err) {
    console.error("[NMS] prePublish error:", err.message);
  }
});

nms.on("postPublish", async (session) => {
  const streamKey = session.streamPath?.split("/").pop();
  if (!streamKey) return;
  console.log(`[NMS] Stream started: ${streamKey}`);

  // Give RTMP a moment to stabilise before FFmpeg connects
  setTimeout(() => startHls(streamKey), 1500);

  try {
    await Stream.findOneAndUpdate(
      { streamKey },
      { isLive: true, startedAt: new Date() }
    );
    if (global.io) {
      global.io.to(`stream:${streamKey}`).emit("stream-started", { streamKey });
    }
  } catch (err) {
    console.error("[NMS] postPublish error:", err.message);
  }
});

nms.on("donePublish", async (session) => {
  const streamKey = session.streamPath?.split("/").pop();
  if (!streamKey) return;
  console.log(`[NMS] Stream ended: ${streamKey}`);

  stopHls(streamKey);

  try {
    await clearChatHistory(streamKey);
    await Stream.findOneAndUpdate(
      { streamKey },
      { isLive: false, endedAt: new Date() }
    );
    if (global.io) {
      global.io.to(`stream:${streamKey}`).emit("stream-ended", { streamKey });
    }
  } catch (err) {
    console.error("[NMS] donePublish error:", err.message);
  }
});

export { nms };
