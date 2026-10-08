import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { env } from "../config/env";

export const generateOtp = (): string => {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
};

export const hashOtp = (userId: string, otp: string): string => {
  return createHmac("sha256", env.OTP_SECRET).update(`${userId}:${otp}`).digest("hex");
};

export const otpHashesEqual = (a: string, b: string): boolean => {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
};
