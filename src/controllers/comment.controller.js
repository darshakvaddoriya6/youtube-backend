import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        const currentUserId = req?.user?._id;

        // Get only parent comments (not replies)
        const comments = await Comment.find({
            video: videoId,
            parentComment: null
        })
            .populate("owner", "username avatar fullName")
            .populate({
                path: "replies",
                populate: {
                    path: "owner",
                    select: "username avatar fullName"
                }
            })
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

                // Process replies with like information
                const repliesWithLikes = await Promise.all(
                    comment.replies.map(async (reply) => {
                        const replyLikesCount = await Like.countDocuments({ comment: reply._id });
                        let replyIsLiked = false;
                        if (currentUserId) {
                            const userReplyLike = await Like.findOne({
                                comment: reply._id,
                                likedBy: currentUserId
                            });
                            replyIsLiked = !!userReplyLike;
                        }

                        return {
                            ...reply.toObject(),
                            likesCount: replyLikesCount,
                            isLiked: replyIsLiked
                        };
                    })
                );

                return {
                    ...comment.toObject(),
                    likesCount,
                    isLiked,
                    replies: repliesWithLikes
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

        // Don't emit socket event here - let the frontend handle it
        // The frontend will add the comment locally and emit to other users


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

const addReply = asyncHandler(async (req, res) => {
    try {
        const { commentId } = req.params;
        const { content } = req.body;
        const user = req?.user._id;


        if (!content || !commentId)
            throw new ApiError(400, "Content and Comment ID are required");

        if (!user)
            throw new ApiError(401, "User authentication required");

        // Check if parent comment exists
        const parentComment = await Comment.findById(commentId);
        if (!parentComment) {
            throw new ApiError(404, "Parent comment not found");
        }

        // Create the reply
        const newReply = await Comment.create({
            owner: user,
            content,
            video: parentComment.video,
            parentComment: commentId
        });

        await newReply.populate("owner", "username avatar fullName");

        // Add reply to parent comment's replies array
        await Comment.findByIdAndUpdate(
            commentId,
            { $push: { replies: newReply._id } }
        );

        // Don't emit socket event here - let the frontend handle it


        return res
            .status(201)
            .json(
                new ApiResponse(201, newReply, "Reply added successfully")
            );
    } catch (error) {
        console.error('Error adding reply:', error);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    error.statusCode || 500,
                    null,
                    error.message || "Something went wrong in adding reply"
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
        ).populate('video', '_id');

        if (!updatedComment) {
            throw new ApiError(404, "Comment not found or not authorized");
        }

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io && updatedComment.video) {
            io.to(`video-${updatedComment.video._id}`).emit('comment-updated', {
                commentId: updatedComment._id,
                content: updatedComment.content
            });
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
        const userId = req?.user?._id;


        if (!userId) {
            throw new ApiError(401, "User authentication required");
        }

        // First find the comment to check ownership
        const comment = await Comment.findById(commentId).populate('video', '_id');

        if (!comment) {
            throw new ApiError(404, "Comment not found");
        }


        // Check if the user is the owner of the comment
        if (comment.owner.toString() !== userId.toString()) {
            throw new ApiError(403, "You can only delete your own comments");
        }

        const videoId = comment.video._id;

        // If it's a parent comment, also delete all its replies
        if (!comment.parentComment) {
            const deletedReplies = await Comment.deleteMany({ parentComment: commentId });
        } else {
            // If it's a reply, remove it from parent's replies array
            await Comment.findByIdAndUpdate(
                comment.parentComment,
                { $pull: { replies: commentId } }
            );
        }

        // Delete the comment
        const deletedComment = await Comment.findByIdAndDelete(commentId);

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.to(`video-${videoId}`).emit('comment-removed', {
                commentId: commentId
            });
        } else {
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
        console.error('Delete comment error:', error);
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    error.statusCode || 500,
                    null,
                    error.message || "Something went wrong in deleting comment"
                )
            );
    }
});

export { getVideoComments, addComment, addReply, updateComment, deleteComment };