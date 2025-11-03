import mongoose, { Schema } from "mongoose";
import { timezoneTransform } from "../helpers/timezoneTransform.js";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      reqired: true,
    },
    description: {
      type: String,
      reqired: true,
    },
    thumbnail: {
      type: String, // cloudinary URL
      required: true,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

playlistSchema.set("toJSON", {
  transform: timezoneTransform,
});

export const Playlist = mongoose.model("Playlist", playlistSchema);
