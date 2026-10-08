import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { logError } from "../utils/logError";

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: "Not found",
  });
};

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      success: false,
      message: err.message,
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
    return;
  }

  logError("unhandled", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
