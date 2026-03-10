import NodeMediaServer from "node-media-server";
import path from "path";
import { fileURLToPath } from "url";
import { exec, execSync } from "child_process";
import { Stream } from "./models/stream.model.js";

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
  console.warn("[NMS] FFmpeg not found — HLS transcoding and thumbnails are disabled.");
  console.warn("[NMS] Install FFmpeg and set FFMPEG_PATH in .env to enable HLS.");
}

// ── NMS configuration ───────────────────────────────────────
const nmsConfig = {
  rtmp: {
    port: parseInt(process.env.RTMP_PORT || "1935"),
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: parseInt(process.env.HLS_PORT || "8001"),
    mediaroot: mediaRoot,
    allow_origin: "*",
  },
};

// Only enable transcoding if FFmpeg is available
if (ffmpegAvailable) {
  nmsConfig.trans = {
    ffmpeg: ffmpegPath,
    tasks: [
      {
        app: "live",
        hls: true,
        // 2-second segments, keep 3 in list, delete old ones to save disk space
        hlsFlags: "[hls_time=2:hls_list_size=3:hls_flags=delete_segments]",
        hlsKeep: false,
        // Record the full stream as MP4
        mp4: true,
        mp4Flags: "[movflags=frag_keyframe+empty_moov]",
      },
    ],
  };
}

const nms = new NodeMediaServer(nmsConfig);

// ── Thumbnail generator (fires 10s after stream starts) ─────
function captureThumbnail(streamKey) {
  if (!ffmpegAvailable) return;
  const hlsUrl = `http://localhost:${process.env.HLS_PORT || 8001}/live/${streamKey}/index.m3u8`;
  const thumbPath = path.join(mediaRoot, "live", streamKey, "thumbnail.jpg");
  const cmd = `"${ffmpegPath}" -i "${hlsUrl}" -ss 00:00:01 -vframes 1 "${thumbPath}" -y`;

  exec(cmd, (err) => {
    if (err) return; // Stream may not be ready yet; thumbnail stays empty
    const publicUrl = `/media/live/${streamKey}/thumbnail.jpg`;
    Stream.findOneAndUpdate({ streamKey }, { thumbnailUrl: publicUrl }).catch(() => {});
    console.log(`[NMS] Thumbnail saved for stream: ${streamKey}`);
  });
}

// ── NMS event hooks ─────────────────────────────────────────
nms.on("prePublish", async (id, streamPath) => {
  const streamKey = streamPath.split("/").pop();
  try {
    const stream = await Stream.findOne({ streamKey });
    if (!stream) {
      console.warn(`[NMS] Unknown stream key rejected: ${streamKey}`);
      const session = nms.getSession(id);
      if (session?.reject) session.reject();
    }
  } catch (err) {
    console.error("[NMS] prePublish error:", err.message);
  }
});

nms.on("postPublish", async (id, streamPath) => {
  const streamKey = streamPath.split("/").pop();
  console.log(`[NMS] Stream started: ${streamKey}`);
  try {
    await Stream.findOneAndUpdate(
      { streamKey },
      { isLive: true, startedAt: new Date() }
    );
    if (global.io) {
      global.io.to(`stream:${streamKey}`).emit("stream-started", { streamKey });
    }
    // Capture thumbnail after stream warm-up
    setTimeout(() => captureThumbnail(streamKey), 10_000);
  } catch (err) {
    console.error("[NMS] postPublish error:", err.message);
  }
});

nms.on("donePublish", async (id, streamPath) => {
  const streamKey = streamPath.split("/").pop();
  console.log(`[NMS] Stream ended: ${streamKey}`);
  try {
    // MP4 recording path set by NMS trans config
    const recordingUrl = `/media/live/${streamKey}/${streamKey}.mp4`;
    await Stream.findOneAndUpdate(
      { streamKey },
      { isLive: false, endedAt: new Date(), recordingUrl }
    );
    if (global.io) {
      global.io.to(`stream:${streamKey}`).emit("stream-ended", { streamKey });
    }
  } catch (err) {
    console.error("[NMS] donePublish error:", err.message);
  }
});

export { nms };
