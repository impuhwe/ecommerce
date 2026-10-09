import { Request, Response, NextFunction } from "express";
import Product from "../models/Product";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const { name, category, price, quantity } = req.body;

  if (!name || !category || price === undefined || quantity === undefined) {
    res.status(400).json({
      success: false,
      message: "All fields are required",
    });
    return;
  }

  if (price < 0) {
    res.status(400).json({
      success: false,
      message: "Price must be greater than or equal to 0",
    });
    return;
  }

  if (quantity < 0) {
    res.status(400).json({
      success: false,
      message: "Quantity must be greater than or equal to 0",
    });
    return;
  }

  try {
    const product = new Product({
      name: name.trim(),
      category: category.trim(),
      price,
      quantity,
      image: req.body.image,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while creating product",
    });
  }
};

export const getProducts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while fetching products",
    });
  }
};

export const getProductById = async (
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

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
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

  const { name, category, price, quantity } = req.body;

  try {
    const product = await Product.findByIdAndUpdate(
      id,
      {
        name: name?.trim(),
        category: category?.trim(),
        price,
        quantity,
        image: req.body.image,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
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
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error while deleting product",
    });
  }
};