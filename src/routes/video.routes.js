import { Router } from "express";
import {
    deleteVideo,
    getAllVideos,
    getVideo,
    publishVideo,
    searchVideos,
    updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

// Shared upload configuration
const videoUploadFields = upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
]);

// Public routes
router.route("/search").get(searchVideos);
router.route("/").get(getAllVideos);
router.route("/:videoId").get(getVideo);

// Protected routes
router.route("/").post(verifyJWT, videoUploadFields, publishVideo);
router.route("/:videoId")
    .patch(verifyJWT, videoUploadFields, updateVideo)
    .delete(verifyJWT, deleteVideo);

export default router;
