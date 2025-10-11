import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideo,
    publishVideo,
    searchVideos,
    updateVideo
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middlewares.js"

const router = Router();
router.get("/search", searchVideos); // Public search endpoint
router.get("/:videoId", getVideo);
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
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