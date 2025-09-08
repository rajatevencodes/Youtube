import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { extractPublicId } from "cloudinary-build-url";
import { getPublicId } from "../utils/getPublicId";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (localFilePath: string) {
  try {
    if (!localFilePath) {
      throw new Error("Local Path not found while uploading on Cloudinary");
    }

    // Upload the image to Cloudinary
    const uploadResult = await cloudinary.uploader
      .upload(localFilePath, {
        resource_type: "auto", // Autmatically detects the file type - image , video
      })
      .catch((error) => {
        console.error("Cloudinary Error: " + error);
      });

    // Remove the file from local storage
    fs.unlinkSync(localFilePath);
    // console.log(uploadResult);

    const duration =
      uploadResult?.resource_type === "video" ? uploadResult.duration : null;

    // Get an optimized URL using Cloudinary's transformation features - works for both video and photos
    const optimizedUrl = cloudinary.url(uploadResult?.public_id as string, {
      transformation: [
        { width: 800, crop: "limit" }, //Limit the width to 800 pixels
        { quality: "auto", fetch_format: "auto" }, //Automatically adjust quality and format for optimized delivery
      ],
    });

    // Return both the original upload result and the optimized URL
    return {
      optimizedUrl,
      duration: duration ? `${duration}` : "0",
    };
  } catch (error: any) {
    // Remove the file locally if an error occurs
    fs.unlink(localFilePath, (unlinkError) => {
      if (unlinkError) {
        console.error("Error deleting local file:", unlinkError);
      } else {
        console.error("Local file deleted successfully.");
      }
    });
    throw new Error(error.message);
  }
};

const deleteOnCloudinary = async function (avatarCloudinaryUrl: string) {
  try {
    if (!avatarCloudinaryUrl) {
      throw new Error("Cloudinary URL is required to delete the image.");
    }

    // Check if the URL belongs to Cloudinary
    // Default image in our UserModel is from somewhere else
    const isCloudinaryUrl = avatarCloudinaryUrl.includes("res.cloudinary.com");
    if (!isCloudinaryUrl) {
      // console.warn("Not a Cloudinary URL, skipping deletion.");
      return { message: "Not a Cloudinary URL, deletion skipped." };
    }

    // Extract the public ID from the Cloudinary URL
    const publicId = getPublicId(avatarCloudinaryUrl);

    // Delete the image from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    // console.log("Delete response:", result);
    return result;
  } catch (error) {
    console.error("Error deleting image:", error);
  }
};

export default { uploadOnCloudinary, deleteOnCloudinary };
