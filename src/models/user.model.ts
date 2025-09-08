import mongoose, { Document, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { authConfig } from "../config/authConfig";

export interface IUser extends Document {
  username: string;
  email: string;
  isPremium: boolean;
  avatar?: string;
  coverImage?: string;
  password: string;
  watchHistory: mongoose.Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
  getJWT: () => Promise<string>; // will return a JWT token
  validatePassword: (passwordInputByUser: string) => Promise<boolean>; //will confirm the password while logging in
}

// User schema
const UserSchema: Schema<IUser> = new Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      unique: true,
      lowercase: true, // Automatically converts to lowercase
      match: [
        /^[a-z0-9]+$/,
        "Username can only contain lowercase letters and numbers",
      ], // Validation
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      unique: true,
      lowercase: true,
      match: [/.+\@.+\..+/, "Please use a valid email address"],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default:
        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Unknown_person.jpg/1200px-Unknown_person.jpg",
    },
    coverImage: {
      type: String,
      default:
        "https://wallpapers.com/images/featured/plain-blue-dmlktw5iuzdjvb7j.jpg",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);

UserSchema.methods.getJWT = async function (): Promise<string> {
  try {
    const user = this;
    const token = await jwt.sign(
      { _id: user._id }, //Payload
      authConfig.jwt.secretKey, //Secret
      { expiresIn: authConfig.jwt.expiresIn } as jwt.SignOptions
    );
    return token;
  } catch (error: any) {
    throw new Error("Error while creating JWT Token : " + error);
  }
};

UserSchema.methods.validatePassword = async function (
  passwordInputByUser: string
): Promise<boolean> {
  try {
    const user = this;
    const hashedPassword = user.password;

    const isPasswordValid = await bcrypt.compare(
      passwordInputByUser,
      hashedPassword
    );

    return isPasswordValid;
  } catch (error: any) {
    throw new Error("Error while validating Password : " + error);
  }
};

const UserModel = mongoose.model<IUser>("User", UserSchema);
export default UserModel;
