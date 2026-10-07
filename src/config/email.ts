import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailLayout = (name: string, message: string): string => `
  <div style="max-width:560px;margin:32px auto;padding:24px;font-family:'Cormorant Garamond',Georgia,serif;color:#262626;line-height:1.6">
    <style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap');</style>
    <h1 style="font-weight:500">Hello ${escapeHtml(name)}</h1>
    ${message}
  </div>`;

const escapeHtml = (value: string): string => value
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

export const sendWelcomeEmail = async (name: string, email: string): Promise<void> => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Welcome to our store",
    html: emailLayout(name, "<p>Welcome. Your account is ready to use.</p>"),
  });
};

export const sendVerificationEmail = async (
  name: string,
  email: string,
  verificationUrl: string
): Promise<void> => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Verify your email address",
    html: emailLayout(name, `<p>Please verify your email address to confirm your account.</p><p><a href="${escapeHtml(verificationUrl)}" style="color:#315b50">Verify email</a></p><p>This link expires in 24 hours.</p>`),
  });
};

export const sendPasswordResetEmail = async (
  name: string,
  email: string,
  resetUrl: string
): Promise<void> => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "Reset your password",
    html: emailLayout(name, `<p>We received a request to reset your password.</p><p><a href="${escapeHtml(resetUrl)}" style="color:#315b50">Reset password</a></p><p>This link expires in one hour. If you did not request this, you can ignore this email.</p>`),
  });
};

export const verifySmtpConnection = (): Promise<boolean> => transporter.verify();

export default transporter;