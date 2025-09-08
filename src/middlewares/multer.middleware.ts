import multer from "multer";
import path from "path";
import { Request } from "express";

// Supported file formats (using Set for O(1) lookups)
const ALLOWED_FILE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp4",
]);

// File validation function for uploads
const fileValidator = (
  req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  // Extract the file extension from the original file name
  const fileExtension = path.extname(file.originalname).toLowerCase();

  // Check if the file extension is in the allowed set
  if (ALLOWED_FILE_EXTENSIONS.has(fileExtension)) {
    callback(null, true);
  } else {
    // Return an error if the file type is not supported
    callback(
      new Error(
        `Unsupported file type: ${fileExtension}. Please upload an image or video file in one of these formats: ${Array.from(
          ALLOWED_FILE_EXTENSIONS
        ).join(", ")}`
      )
    );
  }
};

// Configure storage for multer using diskStorage
const storage = multer.diskStorage({
  // Specify the destination folder for uploaded files
  destination: function (req, file, cb) {
    cb(null, "public/temp");
  },
  // Create a unique filename for each file
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + path.extname(file.originalname));
  },
});

export const FILE_UPLOAD_LIMIT = 5 * 1024 * 1024 * 100; // 500MB limit for file size (Both videos and images are there)

// Export the multer middleware configuration, combining storage, file filter, and size limit
const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileValidator,
  limits: { fileSize: FILE_UPLOAD_LIMIT },
});

export default uploadMiddleware;
