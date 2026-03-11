import { Router } from "express";
import {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
  updateFeedbackStatus,
} from "../controllers/feedback.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// User routes (requires login)
router.route("/submit").post(verifyJWT, submitFeedback);
router.route("/my").get(verifyJWT, getMyFeedback);

// Admin routes
router.route("/all").get(verifyJWT, getAllFeedback);
router.route("/:feedbackId/status").patch(verifyJWT, updateFeedbackStatus);

export default router;
