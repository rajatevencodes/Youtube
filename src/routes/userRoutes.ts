import { NextFunction, Router, Request, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../models/user.model";
import authenticateUser from "../middlewares/auth.middleware";
import uploadMiddleware from "../middlewares/multer.middleware";
import cloudinaryService from "../services/cloudinary.service";
import bcrypt from "bcrypt";
import { authConfig } from "../config/authConfig";

const userRouter = Router();
/* localhost/api/v1/users */

// * '/me/profile/view'
userRouter.get(
  "/me/profile/view",
  authenticateUser,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      res.send(user);
    } catch (error: any) {
      res
        .status(400)
        .send(
          "Unable to view the proflie of loggedIn User. Error: " + error.message
        );
    }
  }
);

// * '/me/profile/deleteAccount'
userRouter.delete(
  "/me/profile/deleteAccount",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      Logic Flow:
      1. Retrieve the user ID from req.user.
      2. Find the user in the database.
      3. Delete the account from the database.
      4. Remove the cookies on the client side.
    */
    try {
      const userId = req.user._id;

      // Check if the user exists. If not, throw an error.
      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        throw new Error("Unable to find the user");
      }

      // Delete the account by userId. Using await returns the deleted document.
      const deletedUser = await UserModel.findByIdAndDelete(userId);
      if (!deletedUser) {
        throw new Error("Failed to delete the account");
      }
      console.log("Deleted:", deletedUser);

      // Remove the authentication cookie by setting it to null and expiring it immediately.
      res.cookie(authConfig.cookie.name, null, {
        expires: new Date(Date.now()),
      });

      res.send({ message: "Account Deleted Successfully" });
    } catch (error: any) {
      res.status(400).send("Unable to delete the account: " + error.message);
    }
  }
);

// * '/me/profile/edit/avatar'
userRouter.patch(
  "/me/profile/edit/avatar",
  authenticateUser,
  // Middleware for handling image uploads with a limit of one file for the "avatar" field
  uploadMiddleware.fields([{ name: "avatar", maxCount: 1 }]),
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      Logic Flow:
      1. Retrieve the user ID from req.user.
      2. Find the user in the database.
      3. Delete the previous avatar from Cloudinary and remove its URL from the database.
      4. If a new avatar is provided in req.files, upload it to Cloudinary.
      5. Update the user's avatar URL in the database and send the new URL in the response.
    */
    try {
      const userId = req.user._id;
      const user = await UserModel.findOne({ _id: userId });

      if (!user) {
        throw new Error("Unable to find the user");
      }

      let avatarCloudinaryUrl: string | undefined = user.avatar;

      // Delete the current avatar if it exists
      if (avatarCloudinaryUrl) {
        await cloudinaryService.deleteOnCloudinary(avatarCloudinaryUrl);
        // Clear the avatar URL from the database
        user.avatar = "";
        avatarCloudinaryUrl = undefined;
      } else {
        throw new Error("Cannot get the Avatar link from the database");
      }

      // Upload the new avatar if provided
      if (req.files && !Array.isArray(req.files) && req.files.avatar) {
        const avatarLocalPath = req.files.avatar[0].path;
        const { optimizedUrl } = await cloudinaryService.uploadOnCloudinary(
          avatarLocalPath
        );
        avatarCloudinaryUrl = optimizedUrl;
      } else {
        throw new Error("Pls add a file");
      }

      // Update the user's avatar URL and save the changes
      user.avatar = avatarCloudinaryUrl;
      await user.save();

      res.send(avatarCloudinaryUrl);
    } catch (error: any) {
      res.status(400).send("Unable to change the avatar: " + error.message);
    }
  }
);

// * '/me/profile/edit/coverImage'
userRouter.patch(
  "/me/profile/edit/coverImage",
  authenticateUser,
  uploadMiddleware.fields([{ name: "coverImage", maxCount: 1 }]),
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      Logic Flow:
      1. Retrieve the user ID from req.user.
      2. Find the user in the database.
      3. Delete the previous coverImage from Cloudinary and remove its URL from the database.
      4. If a new coverImage is provided in req.files, upload it to Cloudinary.
      5. Update the user's coverImage URL in the database and send the new URL in the response.
    */
    try {
      const userId = req.user._id;
      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        throw new Error("Unable to find the user");
      }

      let coverImageCloudinaryUrl: string | undefined = user.coverImage;

      // Delete the current coverImage if exists
      if (coverImageCloudinaryUrl) {
        await cloudinaryService.deleteOnCloudinary(coverImageCloudinaryUrl);
        user.coverImage = "";
        coverImageCloudinaryUrl = undefined;
      } else {
        throw new Error("Cannot get the CoverImage link from the database");
      }

      // Upload the new coverImage if provided
      if (req.files && !Array.isArray(req.files) && req.files.coverImage) {
        const coverImageLocalPath = req.files.coverImage[0].path;
        const { optimizedUrl } = await cloudinaryService.uploadOnCloudinary(
          coverImageLocalPath
        );
        coverImageCloudinaryUrl = optimizedUrl;
      } else {
        throw new Error("Pls add a file");
      }

      // Update the user's coverImage URL and save the changes
      user.coverImage = coverImageCloudinaryUrl;
      await user.save();

      res.send(coverImageCloudinaryUrl);
    } catch (error: any) {
      res.status(400).send("Unable to change the coverImage: " + error.message);
    }
  }
);

// * '/me/profile/edit/password'
userRouter.patch(
  "/me/profile/edit/password",
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      Logic Flow:
      1. Retrieve the user ID from req.user.
      2. Find the user in the database.
      3. Validate the current password provided by the user.
      4. Hash the new password.
      5. Update the password in the database.
      6. Send a success response.
    */

    try {
      const userId = req.user._id;
      const user = await UserModel.findOne({ _id: userId });
      if (!user) {
        throw new Error("User not found");
      }

      const { currentInputPassword, newPassword } = req.body;
      console.log(req.body);

      if (!currentInputPassword || !newPassword) {
        throw new Error("Both current and new passwords are required");
      }

      // Validate the current password
      const isValidPassword = await bcrypt.compare(
        currentInputPassword,
        user.password
      );
      if (!isValidPassword) {
        throw new Error("Incorrect current password");
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;

      await user.save();
      res.send({ message: "Password changed successfully" });
    } catch (error: any) {
      res
        .status(400)
        .send({ error: "Unable to change the password: " + error.message });
    }
  }
);

// * '/me/subscribers'
// * '/me/likes'
// * '/me/tweets'

// * '/me/history'
userRouter.get(
  "/me/history",
  /*
    * AIM:
    When the user clicks on "History" on the frontend, we want them to see the video owner’s avatar, along with the video title, thumbnail, views, and upload time.

    * PROBLEM: 
    Our video model only stores the user's _id who uploaded the video. It does not store the username or avatar.

    * Solution
    * Step 1 : Find the user in the database
    * Step 2 : We have a watchHistory section in our user model that stores a list of video IDs.
      To get more details about these videos, we will again use an aggregation pipeline.
    * Step 3 : The pipeline will look up the video owner's details (username and avatar) using the owner’s _id.
    * Step 4 : Finally, we add these details : user's History -> video -> owner (username and avatar)

    */
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentUserId = req.user._id; //string "5safeq3er"
      const user = await UserModel.aggregate([
        {
          // 🎯 Step 1: Find the user in the database
          $match: {
            // ❌ We can't use _id: currentUserId directly because it's a string
            // ✅ We must convert it to ObjectId so MongoDB understands it
            _id: new mongoose.Types.ObjectId(currentUserId),
          },
        },
        {
          // 🎯 Step 2: Get the videos the user has watched
          $lookup: {
            from: "videos", // 🔍 Look for videos in the "videos" collection
            localField: "watchHistory", // 🔗 Match with the user’s watch history
            foreignField: "_id", // 🔗 Find videos by their unique _id
            as: "watchHistory", // 📦 Store the found videos in "watchHistory"

            // 📌 We could use `populate`, but we want the customized data
            pipeline: [
              {
                // 🎯 Step 3: Get the owner (uploader) details for each video
                $lookup: {
                  from: "users", // 🔍 Look for users in the "users" collection
                  localField: "owner", // 🔗 Match with the video's "owner" field
                  foreignField: "_id", // 🔗 Find the user by their _id
                  as: "owner", // 📦 Store the owner info in "owner"

                  // 🔹 Only get specific details (username & avatar)
                  pipeline: [
                    {
                      $project: {
                        username: 1,
                        avatar: 1,
                      },
                    },
                  ],
                },
              },
              {
                // 🎯 Step 4: Make "owner" a single object instead of an array
                $addFields: {
                  owner: { $first: "$owner" }, // 🎭 Get the first (only) owner
                },
              },
            ],
          },
        },
      ]);
      // * Note Aggregation Pipelines return in array
      res.json(user[0].watchHistory);
    } catch (error: any) {
      res
        .status(400)
        .send("Unable to fetch the watch History :: ERROR : " + error.message);
    }
  }
);

// * '/:username' - view another person's profile
userRouter.get(
  "/:username",
  async (req: Request, res: Response, next: NextFunction) => {
    /*
     Logic Flow:
      1. Extract the username from the request parameters.
      2. Validate that the username - not just a whitespace.
      3. Check if the channel name exists by running an aggregation pipeline. 
         (Note: We use an aggregation pipeline instead of storing a subscriber count in the user model,
         as updating a large number of subscribers can be inefficient.)
      4. Throw Error if channel does not exists.
      5. Return the channel details.
    */
    try {
      const { username } = req.params;
      if (!username?.trim()) {
        throw new Error("Username not found");
      }

      const channel = await UserModel.aggregate(
        [
          {
            // Pipeline 1: Find the user by username (converted to lowercase)
            $match: {
              username: username.toLowerCase(),
            },
          },
          // At this point, we have the channel or user details.
          {
            // Pipeline 2: Get the list of people who subscribed to this channel.
            // Note : We are grouping all the documents in this pipeline not the ^^count^^ yet
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel", // Find subscriptions where the channel field matches the _id
              as: "subscribers",
            },
          },
          {
            // Pipeline 3: Get the list of channels that this user has subscribed to.
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "subscriber", // Find subscriptions where the subscriber field matches the _id
              as: "subscribedTo",
            },
          },
          {
            // Pipeline 4: Add extra fields to our result.
            $addFields: {
              // Count the number of subscribers
              subscribersCount: {
                $size: "$subscribers",
              },
              // Count the number of channels the user is subscribed to
              subscribedToCount: {
                $size: "$subscribedTo",
              },
              // Check if the current logged-in user is a subscriber of this channel.
              // If req.user._id is found in the subscribers list, then isSubscribed is true.
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            // Pipeline 5: Choose only the fields we want to send to the front-end.
            // If we give all the information then we are unnecessarily exposing our data on the client-side.
            $project: {
              username: 1,
              avatar: 1,
              coverImage: 1,
              isPremium: 1,
              email: 1,

              // Generated via pipelines
              subscribersCount: 1,
              subscribedToCount: 1,
              isSubscribed: 1,
            },
          },
        ],
        {
          // Options for the aggregation can go here.
        }
      );

      // The aggregation pipelines return an array.
      // Check the length of the array: if it's 0, the channel wasn't found.
      if (!channel.length) {
        throw new Error("Channel not found.");
      }

      res.json(channel);
    } catch (error: any) {
      res
        .status(400)
        .send(
          "Unable to fetch the channel Details :: ERROR : " + error.message
        );
    }
  }
);

export default userRouter;
