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

// Public routes (no auth)
router.get("/search", searchVideos);
router.get("/", getAllVideos);

// Public GET for a single video
router.route("/:videoId").get(getVideo);

// Apply JWT to all following routes (protected)
// router.use(verifyJWT);

// Protected: upload a new video
router.post("/",verifyJWT, videoUploadFields, publishVideo);

// Protected: management routes for a video (same path, different methods)
router.route("/:videoId")
  .patch(verifyJWT,videoUploadFields, updateVideo)
  .delete(verifyJWT,deleteVideo);

export default router;
