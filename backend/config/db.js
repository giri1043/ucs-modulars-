import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Using environment variables for database connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://ucsmodulars:umapathy%40123@clusterucs.tavakjc.mongodb.net/?retryWrites=true&w=majority&appName=Clusterucs";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
