import sgMail from "@sendgrid/mail";
import { env } from "./env";
import { logError } from "../utils/logError";

sgMail.setApiKey(env.SENDGRID_API_KEY);

const getFrom = (): { email: string; name?: string } => {
  const name = env.EMAIL_FROM_NAME;
  return name ? { email: env.SENDGRID_FROM_EMAIL, name } : { email: env.SENDGRID_FROM_EMAIL };
};

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

const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    await sgMail.send({
      to,
      from: getFrom(),
      subject,
      html,
    });
  } catch (error) {
    logError("sendgrid", error);
    throw error;
  }
};

const safeSend = async (params: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> => {
  try {
    await sgMail.send({
      to: params.to,
      from: getFrom(),
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
  } catch (error) {
    logError("sendgrid", error);
  }
};

export const sendWelcomeEmail = async (name: string, email: string): Promise<void> => {
  await sendEmail(
    email,
    "Welcome to our store",
    emailLayout(name, "<p>Welcome. Your account is ready to use.</p>")
  );
};

export const sendVerificationEmail = async (
  name: string,
  email: string,
  verificationUrl: string
): Promise<void> => {
  await sendEmail(
    email,
    "Verify your email address",
    emailLayout(
      name,
      `<p>Please verify your email address to confirm your account.</p><p><a href="${escapeHtml(verificationUrl)}" style="color:#315b50">Verify email</a></p><p>This link expires in 24 hours.</p>`
    )
  );
};

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  const text = [
    `Your password reset code is ${otp}.`,
    "This code expires in 10 minutes.",
    "Didn't request this? You can safely ignore this email.",
  ].join("\n");

  const html = `
    <div style="max-width:560px;margin:32px auto;padding:24px;font-family:Arial,sans-serif;color:#262626;line-height:1.6">
      <p>Your password reset code is:</p>
      <p style="font-size:28px;letter-spacing:6px;font-weight:bold">${escapeHtml(otp)}</p>
      <p>This code expires in 10 minutes.</p>
      <p>Didn't request this? You can safely ignore this email.</p>
    </div>`;

  await safeSend({
    to,
    subject: "Your password reset code",
    text,
    html,
  });
};

export const sendPasswordChangedEmail = async (to: string): Promise<void> => {
  const text = [
    "Your password was changed.",
    "If you did not make this change, reset your password immediately and contact support.",
  ].join("\n");

  const html = `
    <div style="max-width:560px;margin:32px auto;padding:24px;font-family:Arial,sans-serif;color:#262626;line-height:1.6">
      <p>Your password was changed.</p>
      <p>If you did not make this change, reset your password immediately and contact support.</p>
    </div>`;

  await safeSend({
    to,
    subject: "Your password was changed",
    text,
    html,
  });
};
