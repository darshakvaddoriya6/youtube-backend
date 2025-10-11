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

// 📁 Shared upload configuration
const videoUploadFields = upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
]);

// 🌐 Public routes (no authentication required)
router.get("/search", searchVideos);
router.get("/", getAllVideos);
router.get("/:videoId", getVideo);

// 🔒 Protected routes (authentication required)
router.use(verifyJWT);

// 📤 Video upload
router.post("/", videoUploadFields, publishVideo);

// ⚙️ Video management
router.delete("/:videoId", deleteVideo);
router.patch("/:videoId", videoUploadFields, updateVideo);

export default router;
