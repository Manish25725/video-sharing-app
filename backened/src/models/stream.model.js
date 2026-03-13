import mongoose, { Schema } from "mongoose";

const streamSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    category: {
      type: String,
      default: "",
      trim: true,
    },
    streamKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    streamerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isLive: {
      type: Boolean,
      default: false,
      index: true,
    },
    viewerCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isScheduled: {
      type: Boolean,
      default: false,
    },
    autoSave: {
      type: Boolean,
      default: false,
    },
    scheduledAt: {
      type: Date,
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    recordingUrl: {
      type: String,
      default: "",
    },
    startedAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    savedVideoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },
  },
  { timestamps: true }
);

export const Stream = mongoose.model("Stream", streamSchema);
