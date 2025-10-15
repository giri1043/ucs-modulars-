import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Using environment variables for database connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ucs_modular";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't exit the process, allow the application to continue with limited functionality
    return false;
  }
};

export default connectDB;
