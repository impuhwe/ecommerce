import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type AccessTokenPayload = {
  id: string;
  role: "admin" | "user";
  tokenVersion: number;
};

const isRole = (value: unknown): value is "admin" | "user" => {
  return value === "admin" || value === "user";
};

export const signAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(
    payload,
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
    }
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (
    typeof decoded === "string" ||
    typeof decoded.id !== "string" ||
    !isRole(decoded.role) ||
    typeof decoded.tokenVersion !== "number"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    id: decoded.id,
    role: decoded.role,
    tokenVersion: decoded.tokenVersion,
  };
};
