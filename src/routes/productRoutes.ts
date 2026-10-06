import { Router, Request, Response } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/roleMiddleware";

const router = Router();

// Public/authenticated routes - users can view products
/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Products returned }
 *       401: { description: Missing or invalid token }
 */
router.get("/", authMiddleware, getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200: { description: Product returned }
 *       400: { description: Invalid product ID }
 *       404: { description: Product not found }
 */
router.get("/:id", authMiddleware, getProductById);

// Protected routes - admin only
/**
 * @swagger
 * /api/products:
 *   post:
 *     tags: [Products]
 *     summary: Create a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, description, price, quantity]
 *             properties:
 *               name: { type: string, example: Notebook }
 *               description: { type: string, example: Hardcover notebook }
 *               price: { type: number, minimum: 0, example: 12.5 }
 *               quantity: { type: integer, minimum: 0, example: 25 }
 *               image: { type: string, example: https://example.com/notebook.jpg }
 *     responses:
 *       201: { description: Product created }
 *       401: { description: Missing or invalid token }
 *       403: { description: Admin only }
 */
router.post("/", authMiddleware, adminOnly, createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               price: { type: number, minimum: 0 }
 *               quantity: { type: integer, minimum: 0 }
 *               image: { type: string }
 *     responses:
 *       200: { description: Product updated }
 *       400: { description: Invalid product ID }
 *       403: { description: Admin only }
 *       404: { description: Product not found }
 */
router.put("/:id", authMiddleware, adminOnly, updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete a product (admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, pattern: '^[0-9a-fA-F]{24}$' }
 *     responses:
 *       200: { description: Product deleted }
 *       403: { description: Admin only }
 *       404: { description: Product not found }
 */
router.delete("/:id", authMiddleware, adminOnly, deleteProduct);

export default router;