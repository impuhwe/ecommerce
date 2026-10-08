import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

export const validate =
  (schema: z.ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid request body",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.length > 0 ? issue.path.map(String).join(".") : "body",
          message: issue.message,
        })),
      });
      return;
    }

    req.body = parsed.data;
    next();
  };
