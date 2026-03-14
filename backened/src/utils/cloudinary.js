import {v2 as cloudinary} from "cloudinary"
import fs from "fs";

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) =>{

    try{
        if(!localFilePath) {
            return null;
        }
        
        
        // Check if file exists before upload
        if(!fs.existsSync(localFilePath)) {
            return null;
        }
        
        const response = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_large(
                localFilePath, 
                { resource_type: "auto", chunk_size: 20000000 }, 
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        });

        if (response && response.secure_url) {
            response.url = response.secure_url;
        }

        // Check if file exists before trying to delete it
        if(fs.existsSync(localFilePath) && !localFilePath.includes('recordings')) {
            fs.unlinkSync(localFilePath);
        }
        return response;
    }

    catch(error){
        // Check if file exists before trying to delete it on error
        // Important: never delete stream video recordings on error so we can retry!
        if(localFilePath && fs.existsSync(localFilePath) && !localFilePath.includes('recordings')) {
            try {
                fs.unlinkSync(localFilePath);
            } catch (deleteError) {
            }
        }
        return null;
    }
}

const extractPublicId = (url, isRaw = false) => {
    try {
        const uploadIndex = url.indexOf('/upload/');
        if (uploadIndex === -1) return url;
        let path = url.slice(uploadIndex + 8);   // after '/upload/'
        path = path.replace(/^v\d+\//, '');       // strip version prefix e.g. v1234567/
        if (isRaw) return path;                   // raw files keep extension in public_id
        return path.replace(/\.[^/.]+$/, '');     // strip file extension
    } catch {
        return url;
    }
};

const deleteOnCloudinary = async (url) => {
    if (!url) return;
    try {
        let resourceType = "image";
        if (url.includes("/video/upload/")) resourceType = "video";
        else if (url.includes("/raw/upload/") || url.endsWith(".vtt")) resourceType = "raw";

        const publicId = extractPublicId(url, resourceType === "raw");
        const response = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
        return response;
    } catch (error) {
        console.error("Cloudinary deletion error:", error.message);
    }
};

const uploadSubtitleToCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;
        if (!fs.existsSync(localFilePath)) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "raw",
            format: "vtt",
        });

        if (response && response.secure_url) {
            response.url = response.secure_url;
        }

        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        if (localFilePath && fs.existsSync(localFilePath)) {
            try { fs.unlinkSync(localFilePath); } catch {}
        }
        return null;
    }
};

export {uploadOnCloudinary, deleteOnCloudinary, uploadSubtitleToCloudinary};
