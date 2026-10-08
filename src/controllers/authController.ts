import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { sendVerificationEmail, sendWelcomeEmail } from "../config/email";
import { signAccessToken } from "../utils/jwt";
import { logError } from "../utils/logError";
import {
  completePasswordReset,
  requestPasswordReset,
} from "../services/passwordResetService";
import type { ForgotPasswordBody, ResetPasswordBody } from "../validators/authValidators";

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

    emailResults.forEach((result, index) => {
      if (result.status === "rejected") {
        const label = index === 0 ? "welcome" : "verification";
        console.error(`Failed to send ${label} email:`, result.reason);
      }
    });

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

export const forgotPassword = (req: Request, res: Response): void => {
  const { email } = req.body as ForgotPasswordBody;

  res.status(200).json({
    success: true,
    message: "If an account exists, a code has been sent",
  });

  void requestPasswordReset(email).catch((err: unknown) => {
    logError("forgot-password", err);
  });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body as ResetPasswordBody;

  try {
    const reset = await completePasswordReset(email, otp, newPassword);
    if (!reset) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired code",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (err) {
    logError("reset-password", err);
    res.status(400).json({
      success: false,
      message: "Invalid or expired code",
    });
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

    const token = signAccessToken({
      id: user.id,
      role: user.role,
      tokenVersion: user.tokenVersion ?? 0,
    });

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