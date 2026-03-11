import { Router } from "express";
import { verifyJWT, optionalAuth } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { imageFilter } from "../middlewares/imageFilter.middleware.js";
import {
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
} from "../controllers/stream.controller.js";

const router = Router();

// ── Public routes (specific paths before parameterized) ────────
router.route("/live").get(getLiveStreams);
router.route("/recorded").get(getRecordedStreams);
router.route("/scheduled").get(getScheduledStreams);

// ── Protected routes ───────────────────────────────────────────
router.route("/go-live").post(verifyJWT, upload.single("thumbnail"), imageFilter, goLive);
router.route("/my-stream").get(verifyJWT, getMyStream);
router.route("/schedule").post(verifyJWT, upload.single("thumbnail"), imageFilter, scheduleStream);
router.route("/schedule/:id/cancel").patch(verifyJWT, cancelScheduledStream);

// ── Parameterized routes (must be AFTER specific ones) ─────────
router.route("/:streamKey").get(optionalAuth, getStreamByKey);
router.route("/:streamKey/end").patch(verifyJWT, endStream);
router.route("/:streamKey/messages").get(getStreamMessages);
router.route("/:streamKey/save-recording").post(verifyJWT, saveStreamAsVideo);
router.route("/:streamKey/chat-replay").get(getChatReplay);

export default router;
