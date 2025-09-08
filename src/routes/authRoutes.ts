import { Router, Request, Response, NextFunction } from "express";
import UserModel from "../models/user.model";
import bcrypt from "bcrypt";
import { authConfig } from "../config/authConfig";
import authenticateUser from "../middlewares/auth.middleware";
import uploadMiddleware from "../middlewares/multer.middleware";
import cloudinaryService from "../services/cloudinary.service";

const authRouter = Router();

// * 'Register'
authRouter.post(
  "/register",
  // Middleware to handle file uploads for the "avatar" field (currently allowing only one file but can update later to add more fields)
  uploadMiddleware.fields([{ name: "avatar", maxCount: 1 }]),
  async (req: Request, res: Response, next: NextFunction) => {
    /*
      Logic Flow:
      1. Extract user details from the request body.
      2. Validate the email format and other details.
      3. Check the database to see if a user with the same username or email already exists.
      4. If an avatar image is provided, upload it to Cloudinary.
         (For now, only the avatar is handled; cover images may be added later.)
      5. Hash the user's password.
      6. Create a new user record with the provided details and uploaded image (if available).
      7. Save the new user to the database.
      8. Generate a JWT token for the user and set it as a cookie.
      9. Return the saved user details in the response.
    */
    try {
      // Extract username, email, and password from the request body
      const { username, email, password } = req.body;
      if ([username, email, password].some((field) => field?.trim() === "")) {
        throw new Error("All fields are required");
      }

      // Check the uploaded files
      // console.log("Uploaded files:", req.files);

      // Initialize variable to hold avatar URL if provided
      let avatarCloudinaryUrl: string | undefined;

      // Ensure req.files is an object (not an array) so we can access the 'avatar' property,
      // and verify that an avatar file was uploaded.
      if (!Array.isArray(req.files) && req?.files?.avatar) {
        const avatarLocalPath = req.files.avatar[0].path;
        // console.log(avatarLocalPath); // Confirm the local Path
        // Upload the avatar to Cloudinary
        const { optimizedUrl } = await cloudinaryService.uploadOnCloudinary(
          avatarLocalPath
        );
        avatarCloudinaryUrl = optimizedUrl;
      }
      // * It's not mandatory for the user to upload avatar upload if it is just uncomment the else condition
      // else {
      //   throw new Error("Problem while processing Avatar Image");
      // }

      // Check if a user with the provided username or email already exists

      const existingUser = await UserModel.findOne({
        $or: [{ username }, { email }],
      });
      if (existingUser) {
        throw new Error("A user with this email or username already exists");
      }

      // Hash the password using bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create a new user object with the provided details and the avatar (if available)
      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        avatar: avatarCloudinaryUrl, // This will be undefined if no avatar was uploaded - and will get the default avatar url
      });

      // Save the new user to the database
      const savedUser = await newUser.save();

      // Generate a JWT token for the newly registered user
      const token = await savedUser.getJWT();

      // Set the JWT token in a cookie with proper configuration
      res.cookie(authConfig.cookie.name, token, {
        expires: new Date(
          Date.now() + authConfig.cookie.expiresInHours * 3600000
        ),
        httpOnly: authConfig.cookie.httpOnly,
        secure: authConfig.cookie.secure,
      });

      // Return the saved user details as a JSON response
      res.json(savedUser);
    } catch (error: any) {
      res
        .status(400)
        .send("Unable to register the user. Error: " + error.message);
    }
  }
);

// * 'Login'
authRouter.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    /*
    Logic Flow:
    1. Extract user details from the request body.
    2. Validate the email format and any other required details.
    3. Check the database to find the corresponding email and retrieve the user.
    4. Confirm the user's password.
    5. Generate a JWT token.
    6. Save the token in a cookie for the user.
    7. Return the saved user details in the response.
    */

    try {
      const { email, password } = req.body;
      if ([email, password].some((field) => field?.trim() === "")) {
        throw new Error("All fields are required");
      }

      const user = await UserModel.findOne({ email });

      if (!user) {
        throw new Error("Invalid Credentials - email");
      }

      const isValidPassword = await user.validatePassword(password);

      if (!isValidPassword) {
        throw new Error("Invalid Credentials - password");
      }

      const token = await user.getJWT();

      // Save that in cookie
      res.cookie(authConfig.cookie.name, token, {
        expires: new Date(
          Date.now() + authConfig.cookie.expiresInHours * 3600000
        ),
        httpOnly: authConfig.cookie.httpOnly,
        secure: authConfig.cookie.secure,
      });

      res.send(user);
    } catch (error: any) {
      res
        .status(400)
        .send("Unable to logged in the user :: ERROR : " + error.message);
    }
  }
);

// * 'Logout'
authRouter.post(
  "/logout",
  authenticateUser, //Check whether the user is logged in or not
  (req: Request, res: Response, next: NextFunction) => {
    // Remove the cookies
    try {
      res.cookie(authConfig.cookie.name, null, {
        expires: new Date(Date.now()),
      });
      res.send("Logout successfully");
    } catch (error: any) {
      res
        .status(500)
        .send("Unable to Logout the user :: ERROR : " + error.message);
    }
  }
);

export default authRouter;
