import mongoose, { Schema, Document } from "mongoose";

export interface ILike extends Document {
  isLiked: boolean;
  likedBy: mongoose.Types.ObjectId;
  comment?: mongoose.Types.ObjectId;
  video?: mongoose.Types.ObjectId;
  tweet?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const LikeSchema = new Schema<ILike>(
  {
    isLiked: {
      type: Boolean,
      default: false,
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Added index for performance
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment",
      index: true,
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      index: true,
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
      index: true,
    },
  },
  { timestamps: true }
);

const LikeModel = mongoose.model<ILike>("Like", LikeSchema);
export default LikeModel;
