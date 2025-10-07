import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { timezoneTransform } from "../helpers/timezoneTransform.js";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudinary URL
      required: true,
    },
    thumbnail: {
      type: String, // cloudinary URL
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    videoFilePublicId: {
      type: String,
      required: true,
    },
    thumbnailPublicId: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

videoSchema.set("toJSON", {
  transform: timezoneTransform,
});

videoSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

videoSchema.methods.validateUser = function (userId) {
  return this.owner && this.owner.toString() === userId.toString();
};

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
