import { Router } from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { authMiddleware } from "../middleware/authMiddleware";
import { adminOnly } from "../middleware/roleMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

// Product catalog is public; only mutations require authentication.
/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: List products
 *     security: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: false
 *         schema: { type: string }
 *     responses:
 *       200: { description: Products returned }
 *       401: { description: Missing or invalid token }
 */
router.get("/", getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get a product by ID
 *     security: []
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
router.get("/:id", getProductById);

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, description, category, price, image]
 *             properties:
 *               name: { type: string, example: Notebook }
 *               description: { type: string, example: Hardcover notebook }
 *               price: { type: number, minimum: 0, example: 12.5 }
 *               category: { type: string, example: Food }
 *               quantity: { type: integer, minimum: 0, example: 25 }
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG, or WebP image, up to 5 MB
 *               options: { type: array, items: { type: string }, example: [Small, Large] }
 *     responses:
 *       201: { description: Product created }
 *       401: { description: Missing or invalid token }
 *       403: { description: Admin only }
 */
router.post("/", authMiddleware, adminOnly, upload.single("image"), createProduct);

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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               price: { type: number, minimum: 0 }
 *               quantity: { type: integer, minimum: 0 }
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: JPEG, PNG, or WebP image, up to 5 MB
 *               options: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Product updated }
 *       400: { description: Invalid product ID }
 *       403: { description: Admin only }
 *       404: { description: Product not found }
 */
router.put("/:id", authMiddleware, adminOnly, upload.single("image"), updateProduct);

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