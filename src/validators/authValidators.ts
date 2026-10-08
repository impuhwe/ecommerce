import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z
    .string()
    .min(8)
    .max(72)
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export type ForgotPasswordBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordBody = z.infer<typeof resetPasswordSchema>;
