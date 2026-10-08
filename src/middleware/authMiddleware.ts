import type { Request, Response, NextFunction } from "express";
import User from "../models/User";
import { verifyAccessToken } from "../utils/jwt";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: "admin" | "user";
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "user";
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Missing or invalid token",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Missing token",
    });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    const user = await User.findById(decoded.id).select("tokenVersion role");

    if (!user || (user.tokenVersion ?? 0) !== decoded.tokenVersion) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
      return;
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};
