# 🎥 YouTube Backend API

A robust, scalable backend API for a YouTube-like platform built with Node.js, Express, TypeScript, and MongoDB. Features advanced cloud storage integration, advance aggregation pipelines, and comprehensive user management.

Your API will be running at `http://localhost:3000`

## Testing Video with Postman

[![Testing Video with Postman](https://ik.imagekit.io/5wegcvcxp/Resume-Youtube/thumbnail.png)](https://photos.app.goo.gl/NtSF6xSZgw6FwVdo6)

> **🎬 Demo Video**: Click the thumbnail above to watch the API testing demonstration with Postman

## Entity Relationship Diagram

![Entity Relationship Diagram](https://ik.imagekit.io/5wegcvcxp/Resume-Youtube/Entity-Relationship.png)

### Tech Stack

- **Backend**: Node.js, Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with secure cookies
- **File Storage**: Cloudinary for media management
- **Containerization**: Docker & Docker Compose

### ✨ Key Features

### 🔐 **Advanced Authentication**

- JWT-based authentication with secure cookie management
- Password hashing with bcrypt
- Protected routes with middleware

### ☁️ **Cloudinary Integration**

- **Avatar & Cover Image Upload**: Seamless image upload and optimization
- **Video & Thumbnail Storage**: High-performance media storage with automatic optimization
- **Smart Image Management**: Automatic deletion of old images when updating profiles

### 🗄️ **Advanced MongoDB Aggregation Pipelines**

- **Aggregation Pipelines**: Complex data relationships and analytics
- **Watch History**: Sophisticated user behavior tracking
- **Channel Analytics**: Real-time subscriber counts and engagement metrics
- **Optimized Queries**: Efficient data retrieval with proper indexing

## 📚 API Documentation

### Authentication Routes

```yaml
POST /api/v1/auth/register    - User registration with avatar upload
POST /api/v1/auth/login       - User login
POST /api/v1/auth/logout      - User logout
```

### User Management

```yaml
GET  /api/v1/users/me/profile/view           - Get current user profile
DELETE /api/v1/users/me/profile/deleteAccount - Delete user account
PATCH /api/v1/users/me/profile/edit/avatar    - Update avatar
PATCH /api/v1/users/me/profile/edit/coverImage - Update cover image
PATCH /api/v1/users/me/profile/edit/password  - Change password
GET  /api/v1/users/me/history                - Get watch history
GET  /api/v1/users/:username                 - View user profile
```

### Video Operations

```yaml
POST   /api/v1/videos/upload           - Upload video with thumbnail
GET    /api/v1/videos                  - Get all videos
GET    /api/v1/videos/view/:videoId    - Get video details
DELETE /api/v1/videos/delete/:videoId  - Delete video
PATCH  /api/v1/videos/edit/:videoId    - Update video
```

### Social Features

```yaml
POST   /api/v1/tweets/upload           - Create tweet
GET    /api/v1/tweets                  - Get all tweets
DELETE /api/v1/tweets/delete/:tweetId  - Delete tweet
PATCH  /api/v1/tweets/edit/:tweetId    - Edit tweet

POST   /api/v1/videos/:videoId/comment - Add comment
PATCH  /api/v1/comments/edit/:commentId - Edit comment
DELETE /api/v1/comments/delete/:commentId - Delete comment

POST   /api/v1/videos/:videoId/toggle/like    - Toggle video like
POST   /api/v1/tweets/:tweetId/toggle/like    - Toggle tweet like
POST   /api/v1/comments/:commentId/toggle/like - Toggle comment like
```

## 🚀 Quick Start

```bash
# Clone the repository
git clone <your-repo-url>
cd YT_Backend-main

# Start with Docker
docker-compose up --build
```

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# MongoDB Configuration
MONGO_URI=your-mongodb-connection-string

# JWT Configuration
JWT_SECRET_TOKEN=your-super-secret-jwt-token

# Cloudinary Configuration
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```
