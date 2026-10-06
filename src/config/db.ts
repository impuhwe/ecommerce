import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce_db";

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

export default connectDB;