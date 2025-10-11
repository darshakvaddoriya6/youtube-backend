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

// Shared upload config
const uploadVideoFields = upload.fields([
  { name: "videoFile", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

// 🟢 Public Routes
router.get("/search", searchVideos);
router.get("/", getAllVideos);
router.get("/:videoId", getVideo);

// 🔒 Protected Routes
router.use(verifyJWT);
router.post("/", uploadVideoFields, publishVideo);
router
  .route("/:videoId")
  .patch(uploadVideoFields, updateVideo)
  .delete(deleteVideo);

export default router;
