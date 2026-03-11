import { Feedback } from "../models/feedback.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ─── Submit Feedback ─────────────────────────────────────── */
const submitFeedback = asyncHandler(async (req, res) => {
  const { category, message, email } = req.body;

  if (!category || !message?.trim()) {
    throw new ApiError(400, "Category and message are required");
  }

  const validCategories = ["bug", "feature", "content", "account", "general"];
  if (!validCategories.includes(category)) {
    throw new ApiError(400, "Invalid category");
  }

  if (message.trim().length < 10) {
    throw new ApiError(400, "Message must be at least 10 characters");
  }

  const feedback = await Feedback.create({
    user: req.user._id,
    category,
    message: message.trim(),
    email: email?.trim() || "",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, feedback, "Feedback submitted successfully. Thank you!"));
});

/* ─── Get My Feedback ─────────────────────────────────────── */
const getMyFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await Feedback.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select("category message status createdAt");

  return res
    .status(200)
    .json(new ApiResponse(200, feedbacks, "Feedback fetched successfully"));
});

/* ─── Get All Feedback (Admin) ────────────────────────────── */
const getAllFeedback = asyncHandler(async (req, res) => {
  const { category, status, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (category && category !== "all") filter.category = category;
  if (status && status !== "all") filter.status = status;

  const [feedbacks, total] = await Promise.all([
    Feedback.find(filter)
      .populate("user", "userName fullName avatar email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Feedback.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { feedbacks, total, page: parseInt(page), limit: parseInt(limit) },
      "All feedback fetched")
  );
});

/* ─── Update Feedback Status (Admin) ─────────────────────── */
const updateFeedbackStatus = asyncHandler(async (req, res) => {
  const { feedbackId } = req.params;
  const { status } = req.body;

  if (!["pending", "reviewed", "resolved"].includes(status)) {
    throw new ApiError(400, "Invalid status");
  }

  const feedback = await Feedback.findByIdAndUpdate(
    feedbackId,
    { $set: { status } },
    { new: true }
  );

  if (!feedback) throw new ApiError(404, "Feedback not found");

  return res.status(200).json(new ApiResponse(200, feedback, "Status updated"));
});

export { submitFeedback, getMyFeedback, getAllFeedback, updateFeedbackStatus };
