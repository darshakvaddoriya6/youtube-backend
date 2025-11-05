import { Router } from "express";
import {
    addToWatchHistory,
    changeCurrentPassword,
    deleteSingleWatchHistory,
    clearAllWatchHistory,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchLater,
    toggleWatchLater,
    clearWatchLater,
    togglePlaylistSave,
    deleteUser,
    getSavedPlaylists
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()


router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//secured routes

router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

// history routes
router.route("/history").get(verifyJWT, getWatchHistory)
router.route("/history/add").post(verifyJWT, addToWatchHistory);
router.route("/history/delete/:historyId").delete(verifyJWT, deleteSingleWatchHistory);
router.route("/history/watch-history/clear").delete(verifyJWT, clearAllWatchHistory);

// Watch Later routes
router.route("/watch-later").get(verifyJWT, getWatchLater);
router.route("/watch-later/toggle").post(verifyJWT, toggleWatchLater);
router.route("/watch-later/clear").delete(verifyJWT, clearWatchLater);

// Delete user route
router.route("/delete-account").delete(verifyJWT, deleteUser);

// Playlist routes
router.route("/playlist/toggle").post(verifyJWT, togglePlaylistSave);
router.route("/playlist/saved").get(verifyJWT, getSavedPlaylists);



export default router