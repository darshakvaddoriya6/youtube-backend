import { v2 as cloudinary } from "cloudinary";
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload
            (localFilePath, {
                resource_type: "auto"
            })
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

// Delete by public_id, trying video first then image
const DeleteFile = async (publicId) => {
    try {
        if (!publicId) return null
        // Try deleting as video
        const videoDelete = await cloudinary.uploader.destroy(publicId, { resource_type: "video" })
        if (videoDelete && (videoDelete.result === "ok" || videoDelete.result === "not found")) {
            return videoDelete
        }
        // Fallback: try deleting as image
        const imageDelete = await cloudinary.uploader.destroy(publicId, { resource_type: "image" })
        return imageDelete
    } catch (error) {
        return null
    }
}

export { uploadOnCloudinary, DeleteFile }