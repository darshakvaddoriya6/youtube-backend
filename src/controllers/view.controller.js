import { View } from "../models/view.model.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @desc    Add a view for a video
// @route   POST /api/v1/view/v/:videoId
// @access  Public
// @rules   - Logged-in users: 1 view per video, re-views allowed every 5 minutes
//          - Anonymous users: 1 view per IP per video every 5 minutes
//          - Users cannot view their own videos
const addView = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id || null;
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;


    // Check if video exists
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Prevent users from viewing their own videos (optional)
    if (userId && video.owner.toString() === userId.toString()) {
        return res.status(200).json(
            new ApiResponse(200, {
                totalViews: video.views
            }, "Own video view not counted")
        );
    }

    let existingView = null;
    let shouldCountView = false;

    if (userId) {
        // For logged-in users: Check if they've ever viewed this video
        existingView = await View.findOne({
            video: videoId,
            user: userId
        });

        if (!existingView) {
            // First time viewing - always count
            shouldCountView = true;
        } else {
            // User has viewed before - implement re-view logic
            const timeSinceLastView = Date.now() - existingView.createdAt.getTime();
            const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes

            // Allow one additional view every 5 minutes for testing
            if (timeSinceLastView >= fiveMinutesInMs) {
                shouldCountView = true;
            } else {
                const remainingTime = Math.ceil((fiveMinutesInMs - timeSinceLastView) / (60 * 1000));
            }
        }
    } else {
        // For anonymous users: Check by IP address within the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        existingView = await View.findOne({
            video: videoId,
            ipAddress: ipAddress,
            user: null, // Ensure it's an anonymous view
            createdAt: { $gte: fiveMinutesAgo }
        });

        if (!existingView) {
            shouldCountView = true;
        } else {
            const timeSinceLastView = Date.now() - existingView.createdAt.getTime();
            const remainingTime = Math.ceil((5 * 60 * 1000 - timeSinceLastView) / (60 * 1000));
        }
    }

    if (shouldCountView) {
        // Create new view record or update existing one
        if (existingView && userId) {
            // Update existing view record for logged-in users (for re-views)
            existingView.createdAt = new Date();
            await existingView.save();
        } else {
            // Create new view record
            existingView = await View.create({
                video: videoId,
                user: userId,
                ipAddress: ipAddress
            });
        }

        // Increment video views using the model method
        await video.incrementViews();


        return res.status(201).json(
            new ApiResponse(201, {
                view: existingView,
                totalViews: video.views,
                isNewView: true
            }, "View added successfully")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, {
            totalViews: video.views,
            isNewView: false
        }, "View already counted")
    );
});

// @desc    Get total views for a video
// @route   GET /api/v1/view/v/:videoId
// @access  Public
const getVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Get video with current view count
    const video = await Video.findById(videoId).select('views title');
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Also get detailed view count from View collection for accuracy
    const detailedViewCount = await View.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(200, {
            videoId,
            title: video.title,
            views: video.views,
            detailedViews: detailedViewCount
        }, "Video views retrieved successfully")
    );
});
// @desc    Debug endpoint to check video views
// @route   GET /api/v1/view/debug/:videoId
// @access  Public
const debugVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Get video with current view count
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Get all view records for this video
    const viewRecords = await View.find({ video: videoId }).populate('user', 'username fullName');
    const viewCount = await View.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(200, {
            videoId,
            title: video.title,
            videoViewsField: video.views,
            viewRecordsCount: viewCount,
            viewRecords: viewRecords.map(v => ({
                _id: v._id,
                user: v.user ? { username: v.user.username, fullName: v.user.fullName } : null,
                ipAddress: v.ipAddress,
                createdAt: v.createdAt
            }))
        }, "Debug info retrieved successfully")
    );
});

// @desc    Sync video view counts with view records
// @route   POST /api/v1/view/sync/:videoId
// @access  Public (for debugging)
const syncVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Get video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Count unique views
    const uniqueUserViews = await View.countDocuments({
        video: videoId,
        user: { $ne: null }
    });

    const uniqueAnonViews = await View.countDocuments({
        video: videoId,
        user: null
    });

    const totalUniqueViews = uniqueUserViews + uniqueAnonViews;

    // Update video view count
    video.views = totalUniqueViews;
    await video.save();


    return res.status(200).json(
        new ApiResponse(200, {
            videoId,
            title: video.title,
            oldViewCount: video.views,
            newViewCount: totalUniqueViews,
            uniqueUserViews,
            uniqueAnonViews
        }, "View count synced successfully")
    );
});

// @desc    Clean up old anonymous view records (older than 1 hour for testing)
// @route   DELETE /api/v1/view/cleanup
// @access  Public (for maintenance)
const cleanupOldViews = asyncHandler(async (req, res) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000); // 1 hour for testing

    // Delete old anonymous views (keep user views forever)
    const result = await View.deleteMany({
        user: null,
        createdAt: { $lt: oneHourAgo }
    });


    return res.status(200).json(
        new ApiResponse(200, {
            deletedCount: result.deletedCount
        }, "Old view records cleaned up successfully")
    );
});

// @desc    Reset view count for a video (for testing)
// @route   DELETE /api/v1/view/reset/:videoId
// @access  Public (for testing only)
const resetVideoViews = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Get video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Delete all view records for this video
    const deletedViews = await View.deleteMany({ video: videoId });

    // Reset video view count
    video.views = 0;
    await video.save();


    return res.status(200).json(
        new ApiResponse(200, {
            videoId,
            title: video.title,
            deletedViewRecords: deletedViews.deletedCount,
            newViewCount: 0
        }, "Video views reset successfully")
    );
});

export { addView, getVideoViews, debugVideoViews, syncVideoViews, cleanupOldViews, resetVideoViews };