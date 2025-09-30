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
        console.log("File has been uoloade on coludianry", response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return  null
    }
}

cloudinary.v2.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/0/01/Charvet_shirt.jpg",
    { public_id: "wiki_shirt", })
    .then(result => console.log(result));

export {uploadOnCloudinary}