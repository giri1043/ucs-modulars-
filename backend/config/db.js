import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const uri = "mongodb+srv://ucsmodulars:umapathy@123@clusterucs.tavakjc.mongodb.net/?retryWrites=true&w=majority&appName=Clusterucs";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(uri, {
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
