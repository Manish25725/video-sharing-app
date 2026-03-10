import crypto from "crypto";
import mongoose from "mongoose";
import { Stream } from "../models/stream.model.js";
import { ScheduledStream } from "../models/scheduledStream.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
  const stream = await Stream.findOne({ streamerId: req.user._id })
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

  const scheduled = await ScheduledStream.create({
    title: title.trim(),
    description: description?.trim() || "",
    streamerId: req.user._id,
    scheduledAt: date,
  });

  const populated = await ScheduledStream.findById(scheduled._id)
    .populate("streamerId", "fullName userName avatar");

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
};
