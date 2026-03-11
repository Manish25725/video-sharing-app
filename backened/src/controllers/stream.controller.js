import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import { Stream } from "../models/stream.model.js";
import { ScheduledStream } from "../models/scheduledStream.model.js";
import { Message } from "../models/message.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { notifyStreamScheduled } from "./notification.controller.js";
import { muteUserInStream, unmuteUserInStream } from "../live/moderation.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Recordings are written by FFmpeg to: backened/public/media/recordings/<streamKey>.mp4
const recordingsRoot = path.join(__dirname, "../../public/media/recordings");

const RTMP_HOST = process.env.RTMP_HOST || "localhost";
const HLS_HOST = process.env.HLS_HOST || "localhost";
// HLS is now served by the Express API server, not NMS
const HLS_PORT = process.env.PORT || 8000;

const generateStreamKey = (userId) => {
  const random = crypto.randomBytes(8).toString("hex");
  return `${userId}_${random}`;
};

const hlsUrl = (key) => `http://${HLS_HOST}:${HLS_PORT}/live/${key}/index.m3u8`;
const rtmpUrl = () => `rtmp://${RTMP_HOST}/live`;

/* ─── Go Live ─────────────────────────────────────────────── */
const goLive = asyncHandler(async (req, res) => {
  const { title, description, category } = req.body;
  if (!title?.trim()) throw new ApiError(400, "Stream title is required");

  // If already live, return existing stream
  const existing = await Stream.findOne({ streamerId: req.user._id, isLive: true });
  if (existing) {
    return res.status(200).json(
      new ApiResponse(200, {
        stream: existing,
        rtmpUrl: rtmpUrl(),
        hlsUrl: hlsUrl(existing.streamKey),
        streamKey: existing.streamKey,
      }, "You are already live")
    );
  }

  // Clean up any stale/orphaned streams (key generated but OBS never connected)
  await Stream.updateMany(
    { streamerId: req.user._id, isLive: false, endedAt: { $exists: false } },
    { $set: { endedAt: new Date() } }
  );

  // Upload thumbnail if provided
  let thumbnailUrl = "";
  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded?.url) thumbnailUrl = uploaded.url;
  }

  const streamKey = generateStreamKey(String(req.user._id));
  const stream = await Stream.create({
    title: title.trim(),
    description: description?.trim() || "",
    category: category?.trim() || "",
    thumbnailUrl,
    streamKey,
    streamerId: req.user._id,
    isLive: false,
  });

  return res.status(201).json(
    new ApiResponse(201, {
      stream,
      rtmpUrl: rtmpUrl(),
      hlsUrl: hlsUrl(streamKey),
      streamKey,
    }, "Stream created. Configure OBS with the provided details.")
  );
});

/* ─── End Stream ──────────────────────────────────────────── */
const endStream = asyncHandler(async (req, res) => {
  const { streamKey } = req.params;
  const stream = await Stream.findOne({ streamKey, streamerId: req.user._id });
  if (!stream) throw new ApiError(404, "Stream not found");

  stream.isLive = false;
  stream.endedAt = new Date();
  await stream.save();

  if (global.io) {
    global.io.to(`stream:${streamKey}`).emit("stream-ended", { streamKey });
  }

  return res.status(200).json(new ApiResponse(200, stream, "Stream ended successfully"));
});

/* ─── Get All Live Streams ────────────────────────────────── */
const getLiveStreams = asyncHandler(async (req, res) => {
  const streams = await Stream.find({ isLive: true })
    .populate("streamerId", "fullName userName avatar")
    .sort({ viewerCount: -1 })
    .lean();

  const enriched = streams.map((s) => ({ ...s, hlsUrl: hlsUrl(s.streamKey) }));
  return res.status(200).json(new ApiResponse(200, enriched, "Live streams fetched"));
});

/* ─── Get Stream By Key ───────────────────────────────────── */
const getStreamByKey = asyncHandler(async (req, res) => {
  const { streamKey } = req.params;
  const stream = await Stream.findOne({ streamKey })
    .populate("streamerId", "fullName userName avatar")
    .lean();
  if (!stream) throw new ApiError(404, "Stream not found");

  return res.status(200).json(
    new ApiResponse(200, { stream, hlsUrl: hlsUrl(streamKey) }, "Stream fetched")
  );
});

/* ─── Get My Stream ───────────────────────────────────────── */
const getMyStream = asyncHandler(async (req, res) => {
  // Only return a stream where OBS is actually connected and streaming.
  // Never rehydrate a stale/offline stream — that causes the OBS config
  // screen to appear without the user having started anything.
  const stream = await Stream.findOne({
    streamerId: req.user._id,
    isLive: true,
  })
    .sort({ createdAt: -1 })
    .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      stream: stream || null,
      rtmpUrl: rtmpUrl(),
      hlsUrl: stream ? hlsUrl(stream.streamKey) : null,
      streamKey: stream?.streamKey || null,
    }, "Stream info fetched")
  );
});

/* ─── Schedule Stream ─────────────────────────────────────── */
const scheduleStream = asyncHandler(async (req, res) => {
  const { title, description, scheduledAt } = req.body;
  if (!title?.trim() || !scheduledAt) {
    throw new ApiError(400, "Title and scheduled time are required");
  }

  const date = new Date(scheduledAt);
  if (isNaN(date.getTime())) throw new ApiError(400, "Invalid date format");
  // Allow 60 s of clock skew between browser and server
  if (date < new Date(Date.now() - 60_000)) throw new ApiError(400, "Scheduled time must be in the future");

  // Upload thumbnail if provided
  let thumbnailUrl = "";
  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded?.url) thumbnailUrl = uploaded.url;
  }

  const scheduled = await ScheduledStream.create({
    title: title.trim(),
    description: description?.trim() || "",
    thumbnailUrl,
    streamerId: req.user._id,
    scheduledAt: date,
  });

  const populated = await ScheduledStream.findById(scheduled._id)
    .populate("streamerId", "fullName userName avatar");

  // Notify all subscribers (fire-and-forget — don't block the response)
  notifyStreamScheduled(req.user._id, scheduled.title, scheduled._id).catch(() => {});

  return res.status(201).json(new ApiResponse(201, populated, "Stream scheduled"));
});

/* ─── Get Scheduled Streams ───────────────────────────────── */
const getScheduledStreams = asyncHandler(async (req, res) => {
  const streams = await ScheduledStream.find({
    scheduledAt: { $gte: new Date() },
    isCancelled: false,
  })
    .populate("streamerId", "fullName userName avatar")
    .sort({ scheduledAt: 1 });

  return res.status(200).json(new ApiResponse(200, streams, "Scheduled streams fetched"));
});

/* ─── Cancel Scheduled Stream ─────────────────────────────── */
const cancelScheduledStream = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid ID");

  const scheduled = await ScheduledStream.findOne({ _id: id, streamerId: req.user._id });
  if (!scheduled) throw new ApiError(404, "Scheduled stream not found");

  scheduled.isCancelled = true;
  await scheduled.save();

  return res.status(200).json(new ApiResponse(200, scheduled, "Scheduled stream cancelled"));
});

/* ─── Get Stream Chat Messages ────────────────────────────── */
const getStreamMessages = asyncHandler(async (req, res) => {
  const { streamKey } = req.params;
  const stream = await Stream.findOne({ streamKey });
  if (!stream) throw new ApiError(404, "Stream not found");

  const messages = await Message.find({ streamId: stream._id })
    .sort({ createdAt: 1 })
    .limit(100)
    .lean();

  return res.status(200).json(new ApiResponse(200, messages, "Messages fetched"));
});

/* ─── Get Recorded Streams ────────────────────────────────── */
const getRecordedStreams = asyncHandler(async (req, res) => {
  const streams = await Stream.find({ recordingUrl: { $ne: "" }, isLive: false })
    .populate("streamerId", "fullName userName avatar")
    .sort({ endedAt: -1 })
    .lean();

  return res.status(200).json(new ApiResponse(200, streams, "Recorded streams fetched"));
});
/* ─── Save Stream as Video (VOD) ─────────────────────────── */
const saveStreamAsVideo = asyncHandler(async (req, res) => {
  const { streamKey } = req.params;

  const stream = await Stream.findOne({ streamKey, streamerId: req.user._id });
  if (!stream) throw new ApiError(404, "Stream not found or not yours");

  // Already saved — return existing videoId
  if (stream.savedVideoId) {
    return res.status(200).json(
      new ApiResponse(200, { videoId: stream.savedVideoId }, "Recording already saved")
    );
  }

  const recPath = path.join(recordingsRoot, `${streamKey}.mp4`);
  if (!fs.existsSync(recPath)) {
    throw new ApiError(
      404,
      "Recording file not found. The stream may not have been recorded, or FFmpeg was unavailable."
    );
  }

  // Upload to Cloudinary — uploadOnCloudinary deletes the local file on success
  const uploaded = await uploadOnCloudinary(recPath);
  if (!uploaded?.url) throw new ApiError(500, "Failed to upload recording to cloud storage");

  // Thumbnail: use stream thumbnail if available, else derive from Cloudinary video URL
  const thumbnailUrl =
    stream.thumbnailUrl ||
    uploaded.url.replace("/upload/", "/upload/so_0/").replace(/\.[^.]+$/, ".jpg");

  const video = await Video.create({
    videoFile: uploaded.url,
    thumbnail: thumbnailUrl,
    title: stream.title,
    description: stream.description || "",
    duration: uploaded.duration || 0,
    views: 0,
    isPublished: true,
    videoType: "livestream",
    owner: stream.streamerId,
    streamKey, // links the video back to the stream for chat replay
  });

  stream.savedVideoId = video._id;
  await stream.save();

  return res.status(201).json(
    new ApiResponse(201, { video, videoId: video._id }, "Stream saved as video successfully")
  );
});

/* ─── Chat Replay for VOD ────────────────────────────────── */
// Returns all chat messages for a stream with offsetSeconds calculated
// from stream.startedAt — used by VideoPlayer to sync chat to playback time
const getChatReplay = asyncHandler(async (req, res) => {
  const { streamKey } = req.params;

  const stream = await Stream.findOne({ streamKey }).lean();
  if (!stream) throw new ApiError(404, "Stream not found");

  const messages = await Message.find({ streamId: stream._id })
    .populate("userId", "userName fullName avatar")
    .sort({ createdAt: 1 })
    .lean();

  const startTime = stream.startedAt ? new Date(stream.startedAt).getTime() : null;

  const replay = messages.map((msg) => ({
    _id: msg._id,
    username: msg.username,
    message: msg.message,
    userId: msg.userId,
    createdAt: msg.createdAt,
    // offsetSeconds = how many seconds after stream start this message appeared
    offsetSeconds: startTime
      ? Math.max(0, (new Date(msg.createdAt).getTime() - startTime) / 1000)
      : null,
  }));

  return res.status(200).json(new ApiResponse(200, replay, "Chat replay fetched"));
});
/* ─── Mute / Unmute User in Stream ─────────────────────────── */
// Only the active streamer (owner) can mute or unmute participants.
const muteUser = asyncHandler(async (req, res) => {
  const { streamKey, userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

  const stream = await Stream.findOne({ streamKey, streamerId: req.user._id, isLive: true });
  if (!stream) throw new ApiError(403, "Only the active streamer can mute users");

  await muteUserInStream(streamKey, userId);

  // Notify every socket in the room so the muted user's UI updates instantly
  if (global.io) {
    global.io.to(`stream:${streamKey}`).emit("user-muted", { userId, streamKey });
  }

  return res.status(200).json(new ApiResponse(200, {}, "User muted"));
});

const unmuteUser = asyncHandler(async (req, res) => {
  const { streamKey, userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");

  const stream = await Stream.findOne({ streamKey, streamerId: req.user._id, isLive: true });
  if (!stream) throw new ApiError(403, "Only the active streamer can unmute users");

  await unmuteUserInStream(streamKey, userId);

  if (global.io) {
    global.io.to(`stream:${streamKey}`).emit("user-unmuted", { userId, streamKey });
  }

  return res.status(200).json(new ApiResponse(200, {}, "User unmuted"));
});

export {
  goLive,
  endStream,
  getLiveStreams,
  getStreamByKey,
  getMyStream,
  scheduleStream,
  getScheduledStreams,
  cancelScheduledStream,
  getStreamMessages,
  getRecordedStreams,
  saveStreamAsVideo,
  getChatReplay,
  muteUser,
  unmuteUser,
};
