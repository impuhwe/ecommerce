import mongoose from "mongoose";
import { env } from "./env";
import { logError } from "../utils/logError";

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (error) {
    logError("mongodb", error);
    process.exit(1);
  }
};

export default connectDB;
