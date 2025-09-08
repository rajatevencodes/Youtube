import { NextFunction, Router, Request, Response } from "express";
import authenticateUser from "../middlewares/auth.middleware";
import VideoModel from "../models/video.model";
import uploadMiddleware from "../middlewares/multer.middleware";
import cloudinaryService from "../services/cloudinary.service";
import { formatVideoDuration } from "../utils/formatVideoDuration";
import UserModel from "../models/user.model";
import CommentModel from "../models/comments.model";
import LikeModel from "../models/likes.model";

const videoRouter = Router();
/* localhost/api/v1/videos */

//   * /videos/upload - POST - upload a new video
videoRouter.post(
  "/upload",
  authenticateUser,
  uploadMiddleware.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    /*
    Logic Flow
    1. Retrieve the authenticated user ID from the request.
    2. Initialize variables to store Cloudinary URLs for the video and thumbnail, as well as the video's duration.
    3. Validate and process the uploaded video:
       - Ensure a video file is provided.
       - Upload the video to Cloudinary and retrieve its URL and duration.
    4. Validate and process the uploaded thumbnail:
       - Ensure a thumbnail file is provided.
       - Upload the thumbnail to Cloudinary and retrieve its URL.
    5. Extract the title and description from the request body and validate them.
    6. Format the video's duration for consistent display.
    7. Create a new video record in the database.
    8. Save the video record and respond with the saved video details.
    */
    try {
      // 1. Retrieve authenticated user ID
      const userId = req.user;
      if (!userId) {
        throw new Error("User authentication failed.");
      }

      // 2. Initialize variables to store Cloudinary URLs and duration
      let videoCloudinaryLink: string | undefined;
      let thumbnailCloudinaryLink: string | undefined;
      let durationOfVideo: string | undefined;

      // 3. Validate and process the video upload
      if (req.files && !Array.isArray(req.files) && req.files.video) {
        const videoLocalPath = req.files.video[0].path;

        // Upload video to Cloudinary
        const { optimizedUrl, duration } =
          await cloudinaryService.uploadOnCloudinary(videoLocalPath);
        videoCloudinaryLink = optimizedUrl;
        durationOfVideo = duration; // Duration is received as a string
      } else {
        throw new Error("Please upload a video file.");
      }

      // 4. Validate and process the thumbnail upload
      if (req.files && !Array.isArray(req.files) && req.files.thumbnail) {
        const thumbnailLocalPath = req.files.thumbnail[0].path;

        // Upload thumbnail to Cloudinary
        const { optimizedUrl } = await cloudinaryService.uploadOnCloudinary(
          thumbnailLocalPath
        );
        thumbnailCloudinaryLink = optimizedUrl;
      } else {
        throw new Error("Please upload a thumbnail file.");
      }

      // 5. Extract and validate title and description
      const { title, description } = req.body;
      if (!title?.trim() || !description?.trim()) {
        throw new Error("Title and description are required.");
      }

      // 6. Format video duration for consistency
      if (durationOfVideo) {
        durationOfVideo = formatVideoDuration(durationOfVideo);
      }

      // 7. Create a new video record in the database
      const newVideo = new VideoModel({
        videoSrc: videoCloudinaryLink,
        thumbnail: thumbnailCloudinaryLink,
        owner: userId,
        title,
        description,
        duration: durationOfVideo,
        views: 0, // Initialize views to 0
      });

      // 8. Save the video record in the database
      const savedVideo = await newVideo.save();

      // 9. Respond with the saved video details
      res.status(201).json(savedVideo);
    } catch (error: any) {
      res
        .status(400)
        .json({ message: "Unable to upload the video", error: error.message });
    }
  }
);
//   * /videos - GET - get all the videos and their details
videoRouter.get("", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const video = await VideoModel.find().populate("owner");
    res.send(video);
  } catch (error: any) {
    res.status(400).json({
      message: "Unable to fetch the videos",
      error: error.message,
    });
  }
});

//   * /videos/view/:videoId - GET - get details of the video - title, description , ownerInfo etc.
videoRouter.get(
  "/view/:videoId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.params;
      const videoDetails = await VideoModel.find({ _id: videoId }).populate(
        "owner"
      );
      if (!videoDetails) {
        throw new Error("Unable to find the video");
      }

      res.send(videoDetails);
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to fetch the video",
        error: error.message,
      });
    }
  }
);

//   * /videos/delete/:videoId - DELETE - delete the video
videoRouter.delete(
  "/delete/:videoId",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    /*
    LOGIC
    1. Ensure the request contains a valid authenticated user
    2. Extract videoId from request parameters
    3. Find the video in the database
    4. Check if the authenticated user is the owner of the video
    5. Delete the video from the database
    */
    try {
      const userId = req.user._id;
      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        throw new Error("Unable to find the user");
      }

      const { videoId } = req.params;
      const videoDetails = await VideoModel.findById(videoId);
      if (!videoDetails) {
        throw new Error("Video not found.");
      }

      if (videoDetails.owner.toString() !== userId.toString()) {
        throw new Error("Unauthorized: Only the owner can delete this video.");
      }

      await VideoModel.findByIdAndDelete(videoId);

      res.status(200).json({ message: "Video deleted successfully." });
    } catch (error: any) {
      res.status(500).json({
        message: "Unable to delete the video.",
        error: error.message,
      });
    }
  }
);

//   * /videos/edit/:videoId - PATCH - Update Video
videoRouter.patch(
  "/edit/:videoId",
  authenticateUser,
  uploadMiddleware.fields([{ name: "thumbnail", maxCount: 1 }]),
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      Logic:
      * Note : We cannot change the video
      1. Retrieve the authenticated user details.
      2. Get the video by videoId and check if it exists.
      3. Confirm that the authenticated user is the owner of the video.
      4. Optionally process the thumbnail file upload:
         - If a new thumbnail is provided, upload it to Cloudinary and get the optimized URL.
         - If not provided, retain the existing thumbnail.
      5. Update the video details (title and description) only if new values are provided.
      6. Save the updated video document to the database.
    */
    try {
      // Step 1: Retrieve the authenticated user's ID.
      const userId = req.user._id;

      // Step 2: Retrieve the video using the videoId from the request parameters.
      const { videoId } = req.params;
      const videoDetails = await VideoModel.findOne({ _id: videoId });
      if (!videoDetails) {
        throw new Error("Video not found.");
      }

      // Step 3: Verify that the authenticated user is the owner of the video.
      if (videoDetails.owner.toString() !== userId.toString()) {
        throw new Error("Unauthorized: Only the owner can edit this video.");
      }

      // Step 4: Optionally process the thumbnail upload if provided.
      if (req.files && !Array.isArray(req.files) && req.files.thumbnail) {
        const thumbnailLocalPath = req.files.thumbnail[0].path;
        // Upload thumbnail to Cloudinary and update the thumbnail URL.
        const { optimizedUrl } = await cloudinaryService.uploadOnCloudinary(
          thumbnailLocalPath
        );
        videoDetails.thumbnail = optimizedUrl;
      }

      // Step 5: Update title and description if provided in the request body.
      const { title, description } = req.body;
      if (title) {
        videoDetails.title = title;
      }
      if (description) {
        videoDetails.description = description;
      }

      // Step 6: Save the updated video details to the database.
      await videoDetails.save();

      res.status(200).json({
        message: "Video updated successfully",
        video: videoDetails,
      });
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to edit the video",
        error: error.message,
      });
    }
  }
);

/* Comment And Like */
// * /videos/:videoId/comment - POST - DO THIS TO  /:videoId/add/comment - will add a comment and /:videoId/comments - will fetch all the comments
videoRouter.post(
  "/:videoId/comment",
  authenticateUser,
  /*
  LOGIC
  1. Retrieve the authenticated user details.
  2. Get the video by videoId and check if it exists.
  3. Get the content from the req.body and validate
  4. Create newComment Model and save it
  */
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const { videoId } = req.params;
      const isVideoExist = await VideoModel.findById(videoId);
      if (!isVideoExist) {
        throw new Error("Video not found");
      }

      const { content } = req.body;
      if (!content || content.trim() === "") {
        throw new Error("Invalid comment");
      }

      const newComment = new CommentModel({
        video: videoId,
        owner: userId,
        content: content,
      });

      const savedComment = await newComment.save();
      res.status(200).send({ savedComment });
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to comment on the video",
        error: error.message,
      });
    }
  }
);

// * /videos/:videoId/toggle/like
videoRouter.post(
  "/:videoId/toggle/like",
  authenticateUser,
  // @ts-expect-error : sending 2 responses
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      LOGIC:
      1. Retrieve details of the authenticated user.
      2. Find the video by videoId and ensure it exists.
      3. Validate the like status from the frontend (should be a boolean).
      4. Check if the user has already liked the video.
      5. If a like exists, update its status; if not and the status is true, create a new like document.
    */
    try {
      const userId = req.user._id;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("Unable to find the user");
      }

      const { videoId } = req.params;
      const videoDetails = await VideoModel.findById(videoId);
      if (!videoDetails) {
        throw new Error("Unable to find the video");
      }

      const { toggleLike } = req.body;

      // Ensure toggleLike is a boolean value.
      if (typeof toggleLike !== "boolean") {
        throw new Error(
          "toggleLike must be a boolean: true to like or false to remove the like"
        );
      }

      // Check if the user has already liked the video.
      const existingLike = await LikeModel.findOne({
        video: videoId,
        likedBy: userId,
      });

      // If the like exists, update its status.
      if (existingLike) {
        existingLike.isLiked = toggleLike;
        const updatedLike = await existingLike.save();
        return res.status(201).json(updatedLike);
      }

      // If toggleLike is false and no like exists before, no action is needed.
      if (!toggleLike) {
        throw new Error("No like exists to remove.");
      }

      // Otherwise, create a new Like document.
      const newLike = new LikeModel({
        video: videoId,
        likedBy: userId,
        isLiked: true,
      });
      const savedLike = await newLike.save();
      res.status(201).json(savedLike);
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to toggle the like",
        error: error.message,
      });
    }
  }
);

export default videoRouter;
