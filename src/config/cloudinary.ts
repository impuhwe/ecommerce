import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const missingEnvVars = [
  !cloudName && "CLOUDINARY_CLOUD_NAME",
  !apiKey && "CLOUDINARY_API_KEY",
  !apiSecret && "CLOUDINARY_API_SECRET",
].filter((name): name is string => Boolean(name));

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error(
    `Missing required Cloudinary environment variables: ${missingEnvVars.join(", ")}. Add them to your .env file before starting the server.`
  );
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

export default cloudinary;
