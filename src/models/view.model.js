import mongoose from "mongoose";

const viewSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ipAddress: {
      type: String,
      required: false,
    },
    viewCount: {
      type: Number,
      default: 1,
    },
    lastViewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create compound indexes for better query performance
viewSchema.index({ video: 1, user: 1 }); // For logged-in user views
viewSchema.index({ video: 1, ipAddress: 1, createdAt: 1 }); // For anonymous views
viewSchema.index({ video: 1, createdAt: 1 }); // For general video view queries

export const View = mongoose.model("View", viewSchema);
