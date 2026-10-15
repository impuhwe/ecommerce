import type { Response } from "express";
import mongoose from "mongoose";
import Cart, { type ICart } from "../models/Cart";
import Product from "../models/Product";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import type { z } from "zod";
import {
  addCartItemSchema,
  updateCartItemSchema,
} from "../validators/storeValidators";

type AddCartItemBody = z.infer<typeof addCartItemSchema>;
type UpdateCartItemBody = z.infer<typeof updateCartItemSchema>;

type CartResponseItem = {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    image?: string;
    options: string[];
  };
  option: string;
  quantity: number;
  lineTotal: number;
};

const getCart = async (userId: string): Promise<ICart> => {
  const cart = await Cart.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, items: [] } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return cart;
};

const getCartItems = async (cart: ICart): Promise<CartResponseItem[] | null> => {
  const products = await Product.find({
    _id: { $in: cart.items.map((item) => item.productId) },
  });
  const productsById = new Map(products.map((product) => [product.id, product]));
  const items: CartResponseItem[] = [];

  for (const item of cart.items) {
    const product = productsById.get(item.productId.toString());
    if (!product) return null;
    items.push({
      id: item._id.toString(),
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        price: product.price,
        image: product.image,
        options: product.options,
      },
      option: item.option,
      quantity: item.quantity,
      lineTotal: item.quantity * product.price,
    });
  }
  return items;
};

const getCustomerId = (req: AuthenticatedRequest, res: Response): string | null => {
  const id = req.user?.id;
  if (!id) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return null;
  }
  return id;
};

const isValidOption = (options: string[], option: string): boolean =>
  options.length === 0 ? option === "" : options.includes(option);

export const getMyCart = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = getCustomerId(req, res);
  if (!userId) return;

  try {
    const cart = await getCart(userId);
    const items = await getCartItems(cart);
    if (!items) {
      res.status(409).json({
        success: false,
        message: "A product in your cart is no longer available",
      });
      return;
    }
    res.status(200).json({ success: true, cart: { id: cart.id, items } });
  } catch (error) {
    console.error("Failed to fetch cart:", error);
    res.status(500).json({ success: false, message: "Server error while fetching cart" });
  }
};

export const addCartItem = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = getCustomerId(req, res);
  if (!userId) return;
  const { productId, option, quantity } = req.body as AddCartItemBody;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: "Product not found" });
      return;
    }
    if (!isValidOption(product.options, option)) {
      res.status(400).json({ success: false, message: "Invalid product option" });
      return;
    }

    const cart = await getCart(userId);
    const existing = cart.items.find(
      (item) => item.productId.toString() === product.id && item.option === option
    );
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({
        _id: new mongoose.Types.ObjectId(),
        productId: product._id,
        option,
        quantity,
      });
    }
    await cart.save();

    const items = await getCartItems(cart);
    if (!items) {
      res.status(409).json({
        success: false,
        message: "A product in your cart is no longer available",
      });
      return;
    }
    res.status(201).json({ success: true, cart: { id: cart.id, items } });
  } catch (error) {
    console.error("Failed to add cart item:", error);
    res.status(500).json({ success: false, message: "Server error while updating cart" });
  }
};

export const updateCartItem = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = getCustomerId(req, res);
  if (!userId) return;
  const itemId = req.params.id;
  if (!itemId || !/^[0-9a-fA-F]{24}$/.test(itemId)) {
    res.status(400).json({ success: false, message: "Invalid cart item ID" });
    return;
  }
  const { quantity } = req.body as UpdateCartItemBody;

  try {
    const cart = await Cart.findOne({ userId });
    const item = cart?.items.find((cartItem) => cartItem._id.toString() === itemId);
    if (!cart || !item) {
      res.status(404).json({ success: false, message: "Cart item not found" });
      return;
    }
    item.quantity = quantity;
    await cart.save();
    const items = await getCartItems(cart);
    if (!items) {
      res.status(409).json({
        success: false,
        message: "A product in your cart is no longer available",
      });
      return;
    }
    res.status(200).json({ success: true, cart: { id: cart.id, items } });
  } catch (error) {
    console.error("Failed to update cart item:", error);
    res.status(500).json({ success: false, message: "Server error while updating cart" });
  }
};

export const removeCartItem = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = getCustomerId(req, res);
  if (!userId) return;
  const itemId = req.params.id;
  if (!itemId || !/^[0-9a-fA-F]{24}$/.test(itemId)) {
    res.status(400).json({ success: false, message: "Invalid cart item ID" });
    return;
  }

  try {
    const cart = await Cart.findOne({ userId });
    const index = cart?.items.findIndex(
      (cartItem) => cartItem._id.toString() === itemId
    ) ?? -1;
    if (!cart || index < 0) {
      res.status(404).json({ success: false, message: "Cart item not found" });
      return;
    }
    cart.items.splice(index, 1);
    await cart.save();
    const items = await getCartItems(cart);
    if (!items) {
      res.status(409).json({
        success: false,
        message: "A product in your cart is no longer available",
      });
      return;
    }
    res.status(200).json({ success: true, cart: { id: cart.id, items } });
  } catch (error) {
    console.error("Failed to remove cart item:", error);
    res.status(500).json({ success: false, message: "Server error while updating cart" });
  }
};
