import mongoose, { Schema } from "mongoose";
import { timezoneTransform } from "../helpers/timezoneTransform.js";

const tweetSchema = new Schema(
    {
        content: {
            type: String,
            required: true
        },
        channel: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

tweetSchema.set("toJSON", {
  transform: timezoneTransform,
});

export const Tweet = mongoose.model("Tweet", tweetSchema);