import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
    try {
        const { name, description } = req.body;
        const user = req?.user._id;

        if (!name?.trim())
            throw new ApiError(400, "Playlist name is required");

        const createdPlaylist = await Playlist.create({
            name,
            description,
            videos: [],
            owner: user
        });

        return res
            .status(201)
            .json(
                new ApiResponse(
                    createdPlaylist,
                    201,
                    "Playlist created successfully"
                )
            );
    } catch (error) {
        return res
            .status(500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong in creating Playlist"
                )
            );
    }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) throw new ApiError(400, "User ID is required");

        const userPlaylists = await Playlist.find({ owner: userId }).populate(
            "videos"
        );

        return res
            .status(200)
            .json(new ApiResponse(userPlaylists, 200, "Success"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message ||
                        "Something went wrong in getting user playlists"
                )
            );
    }
});

const getPlaylistById = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params;
        if (!playlistId) throw new ApiError(400, "Playlist ID is required");

        const playlist = await Playlist.findById(playlistId).populate([
            {
                path: "videos",
                select: "title _id duration thumbnail view owner"
            },
            { path: "owner", select: "username avatar fullName" }
        ]);

        if (!playlist) throw new ApiError(404, "Playlist not found");

        const finalPlaylist = await playlist?.populate({
            path: "videos.owner",
            select: "username avatar fullName"
        });

        if (!finalPlaylist) throw new ApiError(404, "Playlist not found");

        return res
            .status(200)
            .json(new ApiResponse(finalPlaylist, 200, "Success"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong in getting playlist"
                )
            );
    }
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;

        if (!playlistId || !videoId)
            throw new ApiError(400, "Playlist ID and Video ID are required");

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) throw new ApiError(404, "Playlist not found");

        if (playlist.videos.includes(videoId)) {
            throw new ApiError(400, "Video already in playlist");
        }

        playlist.videos.push(videoId);
        await playlist.save();

        return res
            .status(200)
            .json(new ApiResponse(playlist, 200, "Video added to playlist"));
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message ||
                        "Something went wrong in adding video to playlist"
                )
            );
    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId, videoId } = req.params;

        if (!playlistId || !videoId)
            throw new ApiError(400, "Playlist ID and Video ID are required");

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) throw new ApiError(404, "Playlist not found");

        if (!playlist.videos.includes(videoId)) {
            throw new ApiError(400, "Video not found in playlist");
        }

        playlist.videos.pull(videoId);
        await playlist.save();

        return res
            .status(200)
            .json(
                new ApiResponse(playlist, 200, "Video removed from playlist")
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message ||
                        "Something went wrong in removing video from playlist"
                )
            );
    }
});

const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params;
        if (!playlistId) throw new ApiError(400, "Playlist ID is required");

        const deletePlaylist = await Playlist.findByIdAndDelete(playlistId);

        if (!deletePlaylist) throw new ApiError(404, "Playlist not found");

        return res
            .status(200)
            .json(
                new ApiResponse(
                    deletePlaylist,
                    200,
                    "Playlist deleted successfully."
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong in deleting playlist"
                )
            );
    }
});

const updatePlaylist = asyncHandler(async (req, res) => {
    try {
        const { playlistId } = req.params;
        const { name, description } = req.body;


        if (!playlistId) throw new ApiError(400, "Playlist ID is required");

        const updateFields = {};
        if (name !== undefined) updateFields.name = name?.trim() || "";
        if (description !== undefined)
            updateFields.description = description?.trim() || "";

        if (Object.keys(updateFields).length === 0) {
            throw new ApiError(
                400,
                "At least one field (name or description) must be provided"
            );
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playlistId,
            updateFields,
            { new: true }
        );

        if (!updatedPlaylist) throw new ApiError(404, "Playlist not found");

        return res
            .status(200)
            .json(
                new ApiResponse(
                    updatedPlaylist,
                    200,
                    "Playlist updated successfully"
                )
            );
    } catch (error) {
        return res
            .status(error.statusCode || 500)
            .json(
                new ApiResponse(
                    null,
                    error.statusCode || 500,
                    error.message || "Something went wrong in updating playlist"
                )
            );
    }
});

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
};