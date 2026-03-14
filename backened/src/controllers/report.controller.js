import mongoose from "mongoose";
import { Report } from "../models/report.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ─── Submit Report ────────────────────────────────────────── */
const submitReport = asyncHandler(async (req, res) => {
  const { reportType, videoId, commentId, reason, description } = req.body;

  if (!reportType || !reason?.trim()) {
    throw new ApiError(400, "Report type and reason are required");
  }

  if (!["video", "comment"].includes(reportType)) {
    throw new ApiError(400, "Invalid report type");
  }

  if (reportType === "video" && !videoId) {
    throw new ApiError(400, "videoId is required for video reports");
  }

  if (reportType === "comment" && !commentId) {
    throw new ApiError(400, "commentId is required for comment reports");
  }

  // Prevent duplicate reports from the same user for the same content
  const existing = await Report.findOne({
    reportedBy: req.user._id,
    ...(reportType === "video" ? { videoId } : { commentId }),
  });

  if (existing) {
    throw new ApiError(409, "You have already reported this content");
  }

  const report = await Report.create({
    reportType,
    videoId: reportType === "video" ? videoId : null,
    commentId: reportType === "comment" ? commentId : null,
    reportedBy: req.user._id,
    reason: reason.trim(),
    description: description?.trim() || "",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, report, "Report submitted successfully"));
});

/* ─── Get All Reports (Admin) ──────────────────────────────── */
const getReports = asyncHandler(async (req, res) => {
  const { status, reportType, page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (status && status !== "all") filter.status = status;
  if (reportType && reportType !== "all") filter.reportType = reportType;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("reportedBy", "fullName userName avatar")
      .populate("videoId", "title thumbnail owner")
      .populate({
        path: "commentId",
        select: "content owner",
        populate: { path: "owner", select: "fullName userName" },
      })
      .lean(),
    Report.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reports,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      "Reports fetched"
    )
  );
});

/* ─── Update Report Status (Admin) ────────────────────────── */
const updateReportStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid report ID");

  if (!["pending", "reviewed", "resolved"].includes(status)) {
    throw new ApiError(400, "Invalid status value");
  }

  const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
  if (!report) throw new ApiError(404, "Report not found");

  return res.status(200).json(new ApiResponse(200, report, "Report status updated"));
});

/* ─── Delete Reported Content (Admin) ─────────────────────── */
const deleteReportedContent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid report ID");

  const report = await Report.findById(id);
  if (!report) throw new ApiError(404, "Report not found");

  if (report.reportType === "video" && report.videoId) {
    await Video.findByIdAndDelete(report.videoId);
  } else if (report.reportType === "comment" && report.commentId) {
    await Comment.findByIdAndDelete(report.commentId);
  }

  report.status = "resolved";
  await report.save();

  return res
    .status(200)
    .json(new ApiResponse(200, report, "Content removed and report resolved"));
});

/* ─── Ban User from Report (Admin) ─────────────────────── */
const banUserFromReport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid report ID");

  const report = await Report.findById(id).populate("videoId").populate("commentId");
  if (!report) throw new ApiError(404, "Report not found");

  let ownerId = null;

  if (report.reportType === "video" && report.videoId) {
    ownerId = report.videoId.owner;
  } else if (report.reportType === "comment" && report.commentId) {
    ownerId = report.commentId.owner;
  }

  if (!ownerId) {
    throw new ApiError(404, "Original content owner not found (content may have been deleted)");
  }

  const userToBan = await User.findById(ownerId);
  if (!userToBan) throw new ApiError(404, "User not found");

  userToBan.status = "Banned";
  await userToBan.save({ validateModifiedOnly: true });

  report.status = "resolved";
  await report.save();

  return res.status(200).json(
    new ApiResponse(200, { user: userToBan, report }, "User banned successfully")
  );
});

export { submitReport, getReports, updateReportStatus, deleteReportedContent, banUserFromReport };
