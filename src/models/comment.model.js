import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { timezoneTransform } from "../helpers/timezoneTransform.js";

const commentSchema = new Schema(
    {
        content: {
            type: String,
        },
        video: {
            type: Schema.Types.ObjectId,
            ref: "Video"
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
            default: null
        },
        replies: [{
            type: Schema.Types.ObjectId,
            ref: "Comment"
        }]
    },
    {
        timestamps: true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)

commentSchema.set("toJSON", {
  transform: timezoneTransform,
});

export const Comment = mongoose.model("Comment", commentSchema)