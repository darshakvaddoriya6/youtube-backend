import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideo,
    publishVideo,
    searchVideos,
    updateVideo
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { upload } from "../middlewares/multer.middlewares.js"

const router = Router();

// Public routes (no authentication required)
router.get("/search", searchVideos);
router.get("/", getAllVideos);
router.get("/:videoId", getVideo);

// Protected routes (authentication required)
// Apply JWT middleware to all subsequent routes
router.use(verifyJWT);

// Video upload route
router.post("/",
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    publishVideo
);

// Video management routes
router
    .route("/:videoId")
    .delete(deleteVideo)
    .patch(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
        ]),
        updateVideo
    );


export default router