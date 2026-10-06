import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";

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

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    if (typeof decoded === "string" || !decoded.id || !decoded.role) {
      res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
      return;
    }

    req.user = {
      id: decoded.id as string,
      role: decoded.role as "admin" | "user",
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};