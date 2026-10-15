import type { UploadApiErrorResponse, UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

export type CloudinaryImageResult = {
  secure_url: string;
  public_id: string;
};

export const uploadImage = async (
  fileBuffer: Buffer
): Promise<CloudinaryImageResult> => {
  return await new Promise<CloudinaryImageResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "haha/products",
        transformation: [
          {
            width: 1200,
            height: 1500,
            crop: "fill",
            gravity: "auto",
            quality: "auto",
          },
        ],
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result?.secure_url || !result.public_id) {
          reject(new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    uploadStream.end(fileBuffer);
  });
};

export const deleteImage = async (publicId?: string | null): Promise<void> => {
  if (!publicId) {
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "not found") {
      return;
    }
  } catch {
    return;
  }
};
