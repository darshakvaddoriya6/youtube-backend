import { model, Schema, Types } from "mongoose";
import { timezoneTransform } from "../helpers/timezoneTransform.js";

const likeSchema = new Schema(
    {
        owner: {
            type: Types.ObjectId,
            ref: "User",
        },
        comment: {
            type: Types.ObjectId,
            ref: "Comment"
        },
        video: {
            type: Types.ObjectId,
            ref: "Video"
        },
        likedBy: {
            type: Types.ObjectId,
            ref: "User",
            required: true
        },
        tweets: {
            type: Types.ObjectId,
            ref: "Tweet"
        }
    },
    {
        timestamps: true
    }
);


likeSchema.set("toJSON", {
  transform: timezoneTransform,
});

export const Like = model("Like", likeSchema);