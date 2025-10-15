import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary with optimized settings
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      // Video-specific optimizations
      video_codec: "auto",
      quality: "auto:good",
      format: "mp4", // Ensure consistent format
      // Add transformation for better streaming
      eager: [
        { 
          streaming_profile: "hd",
          format: "m3u8" // HLS for better streaming
        }
      ],
      // Enable progressive download
      flags: "progressive"
    });

    // Remove the local file after upload
    fs.unlinkSync(localFilePath);

    // ✅ Always return the secure HTTPS URL with optimizations
    return {
      public_id: response.public_id,
      url: response.secure_url, // 👈 use HTTPS version
      resource_type: response.resource_type,
      // Include streaming URL if available
      streaming_url: response.eager?.[0]?.secure_url || response.secure_url
    };
  } catch (error) {
    // Remove temp file even if upload fails
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.error("Cloudinary upload failed:", error.message);
    return null;
  }
};

// Delete by public_id, trying video first then image
const DeleteFile = async (publicId) => {
  try {
    if (!publicId) return null;

    // Try deleting as video first
    const videoDelete = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });

    if (videoDelete?.result === "ok" || videoDelete?.result === "not found") {
      return videoDelete;
    }

    // Fallback: try deleting as image
    const imageDelete = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
    return imageDelete;
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message);
    return null;
  }
};

export { uploadOnCloudinary, DeleteFile };
