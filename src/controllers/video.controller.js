import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"

const publishVideo = asyncHandler(async (req, res) => {
    try {
        const { title, description } = req.body;

        //view duration
        //check for the required fields.
        if (!title) {
            throw new ApiError(400, "Title is required.");
        }

        const owner = req?.user._id;

        //upload the video file.
        const videoLocalPath = req?.files?.videoFile?.[0]?.path;
        const thumbnailLocalPath = req?.files?.thumbnail?.[0]?.path;

        if (!videoLocalPath || !thumbnailLocalPath) {
            throw new ApiError(400, "Fields not uploaded correctly.");
        }

        const video = await uploadOnCloudinary(videoLocalPath);
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        const publishedVideo = await Video.create({
            title,
            description,
            videoFile: video.url,
            thumbnail: thumbnail.url,
            videoFilePublicId: video.public_id,
            thumbnailPublicId: thumbnail.public_id,
            duration: video.duration,
            owner
        });

        if (!publishedVideo) {
            throw new ApiError(500, "Failed to upload.");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    publishedVideo,
                    200,
                    "Video Published Successfully!"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message ||
                    "Something went wrong in publishing the video"
                )
            );
    }
});

const getChannelVideos = asyncHandler(async (req, res) => {
    try {
        const { username } = req.params;

        if (!username) {
            throw new ApiError(400, "Username missing...");
        }

        const user = await User.findOne({ username });

        if (!user) {
            throw new ApiError(404, "No User Found.");
        }

        const findChannelVideos = await Video.aggregate([
            {
                $match: {
                    owner: user._id
                }
            }
        ]);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    findChannelVideos,
                    200,
                    "Videos Fetched Successfully!"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message ||
                    "Something went wrong in Fetching the user videos"
                )
            );
    }
});

const getVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        if (!videoId) {
            throw new ApiError(404, "Video Id missing...");
        }

        const videoObjectId = new mongoose.Types.ObjectId(videoId);

        const video = await Video.aggregate(
            [
                {
                    $match: {
                        _id: videoObjectId
                    }
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "ownerOfVideoDetails"
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
                    $lookup: {
                        from: "subscriptions",
                        localField: "owner",
                        foreignField: "channel",
                        as: "ownerSubscribers"
                    }
                },
                {
                    $unwind: {
                        path: "$ownerOfVideoDetails",
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $addFields: {
                        likeCount: {
                            $size: "$likes"
                        },
                        isLiked: {
                            $in: [
                                "$$currentUserId",
                                {
                                    $map: {
                                        input: {
                                            $ifNull: ["$likes", []]
                                        },
                                        as: "like",
                                        in: "$$like.likedBy"
                                    }
                                }
                            ]
                        },
                        Owner: {
                            $mergeObjects: [
                                "$ownerOfVideoDetails",
                                {
                                    subscriberCount: {
                                        $size: "$ownerSubscribers"
                                    }
                                },
                                {
                                    isSubscribed: {
                                        $in: [
                                            "$$currentUserId",
                                            {
                                                $map: {
                                                    input: {
                                                        $ifNull: [
                                                            "$ownerSubscribers",
                                                            []
                                                        ]
                                                    },
                                                    as: "sub",
                                                    in: "$$sub.subscriber"
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        Owner: {
                            subscriberCount: 1,
                            isSubscribed: 1,
                            avatar: 1,
                            fullName: 1,
                            username: 1,
                            _id: 1
                        },
                        duration: 1,
                        title: 1,
                        views: 1,
                        description: 1,
                        videoFile: 1,
                        thumbnail: 1,
                        likeCount: 1,
                        isLiked: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                }
            ],
            { let: { currentUserId: req?.user?._id } }
        );

        if (!video?.length) {
            throw new ApiError(400, "Error in Getting Video.");
        }

        return res
            .status(200)
            .json(new ApiResponse(video[0], 200, "got Video Successfully"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    error,
                    error.statusCode || 500,
                    "Error Getting the Video"
                )
            );
    }
});

const getAllVideos = asyncHandler(async (req, res) => {
    try {
        const videos = await Video.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            {
                $unwind: {
                    path: "$ownerDetails",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $addFields: {
                    Owner: "$ownerDetails"
                }
            },
            {
                $project: {
                    Owner: 1,
                    duration: 1,
                    title: 1,
                    views: 1,
                    description: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        return res
            .status(200)
            .json(
                new ApiResponse(videos, 200, "All videos fetched successfully!")
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    "Error fetching all videos"
                )
            );
    }
});

const searchVideos = asyncHandler(async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query || query.trim() === '') {
            throw new ApiError(400, "Search query is required");
        }

        const searchRegex = new RegExp(query.trim(), 'i'); // Case-insensitive search

        const videos = await Video.aggregate([
            {
                $match: {
                    $or: [
                        { title: { $regex: searchRegex } },
                        { description: { $regex: searchRegex } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "ownerDetails"
                }
            },
            {
                $unwind: {
                    path: "$ownerDetails",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $addFields: {
                    Owner: "$ownerDetails"
                }
            },
            {
                $project: {
                    Owner: 1,
                    duration: 1,
                    title: 1,
                    views: 1,
                    description: 1,
                    videoFile: 1,
                    thumbnail: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            {
                $sort: { createdAt: -1 } // Sort by newest first
            }
        ]);

        return res
            .status(200)
            .json(
                new ApiResponse(videos, 200, `Found ${videos.length} videos matching "${query}"`)
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Error searching videos"
                )
            );
    }
});

const updateViewCount = asyncHandler(async (req, res) => {
    try {
        const { video_id } = req.params;
        if (!video_id) throw new ApiError(404, "Video not found.");

        const videoId = new mongoose.Types.ObjectId(video_id);

        const video = await Video.findByIdAndUpdate(
            videoId,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!video) {
            throw new ApiError(404, "Video not found.");
        }

        return res
            .status(200)
            .json(new ApiResponse(video, 200, "View count updated!"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    "Error updating view count"
                )
            );
    }
});

const updateVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;
        //check for if the video exists;
        const video = await Video.findById(videoId);
        if (!video) {
            throw new ApiError(404, "Video not found.");
        }

        const { title, description, thumbnail } = req.body;

        if (title) video.title = title;
        if (description) video.description = description;
        if (thumbnail) video.thumbnail = thumbnail;

        await video.save();

        return res
            .status(200)
            .json(new ApiResponse(video, 200, "Video updated successfully!"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    "Error updating video"
                )
            );
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params;

        if (!videoId) throw new ApiError(404, "Video Id missing...");

        const video = await Video.findByIdAndDelete(videoId);
        if (!video) throw new ApiError(404, "Video not found.");

        return res
            .status(200)
            .json(new ApiResponse(video, 200, "Video deleted successfully!"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    "Error deleting video"
                )
            );
    }
});

export {
    publishVideo,
    getChannelVideos,
    getVideo,
    getAllVideos,
    searchVideos,
    updateViewCount,
    deleteVideo,
    updateVideo
};