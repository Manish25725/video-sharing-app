import api from "./api.js";

const reportService = {
  reportVideo: (videoId, reason, description) =>
    api.post("/reports", { reportType: "video", videoId, reason, description }),

  reportComment: (commentId, reason, description) =>
    api.post("/reports", { reportType: "comment", commentId, reason, description }),

  // Admin
  getReports: (params = {}) => api.get("/reports", { params }),
  updateStatus: (id, status) => api.patch(`/reports/${id}/status`, { status }),
  deleteContent: (id) => api.delete(`/reports/${id}/content`),
};

export default reportService;
