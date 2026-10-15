import type { Request, Response } from "express";
import Product from "../models/Product";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import { deleteImage, uploadImage } from "../utils/cloudinaryUpload";
import type { z } from "zod";
import {
  createProductSchema,
  updateProductSchema,
} from "../validators/storeValidators";

type CreateProductBody = z.infer<typeof createProductSchema>;
type UpdateProductBody = z.infer<typeof updateProductSchema>;

const parseMultipartProductBody = (body: unknown): Record<string, unknown> => {
  if (!body || typeof body !== "object") {
    return {};
  }

  const value = body as Record<string, unknown>;

  const parseStringArray = (field: unknown): string[] => {
    if (Array.isArray(field)) {
      return field
        .flatMap((entry) => {
          if (typeof entry !== "string") {
            return [];
          }

          return entry
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        })
        .filter(Boolean);
    }

    if (typeof field === "string") {
      return field
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  return {
    name: typeof value.name === "string" ? value.name : "",
    description: typeof value.description === "string" ? value.description : "",
    category: typeof value.category === "string" ? value.category : "",
    price:
      typeof value.price === "string"
        ? Number(value.price)
        : typeof value.price === "number"
          ? value.price
          : NaN,
    quantity:
      typeof value.quantity === "string"
        ? Number(value.quantity)
        : typeof value.quantity === "number"
          ? value.quantity
          : 0,
    image: typeof value.image === "string" ? value.image : undefined,
    options: parseStringArray(value.options),
  };
};

const getValidationErrorMessage = (error: z.ZodError): string => {
  const firstIssue = error.issues[0];
  return firstIssue ? firstIssue.message : "Invalid product data";
};

export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const parsedBody = parseMultipartProductBody(req.body);
  const validation = createProductSchema.safeParse(parsedBody);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: getValidationErrorMessage(validation.error),
    });
    return;
  }

  if (!req.file) {
    res.status(400).json({
      success: false,
      message: "Product image is required",
    });
    return;
  }

  const { name, description, category, price, quantity, options } = validation.data;

  try {
    const uploadedImage = await uploadImage(req.file.buffer);

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      price,
      quantity: quantity ?? 0,
      image: uploadedImage.secure_url,
      imagePublicId: uploadedImage.public_id,
      options,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Failed to create product:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating product",
    });
  }
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const category = req.query.category;
  if (category !== undefined && (typeof category !== "string" || !category.trim())) {
    res.status(400).json({
      success: false,
      message: "Category must be a non-empty string",
    });
    return;
  }

  try {
    const products = await Product.find(
      category === undefined ? {} : { category: category.trim() }
    ).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
};

export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
    return;
  }

  try {
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Failed to fetch product:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching product",
    });
  }
};

export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
    return;
  }

  const parsedBody = parseMultipartProductBody(req.body);
  const validation = updateProductSchema.safeParse(parsedBody);

  if (!validation.success) {
    res.status(400).json({
      success: false,
      message: getValidationErrorMessage(validation.error),
    });
    return;
  }

  const updates: {
    name?: string;
    description?: string;
    category?: string;
    price?: number;
    quantity?: number;
    image?: string;
    imagePublicId?: string | null;
    options?: string[];
  } = {};

  if (validation.data.name !== undefined) updates.name = validation.data.name;
  if (validation.data.description !== undefined) updates.description = validation.data.description;
  if (validation.data.category !== undefined) updates.category = validation.data.category;
  if (validation.data.price !== undefined) updates.price = validation.data.price;
  if (validation.data.quantity !== undefined) updates.quantity = validation.data.quantity;
  if (validation.data.options !== undefined) updates.options = validation.data.options;

  let uploadedImage: { secure_url: string; public_id: string } | undefined;

  try {
    const existingProduct = await Product.findById(id);

    if (!existingProduct) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (req.file) {
      uploadedImage = await uploadImage(req.file.buffer);
      updates.image = uploadedImage.secure_url;
      updates.imagePublicId = uploadedImage.public_id;
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      if (uploadedImage) {
        await deleteImage(uploadedImage.public_id);
      }

      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    if (uploadedImage && existingProduct.imagePublicId) {
      await deleteImage(existingProduct.imagePublicId);
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (uploadedImage) {
      await deleteImage(uploadedImage.public_id);
    }

    console.error("Failed to update product:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating product",
    });
  }
};

export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id as string;

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID",
    });
    return;
  }

  try {
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    await Product.findByIdAndDelete(id);

    if (product.imagePublicId) {
      await deleteImage(product.imagePublicId);
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete product:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting product",
    });
  }
};