import mongoose from "mongoose";

type connectionObject = {
  isConnected?: number;
  connectionInstance?: string;
};

const connection: connectionObject = {};

// Mindset : void means nothing is returned.
// Here, we are using it to indicate that we don't care about the return value.
const connectDB = async (): Promise<void> => {
  // We need to check if the connection is already established before connecting to the database.
  if (connection.isConnected) {
    console.log("MongoDB already connected to the database");
    console.log(`Connected host: ${connection.connectionInstance}`);
    return;
  }

  try {
    // Attempt to connect to the database
    const db = await mongoose.connect(process.env.MONGO_URI!);
    // console.log(db); // Just to check the connection object

    // readyState is a property of the connection object that indicates the state of the connection in numeric form.
    connection.isConnected = db.connections[0].readyState;

    // Store the host information in the connection object
    connection.connectionInstance = db.connections[0].host;

    console.log("MongoDB connected successfully", connection.isConnected);
    console.log(`Connected host: ${connection.connectionInstance}`);
  } catch (error) {
    console.error("Error connecting to MongoDB", error);
    process.exit(1);
  }
};

export default connectDB;
