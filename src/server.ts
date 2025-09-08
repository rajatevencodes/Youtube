import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";

dotenv.config(); // It is accessible throughout the routes

import connectDB from "./db/connectDB";
import authRouter from "./routes/authRoutes";
import userRouter from "./routes/userRoutes";
import videoRouter from "./routes/videoRoutes";
import tweetRouter from "./routes/tweetRoutes";
import commentRouter from "./routes/commentRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    // This is required to set the cookies on the client side, and ensure that {withCredentials: true} is added to axios requests.
    credentials: true,
  })
);

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/comments", commentRouter);

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ MONGODB connection FAILED:", error);
    process.exit(1);
  });
