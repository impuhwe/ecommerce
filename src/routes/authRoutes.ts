import { Router } from "express";
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { validate } from "../middleware/validate";
import {
  forgotPasswordEmailLimiter,
  forgotPasswordIpLimiter,
  resetPasswordIpLimiter,
} from "../middleware/rateLimiters";
import { forgotPasswordSchema, resetPasswordSchema } from "../validators/authValidators";

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
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Request a password reset OTP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alex@example.com
 *           example:
 *             email: alex@example.com
 *     responses:
 *       200:
 *         description: Generic success whether or not the account exists
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: If an account exists, a code has been sent
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Invalid request body
 *               errors:
 *                 - field: email
 *                   message: Invalid email
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Too many requests, please try again later
 */
router.post(
  "/forgot-password",
  forgotPasswordIpLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordEmailLimiter,
  forgotPassword
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset password using an emailed OTP
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: alex@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewPass123
 *           example:
 *             email: alex@example.com
 *             otp: "123456"
 *             newPassword: NewPass123
 *     responses:
 *       200:
 *         description: Password updated
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Password reset successfully
 *       400:
 *         description: Invalid or expired code, or invalid body
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Invalid or expired code
 *       429:
 *         description: Too many requests
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: Too many requests, please try again later
 */
router.post(
  "/reset-password",
  resetPasswordIpLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

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
