import { z } from "zod";

const productFields = {
  name: z.string().trim().min(1),
  description: z.string().trim(),
  category: z.string().trim().min(1),
  price: z.number().finite().min(0),
  quantity: z.number().int().min(0).optional(),
  image: z.string().trim().optional(),
  options: z.array(z.string().trim().min(1)).default([]),
};

export const createProductSchema = z.object({
  ...productFields,
  description: productFields.description.min(1),
});

export const updateProductSchema = z
  .object(productFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Provide at least one field to update");

export const addCartItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid product ID"),
  option: z.string().trim().default(""),
  quantity: z.number().int().positive(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  street: z.string().trim().min(1),
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["Pending", "Completed"]),
});
