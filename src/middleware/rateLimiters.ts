import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";

const tooManyRequests = (_req: Request, res: Response): void => {
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later",
  });
};

const clientIp = (req: Request): string => ipKeyGenerator(req.ip ?? "127.0.0.1");

export const forgotPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => clientIp(req),
  handler: tooManyRequests,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  keyGenerator: (req) => {
    const email = req.body?.email;
    if (typeof email === "string" && email.length > 0) {
      return email;
    }
    return clientIp(req);
  },
  handler: tooManyRequests,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const resetPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => clientIp(req),
  handler: tooManyRequests,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
