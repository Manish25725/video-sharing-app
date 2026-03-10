import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema(
  {
    reportType: {
      type: String,
      enum: ["video", "comment"],
      required: true,
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      default: null,
    },
    commentId: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
    },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1 });

export const Report = mongoose.model("Report", reportSchema);
