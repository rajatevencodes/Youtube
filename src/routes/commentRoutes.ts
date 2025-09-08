import { NextFunction, Router, Request, Response } from "express";
import authenticateUser from "../middlewares/auth.middleware";
import UserModel from "../models/user.model";
import CommentModel from "../models/comments.model";
import LikeModel from "../models/likes.model";

//  * Note : We can comment only on videos
//           added the functionality on videoRoute : in /videos/:videoId/comment

const commentRouter = Router();

//  * /comments/delete/:commentId - DELETE
commentRouter.delete(
  "/delete/:commentId",
  authenticateUser,
  /*
    LOGIC:
    1. Authenticate the request to ensure a valid user.
    2. Extract the commentId from the request parameters.
    3. Retrieve the comment from the database.
    4. Verify that the authenticated user is the owner of the comment.
    5. Delete the comment from the database.
  */
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      // Ensure the authenticated user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Extract commentId from parameters
      const { commentId } = req.params;
      // Retrieve comment details from the database
      const comment = await CommentModel.findById(commentId);
      if (!comment) {
        throw new Error("Comment not found");
      }

      // Verify that the authenticated user is the owner of the comment
      if (comment.owner.toString() !== userId.toString()) {
        throw new Error(
          "Unauthorized: Only the comment owner can delete this comment"
        );
      }

      // Delete the comment from the database
      const deletedComment = await CommentModel.findByIdAndDelete(commentId);
      res.status(200).send(deletedComment);
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to delete the comment",
        error: error.message,
      });
    }
  }
);

//  * /comments/edit/:commentId - PATCH
commentRouter.patch(
  "/edit/:commentId",
  authenticateUser,
  /*
    LOGIC:
    1. Ensure the request is made by a valid, authenticated user.
    2. Extract the commentId from the request parameters.
    3. Retrieve the comment from the database.
    4. Verify that the authenticated user is the owner of the comment.
    5. Validate and update the comment's content with the new value from req.body.
  */
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user._id;
      // Verify that the authenticated user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Extract commentId from parameters
      const { commentId } = req.params;
      // Retrieve the comment from the database
      const commentDetails = await CommentModel.findById(commentId);
      if (!commentDetails) {
        throw new Error("Comment not found");
      }

      // Ensure the authenticated user is the owner of the comment
      if (commentDetails.owner.toString() !== userId.toString()) {
        throw new Error("Unauthorized: Only the owner can edit this comment");
      }

      // Validate and update the comment content
      const { content } = req.body;
      if (!content || content.trim() === "") {
        throw new Error("Please enter valid comment content");
      }

      commentDetails.content = content;
      const savedComment = await commentDetails.save();
      res.status(200).send(savedComment);
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to edit the comment",
        error: error.message,
      });
    }
  }
);

//  * /comments/:commentId/toggle/like/ - POST
commentRouter.post(
  "/:commentId/toggle/like",
  authenticateUser,
  // @ts-expect-error : sending 2 responses
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      LOGIC:
      1. Retrieve details of the authenticated user.
      2. Find the comment by commentId and ensure it exists.
      3. Validate the like status from the frontend (should be a boolean).
      4. Check if the user has already liked the comment.
      5. If a like exists, update its status; if not and the status is true, create a new like document.
    */
    try {
      const userId = req.user._id;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("Unable to find the user");
      }

      const { commentId } = req.params;
      const commentDetails = await CommentModel.findById(commentId);
      if (!commentDetails) {
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
        comment: commentId,
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
        comment: commentId,
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

export default commentRouter;
