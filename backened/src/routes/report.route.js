import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  submitReport,
  getReports,
  updateReportStatus,
  deleteReportedContent,
} from "../controllers/report.controller.js";

const router = Router();

// Any logged-in user can submit a report
router.route("/").post(verifyJWT, submitReport);

// Admin routes (verifyJWT — extend with an admin-check middleware when needed)
router.route("/").get(verifyJWT, getReports);
router.route("/:id/status").patch(verifyJWT, updateReportStatus);
router.route("/:id/content").delete(verifyJWT, deleteReportedContent);

export default router;
