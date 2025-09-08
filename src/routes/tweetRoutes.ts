import { NextFunction, Router, Request, Response } from "express";
import authenticateUser from "../middlewares/auth.middleware";
import UserModel from "../models/user.model";
import TweetModel from "../models/tweets.model";
import LikeModel from "../models/likes.model";

const tweetRouter = Router();
/* localhost/api/v1/tweets */

/* id, owner , content */

//   * /tweets/upload - POST - Add a new tweet
tweetRouter.post(
  "/upload",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      Logic:
      1. Retrieve the authenticated user's ID from the request.
      2. Fetch the user details from the database to ensure the user exists.
      3. Extract the tweet content from the request body.
         - Validate that content exists and is not an empty string.
      4. Create a new tweet document with the user ID as the owner and the provided content.
      5. Save the tweet document to the database.
      6. Return the saved tweet in the response.
    */
    try {
      const userId = req.user._id;

      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        throw new Error("Unable to find the user");
      }
      const { content } = req.body;
      if (!content || content.trim() === "") {
        throw new Error("Please write a valid tweet");
      }

      const newTweet = new TweetModel({
        owner: userId,
        content,
      });

      const savedTweet = await newTweet.save();

      res.status(200).send(savedTweet);
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to upload the tweet",
        error: error.message,
      });
    }
  }
);

//   * /tweets - GET - Get a list of all tweets or tweets by a specific user.
tweetRouter.get("", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const allTweets = await TweetModel.find().populate("owner");
    res.status(200).send(allTweets);
  } catch (error: any) {
    res.status(400).json({
      message: "Unable to fetch the tweets",
      error: error.message,
    });
  }
});

//   * /tweets/delete/:tweetId - DELETE
tweetRouter.delete(
  "/delete/:tweetId",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    /*
    LOGIC
    1. Ensure the request contains a valid authenticated user
    2. Extract tweetId from request parameters
    3. Find the tweet in the database
    4. Check if the authenticated user is the owner of the tweet
    5. Delete the tweet from the database
    */

    try {
      const userId = req.user._id;
      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        throw new Error("Unable to find the user");
      }

      const { tweetId } = req.params;
      const tweet = await TweetModel.findById({ _id: tweetId });
      if (!tweet) {
        throw new Error("Tweet not found.");
      }

      if (tweet.owner.toString() !== userId.toString()) {
        throw new Error("Unauthorized: Only the owner can delete this tweet.");
      }

      // Delete the tweet using the correct deletion method
      const deletedTweet = await TweetModel.findByIdAndDelete(tweetId);

      res
        .status(200)
        .json({ message: "Tweet deleted successfully.", deletedTweet });
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to delete the tweet",
        error: error.message,
      });
    }
  }
);

//   * /tweets/edit/:tweetId - PATCH
tweetRouter.patch(
  "/edit/:tweetId",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    /*
    LOGIC
    1. Ensure the request contains a valid authenticated user
    2. Extract tweetId from request parameters
    3. Find the tweet in the database
    4. Check if the authenticated user is the owner of the tweet
    5. Update the tweet's content only if new content is provided.
    6. Save the updated tweet
    */
    try {
      const userId = req.user._id;
      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        throw new Error("Unable to find the user");
      }

      const { tweetId } = req.params;
      const tweet = await TweetModel.findById(tweetId);
      if (!tweet) {
        throw new Error("Tweet not found.");
      }

      if (tweet.owner.toString() !== userId.toString()) {
        throw new Error("Unauthorized: Only the owner can delete this tweet.");
      }

      const { content } = req.body;
      if (content) {
        tweet.content = content;
        await tweet.save();
      } else {
        throw new Error("No new content Provided");
      }

      res.status(200).json({ message: "Tweet deleted successfully.", tweet });
    } catch (error: any) {
      res.status(400).json({
        message: "Unable to edit the tweet",
        error: error.message,
      });
    }
  }
);

//   * /tweets/:tweetId/toggle/like - PATCH
tweetRouter.post(
  "/:tweetId/toggle/like",
  authenticateUser,
  // @ts-expect-error : sending 2 responses
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      LOGIC:
      1. Retrieve details of the authenticated user.
      2. Find the tweet by tweetId and ensure it exists.
      3. Validate the like status from the frontend (should be a boolean).
      4. Check if the user has already liked the tweet.
      5. If a like exists, update its status; if not and the status is true, create a new like document.
    */
    try {
      const userId = req.user._id;
      const user = await UserModel.findById(userId);
      if (!user) {
        throw new Error("Unable to find the user");
      }

      const { tweetId } = req.params;
      const tweetDetails = await TweetModel.findById(tweetId);
      if (!tweetDetails) {
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
        tweet: tweetId,
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
        tweet: tweetId,
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
export default tweetRouter;
