import mongoose, { Schema, Document } from "mongoose";

export interface ITweet extends Document {
  content: string;
  owner: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const TweetSchema = new Schema<ITweet>(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const TweetModel = mongoose.model<ITweet>("Tweet", TweetSchema);
export default TweetModel;
