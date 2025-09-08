import mongoose, { Schema, Document, Mongoose } from "mongoose";

export interface IVideo extends Document {
  videoSrc: string;
  thumbnail: string;
  owner: mongoose.Types.ObjectId; // Ref to user
  title: string;
  description: string;
  duration: string;
  views: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    videoSrc: {
      type: String,
      required: [true, "Video Src is required"],
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    duration: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
      min: [0, "Views cannot be negative"],
    },
  },
  { timestamps: true }
);

const VideoModel = mongoose.model<IVideo>("Video", VideoSchema);
export default VideoModel;
