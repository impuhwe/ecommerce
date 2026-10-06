import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const adminOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin only",
    });
    return;
  }
  next();
};