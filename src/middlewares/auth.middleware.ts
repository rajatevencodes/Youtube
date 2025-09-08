import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/authConfig";
import UserModel from "../models/user.model";

/**
 * Extend Express Request type to include user property
 * If this is not included req.user is not being recognised by typescript
 */

declare global {
  namespace Express {
    interface Request {
      user?: any; // Change `any` to a proper user type if available
    }
  }
}

const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check whether the user have token or not
    const cookieName = authConfig.cookie.name;

    // Extract token from cookies
    const token = req.cookies[cookieName];

    if (!token) {
      throw new Error("Authentication required pls login");
    }

    // Verify Token
    const decodedPayload = jwt.verify(
      token,
      authConfig.jwt.secretKey
    ) as jwt.JwtPayload;

    const user = await UserModel.findById(decodedPayload._id);

    if (!user) {
      throw new Error("User Account Not Found. Pls Register");
    }

    req.user = user;

    next();
  } catch (error: any) {
    console.error("Authentication Error:", error.message);

    // Handle Specific JWT Errors
    const errorMessage =
      error.name === "JsonWebTokenError"
        ? "Invalid authentication token"
        : error.name === "TokenExpiredError"
        ? "Session expired. Please log in again."
        : "Authentication failed. Please try again.";

    res.status(401).json({
      success: false,
      message: errorMessage,
    });
    return;
  }
};

export default authenticateUser;
