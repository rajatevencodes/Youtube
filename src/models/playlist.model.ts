import mongoose, { Schema, Document } from "mongoose";

export interface IPlaylist extends Document {
  name: string;
  description?: string;
  videos: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const PlaylistSchema = new Schema<IPlaylist>(
  {
    name: {
      type: String,
      required: [true, "Playlist name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

PlaylistSchema.index({ name: 1 });

const PlaylistModel = mongoose.model<IPlaylist>("Playlist", PlaylistSchema);
export default PlaylistModel;
