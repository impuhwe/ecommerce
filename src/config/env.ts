import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive(),
  MONGO_URI: z.string().min(1),
  SENDGRID_API_KEY: z.string().trim().startsWith("SG."),
  SENDGRID_FROM_EMAIL: z.string().trim().min(1),
  OTP_SECRET: z.string().min(32),
  PUBLIC_API_URL: z.string().trim().min(1),
  CORS_ORIGINS: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    )
    .pipe(z.array(z.string()).min(1)),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES_IN: z.string().default("1d"),
  EMAIL_FROM_NAME: z.string().optional(),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI ?? process.env.MONGODB_URI,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL ?? process.env.EMAIL_FROM,
  OTP_SECRET: process.env.OTP_SECRET,
  PUBLIC_API_URL: process.env.PUBLIC_API_URL,
  CORS_ORIGINS: process.env.CORS_ORIGINS,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
});

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    const field = issue.path.length > 0 ? issue.path.map(String).join(".") : "env";
    console.error(`- ${field}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
