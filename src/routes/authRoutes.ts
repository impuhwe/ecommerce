import { Router, Request, Response } from "express";
import {
  register,
  login,
  verifyEmail,
} from "../controllers/authController";

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Alex Morgan }
 *               email: { type: string, format: email, example: alex@example.com }
 *               password: { type: string, format: password, minLength: 6, example: secret123 }
 *     responses:
 *       201: { description: User registered }
 *       400: { description: Invalid request }
 *       409: { description: Email already registered }
 */
router.post("/register", register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Log in and receive a JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: alex@example.com }
 *               password: { type: string, format: password, example: secret123 }
 *     responses:
 *       200: { description: Login successful; response contains token }
 *       401: { description: Invalid credentials }
 */
router.post("/login", login);

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify an email address
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Email verified }
 *       400: { description: Invalid, expired, or missing token }
 *       409: { description: Email already verified }
 */
router.get("/verify-email", verifyEmail);

export default router;