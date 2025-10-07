import mongoose, { Schema } from "mongoose";
import { timezoneTransform } from "../helpers/timezoneTransform.js";

const subscriptionSchema = new Schema({
    subscriber: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true })

subscriptionSchema.set("toJSON", {
  transform: timezoneTransform,
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema)