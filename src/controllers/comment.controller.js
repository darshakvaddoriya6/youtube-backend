import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(400, "Invalid videoId");

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    const pipeline = [
        { $match: { video: new mongoose.Types.ObjectId(videoId) } },
        { $sort: { createdAt: -1 } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
            },
        },
        { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                areYouOwner: {
                    $eq: ["$owner._id", new mongoose.Types.ObjectId(req.user._id)],
                },
            },
        },
        {
            $project: {
                content: 1,
                video: 1,
                owner: { _id: 1, username: 1, avatar: 1 },
                createdAt: 1,
                updatedAt: 1,
                areYouOwner: 1,
            },
        },
    ];
    const result = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);
    res
        .status(200)
        .json(new ApiResponse(200, result, "Comments fetched successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const content = req.body?.content;
    const videoId = req.params?.videoId;
    if (!content || !videoId) {
        throw new ApiError(400, "Content and videoId are required");
    }
    const userId = req.user._id;
    if (!userId) throw new ApiError(401, "Unauthorized");
    if (!mongoose.Types.ObjectId.isValid(videoId))
        throw new ApiError(400, "Invalid videoId");

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId,
    });

    res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const content = req.body?.content;
    // console.log('this iscontent ',content,commentId);

    if (!content) throw new ApiError(400, "Content is required");
    if (!mongoose.Types.ObjectId.isValid(commentId))
        throw new ApiError(400, "Invalid commentId");

    const userId = req.user._id;
    if (!userId)
        throw new ApiError(401, "Unauthorized or Token has been expired");
    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");
    if (String(comment.owner) !== String(userId))
        throw new ApiError(403, "You are not allowed to update this comment");
    comment.content = content;
    await comment.save();
    res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successfully"));
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(commentId))
        throw new ApiError(400, "Invalid commentId");
    const userId = req.user._id;
    if (!userId)
        throw new ApiError(401, "Unauthorized or Token has been expired");

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(404, "Comment not found");

    if (String(comment.owner) !== String(userId))
        throw new ApiError(403, "You are not allowed to delete this comment");

    await comment.deleteOne();
    res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}