import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    streamId: {
      type: Schema.Types.ObjectId,
      ref: "Stream",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    username: {
      type: String,
      required: true,
      maxlength: 60,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
