import type { Response } from "express";
import mongoose from "mongoose";
import Cart from "../models/Cart";
import Order, { type IOrder, type IOrderItem } from "../models/Order";
import Product from "../models/Product";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import type { z } from "zod";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../validators/storeValidators";

type CreateOrderBody = z.infer<typeof createOrderSchema>;
type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusSchema>;

const getCustomerId = (req: AuthenticatedRequest, res: Response): string | null => {
  const id = req.user?.id;
  if (!id) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return null;
  }
  return id;
};

export const createOrder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = getCustomerId(req, res);
  if (!userId) return;
  const delivery = req.body as CreateOrderBody;
  let session: mongoose.ClientSession | undefined;

  try {
    session = await mongoose.startSession();
    let createdOrder: IOrder | null = null;
    await session.withTransaction(async () => {
      let cart = await Cart.findOne({ userId }).session(session);
      if (!cart) {
        [cart] = await Cart.create([{ userId, items: [] }], { session });
      }
      if (!cart || cart.items.length === 0) {
        throw new Error("CART_EMPTY");
      }

      const products = await Product.find({
        _id: { $in: cart.items.map((item) => item.productId) },
      }).session(session);
      const productsById = new Map(products.map((product) => [product.id, product]));
      const items: IOrderItem[] = [];

      for (const cartItem of cart.items) {
        const product = productsById.get(cartItem.productId.toString());
        if (!product) throw new Error("CART_PRODUCT_MISSING");
        if (
          product.options.length === 0
            ? cartItem.option !== ""
            : !product.options.includes(cartItem.option)
        ) {
          throw new Error("CART_OPTION_INVALID");
        }
        items.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          option: cartItem.option,
          quantity: cartItem.quantity,
        });
      }

      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const [order] = await Order.create(
        [
          {
            userId,
            items,
            delivery,
            total,
            status: "Pending",
          },
        ],
        { session }
      );
      cart.items.splice(0, cart.items.length);
      await cart.save({ session });
      createdOrder = order;
    });

    if (!createdOrder) {
      throw new Error("Order transaction completed without an order");
    }
    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CART_EMPTY") {
      res.status(400).json({ success: false, message: "Your cart is empty" });
      return;
    }
    if (error instanceof Error && error.message === "CART_PRODUCT_MISSING") {
      res.status(409).json({
        success: false,
        message: "A product in your cart is no longer available",
      });
      return;
    }
    if (error instanceof Error && error.message === "CART_OPTION_INVALID") {
      res.status(409).json({
        success: false,
        message: "A product option in your cart is no longer available",
      });
      return;
    }
    console.error("Failed to place order:", error);
    res.status(500).json({ success: false, message: "Server error while placing order" });
  } finally {
    if (session) await session.endSession();
  }
};

export const getMyOrders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const userId = getCustomerId(req, res);
  if (!userId) return;
  try {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    res.status(500).json({ success: false, message: "Server error while fetching orders" });
  }
};

export const getAllOrders = async (
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    res.status(500).json({ success: false, message: "Server error while fetching orders" });
  }
};

export const getOrderById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({ success: false, message: "Invalid order ID" });
    return;
  }
  try {
    const order = await Order.findById(id).populate("userId", "name email");
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Failed to fetch order:", error);
    res.status(500).json({ success: false, message: "Server error while fetching order" });
  }
};

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const id = req.params.id;
  if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({ success: false, message: "Invalid order ID" });
    return;
  }
  const { status } = req.body as UpdateOrderStatusBody;
  try {
    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!order) {
      res.status(404).json({ success: false, message: "Order not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Order status updated", order });
  } catch (error) {
    console.error("Failed to update order status:", error);
    res.status(500).json({ success: false, message: "Server error while updating order" });
  }
};
