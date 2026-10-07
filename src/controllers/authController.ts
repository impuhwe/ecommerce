import { Request, Response, NextFunction } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail, sendWelcomeEmail } from "../config/email";

export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({
      success: false,
      message: "All fields are required",
    });
    return;
  }

  if (!email.includes("@")) {
    res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email already registered",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = randomBytes(32).toString("hex");

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      emailVerificationToken: createHash("sha256").update(verificationToken).digest("hex"),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await user.save();

    const verificationUrl = `${req.protocol}://${req.get("host")}/api/auth/verify-email?token=${verificationToken}`;
    const emailResults = await Promise.allSettled([
      sendWelcomeEmail(user.name, user.email),
      sendVerificationEmail(user.name, user.email, verificationUrl),
    ]);

    res.status(201).json({
      success: true,
      message: "User registered successfully. Please verify your email.",
      welcomeEmailSent: emailResults[0].status === "fulfilled",
      verificationEmailSent: emailResults[1].status === "fulfilled",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const token = typeof req.query.token === "string" ? req.query.token : "";
  if (!token) {
    res.status(400).json({ success: false, message: "Verification token is required" });
    return;
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ emailVerificationToken: tokenHash })
    .select("+emailVerificationToken +emailVerificationExpires");

  if (!user || !user.emailVerificationExpires || user.emailVerificationExpires <= new Date()) {
    res.status(400).json({ success: false, message: "Verification token is invalid or expired" });
    return;
  }
  if (user.emailVerified) {
    res.status(409).json({ success: false, message: "Email is already verified" });
    return;
  }

  await User.updateOne({ _id: user._id }, {
    $set: { emailVerified: true },
    $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
  });
  res.status(200).json({ success: true, message: "Email verified successfully" });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (typeof email !== "string" || !email.trim() || !email.includes("@")) {
    res.status(400).json({ success: false, message: "A valid email is required" });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      const resetToken = randomBytes(32).toString("hex");
      await User.updateOne({ _id: user._id }, {
        $set: {
          passwordResetToken: createHash("sha256").update(resetToken).digest("hex"),
          passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const frontendUrl = (process.env.FRONTEND_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      try {
        await sendPasswordResetEmail(user.name, user.email, resetUrl);
      } catch {
        await User.updateOne({ _id: user._id }, {
          $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "If an account exists for that email, a password reset link has been sent.",
    });
  } catch {
    res.status(500).json({ success: false, message: "Unable to process password reset request" });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  if (typeof token !== "string" || !token || typeof password !== "string") {
    res.status(400).json({ success: false, message: "Reset token and new password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    return;
  }

  try {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({ passwordResetToken: tokenHash })
      .select("+passwordResetToken +passwordResetExpires");

    if (!user || !user.passwordResetExpires || user.passwordResetExpires <= new Date()) {
      res.status(400).json({ success: false, message: "Reset token is invalid or expired" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await User.updateOne({
      _id: user._id,
      passwordResetToken: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }, {
      $set: { password: hashedPassword },
      $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
    });

    if (result.modifiedCount !== 1) {
      res.status(400).json({ success: false, message: "Reset token is invalid or expired" });
      return;
    }

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch {
    res.status(500).json({ success: false, message: "Unable to reset password" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
    return;
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      {
        expiresIn: (process.env.JWT_EXPIRES_IN || "1d") as NonNullable<SignOptions["expiresIn"]>,
      }
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};