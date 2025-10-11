import { Router } from "express";
import { addView, getVideoViews, debugVideoViews, syncVideoViews, cleanupOldViews, resetVideoViews } from "../controllers/view.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Optional authentication middleware - will set req.user if token is valid, but won't fail if no token
const optionalAuth = (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  
  if (token) {
    // If token exists, verify it
    verifyJWT(req, res, next);
  } else {
    // If no token, continue without user
    req.user = null;
    next();
  }
};

// Routes
router.route("/v/:videoId").post(optionalAuth, addView); 
router.route("/v/:videoId").get(getVideoViews);
router.route("/debug/:videoId").get(debugVideoViews);
router.route("/sync/:videoId").post(syncVideoViews);
router.route("/cleanup").delete(cleanupOldViews);
router.route("/reset/:videoId").delete(resetVideoViews); // For testing only

export default router;
