import sgMail from "@sendgrid/mail";
import { env } from "./env";
import { logError } from "../utils/logError";

sgMail.setApiKey(env.SENDGRID_API_KEY);

const getFrom = (): { email: string; name?: string } => {
  const name = env.EMAIL_FROM_NAME;
  return name ? { email: env.SENDGRID_FROM_EMAIL, name } : { email: env.SENDGRID_FROM_EMAIL };
};

const emailLayout = (name: string, message: string): string => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f2">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">
          <tr>
            <td align="center" style="padding-bottom:20px;font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;letter-spacing:1px;color:#315b50">
              My Store
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border:1px solid #989890;border-top:4px solid #40927c;border-radius:12px;padding:40px 32px;font-family:'Cormorant Garamond',Georgia,serif;font-size:18px;line-height:1.6;color:#262626">
              <h1 style="margin:0 0 16px;font-size:30px;font-weight:500;text-align:center;color:#262626">Hello ${escapeHtml(name)}</h1>
              ${message}
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6b6b6b">
              © ${new Date().getFullYear()} Our Store. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

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

  const html = emailLayout(
  "there",
  `<p style="text-align:center">Your password reset code is:</p>
   <p style="margin:16px 0;padding:16px;text-align:center;background:#f4f4f2;border:1px solid #315b50;border-radius:8px;font-family:'Cormorant Garamond',monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#315b50">${escapeHtml(otp)}</p>
   <p style="text-align:center;font-size:15px;color:#6b6b6b">This code expires in 10 minutes. Didn't request this? You can safely ignore this email.</p>`
);

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

  const html = emailLayout(
    "there",
    `<p style="text-align:center;margin:0 0 20px">Your password was changed successfully.</p>
     <div style="padding:14px 16px;background:#fdf3f2;border:1px solid #eaeae6f0;border-radius:8px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#8a2f28">
       If you did not make this change, reset your password immediately and contact support.
     </div>`
  );

  await safeSend({
    to,
    subject: "Your password was changed",
    text,
    html,
  });
};
