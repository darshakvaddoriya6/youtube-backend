import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    try {
        const channelId = req?.user?._id;

        if (!channelId) {
            throw new ApiError(400, "Channel ID is required");
        }
    
        const totalVideos = await Video.countDocuments({ owner: channelId });

        const viewsResult = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" }
                }
            }
        ]);
        const totalViews = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

        const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

        const totalLikes = await Like.countDocuments({
            video: { $in: await Video.find({ owner: channelId }).distinct("_id") }
        });

        const stats = {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        };

        return res
            .status(200)
            .json(
                new ApiResponse(
                    stats,
                    200,
                    "Channel stats fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong in fetching channel stats"
                )
            );
    }
})

const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        // Get userId from query params (for viewing other users' channels)
        // or use authenticated user (for dashboard/stats)
        const channelId = req.query.userId || req?.user?._id;

        if (!channelId) {
            throw new ApiError(400, "Channel ID is required");
        }

        const videos = await Video.aggregate([
            {
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "video",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likesCount: { $size: "$likes" }
                }
            },
            {
                $project: {
                    title: 1,
                    description: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    duration: 1,
                    views: 1,
                    isPublished: 1,
                    likesCount: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    videos,
                    200,
                    "Channel videos fetched successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong in fetching channel videos"
                )
            );
    }
})

export {
    getChannelStats,
    getChannelVideos
}