import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const currentUserId = req?.user?._id;

        const comments = await Comment.find({ video: videoId })
            .populate("owner", "username avatar fullName")
            .sort({ createdAt: -1 });

        // Get like information for each comment
        const { Like } = await import("../models/like.model.js");
        
        const commentsWithLikes = await Promise.all(
            comments.map(async (comment) => {
                // Get total likes count for this comment
                const likesCount = await Like.countDocuments({ comment: comment._id });
                
                // Check if current user has liked this comment
                let isLiked = false;
                if (currentUserId) {
                    const userLike = await Like.findOne({ 
                        comment: comment._id, 
                        likedBy: currentUserId 
                    });
                    isLiked = !!userLike;
                }

                return {
                    ...comment.toObject(),
                    likesCount,
                    isLiked
                };
            })
        );

        return res.status(200).json(new ApiResponse(200, commentsWithLikes, "Success"));
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    500,
                    null,
                    error.message ||
                        "Something went wrong in getting video comments"
                )
            );
    }
});

const addComment = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const { content } = req.body;
        const user = req?.user._id;

        console.log('Adding comment:', { videoId, content, userId: user });

        if (!content || !videoId)
            throw new ApiError(400, "Content and Video ID are required");

        if (!user)
            throw new ApiError(401, "User authentication required");

        const newComment = await Comment.create({
            owner: user,
            content,
            video: videoId
        });

        await newComment.populate("owner", "username avatar fullName");

        console.log('Comment created successfully:', newComment);

        return res
            .status(201)
            .json(
                new ApiResponse(201, newComment, "Comment added successfully")
            );
    } catch (error) {
        console.error('Error adding comment:', error);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    error.statusCode || 500,
                    null,
                    error.message || "Something went wrong in adding comment"
                )
            );
    }
});

const updateComment = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;

        if (!content || !commentId)
            throw new ApiError(400, "Content and Comment ID are required");

        const updatedComment = await Comment.findOneAndUpdate(
            { _id: commentId },
            { content },
            { new: true }
        );

        if (!updatedComment) {
            throw new ApiError(404, "Comment not found or not authorized");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedComment,
                    "Comment updated successfully"
                )
            );
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    error.statusCode || 500,
                    null,
                    error.message || "Something went wrong in updating comment"
                )
            );
    }
});

const deleteComment = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params;

        const deletedComment = await Comment.findOneAndDelete({
            _id: commentId
        });

        if (!deletedComment) {
            throw new ApiError(404, "Comment not found or not authorized");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    deletedComment,
                    "Comment deleted successfully"
                )
            );
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    error.statusCode || 500,
                    null,
                    error.message || "Something went wrong in deleting comment"
                )
            );
    }
});

export { getVideoComments, addComment, updateComment, deleteComment };