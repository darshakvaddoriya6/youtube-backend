import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
    try {
        const { content } = req.body
        const userId = req?.user._id;

        if (!content?.trim()) {
            throw new ApiError(400, "Content is required");
        }

        const newTweet = await Tweet.create({
            channel: userId,
            content
        });

        if (!newTweet) {
            throw new ApiError(500, "Failed to create tweet");
        }

        await newTweet.populate("channel", "username avatar fullName");

        return res
            .status(201)
            .json(
                new ApiResponse(newTweet, 201, "Tweet created successfully.")
            );
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    null,
                    500,
                    error.message || "Something went wrong."
                )
            );
    }
});

const updateTweet = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params;
        const { content } = req.body;
        if (!tweetId) throw new ApiError(400, "Tweet ID is required");
        if (!content?.trim()) throw new ApiError(400, "Content is required");

        const updateTweet = await Tweet.findByIdAndUpdate(
            { _id: tweetId },
            { content },
            { new: true }
        );

        if (!updateTweet) throw new ApiError(404, "Tweet not found");
        await updateTweet.populate("channel", "username avatar fullName");

        return res
            .status(200)
            .json(
                new ApiResponse(updateTweet, 200, "Tweet updated successfully.")
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong."
                )
            );
    }
});

const deleteTweet = asyncHandler(async (req, res) => {
    try {
        const { tweetId } = req.params;
        if (!tweetId) {
            throw new ApiError(400, "Tweet ID is required");
        }

        const deleteTweet = await Tweet.findByIdAndDelete(tweetId);

        if (!deleteTweet) {
            throw new ApiError(404, "Tweet not found");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(deleteTweet, 200, "Tweet deleted successfully.")
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong."
                )
            );
    }
});

const getUserTweets = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            throw new ApiError(400, "User ID is required");
        }

        const tweets = await Tweet.find({ channel: userId }).populate(
            "channel",
            "username avatar fullName"
        );

        return res
            .status(200)
            .json(
                new ApiResponse(
                    tweets,
                    200,
                    "User tweets retrieved successfully."
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong."
                )
            );
    }
});

export { createTweet, updateTweet, deleteTweet, getUserTweets };