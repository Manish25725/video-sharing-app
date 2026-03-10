import api from "./api.js";

const NMS_HTTP_URL = import.meta.env.VITE_NMS_HTTP_URL || "http://localhost:8001";

export const getHlsUrl = (streamKey) =>
  `${NMS_HTTP_URL}/live/${streamKey}/index.m3u8`;

const streamService = {
  // Streaming
  goLive: (formData) => api.uploadFile("/streams/go-live", formData),
  endStream: (streamKey) => api.patch(`/streams/${streamKey}/end`),
  getMyStream: () => api.get("/streams/my-stream"),

  // Discovery
  getLiveStreams: () => api.get("/streams/live"),
  getStreamByKey: (streamKey) => api.get(`/streams/${streamKey}`),
  getRecordedStreams: () => api.get("/streams/recorded"),

  // Chat history
  getStreamMessages: (streamKey) => api.get(`/streams/${streamKey}/messages`),

  // Scheduling
  scheduleStream: (data) => api.post("/streams/schedule", data),
  getScheduledStreams: () => api.get("/streams/scheduled"),
  cancelScheduledStream: (id) => api.patch(`/streams/schedule/${id}/cancel`),
};

export default streamService;
