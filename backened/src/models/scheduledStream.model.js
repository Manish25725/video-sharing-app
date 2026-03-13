import mongoose, { Schema } from "mongoose";

const scheduledStreamSchema = new Schema(
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
    thumbnailUrl: {
      type: String,
      default: "",
    },
    streamerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    streamKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const ScheduledStream = mongoose.model("ScheduledStream", scheduledStreamSchema);
