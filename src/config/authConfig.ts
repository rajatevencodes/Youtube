import { AuthConfig } from "../types/authConfig";

export const authConfig: AuthConfig = {
  jwt: {
    secretKey: process.env.JWT_SECRET_TOKEN as string,
    expiresIn: "8h",
  },
  cookie: {
    name: "yt-Token", // Cookie name
    expiresInHours: 8, // Cookie expiration time in hours
    httpOnly: true, // Cookie accessibility
    secure: process.env.NODE_ENV === "production", // Secure cookie in production
  },
};
