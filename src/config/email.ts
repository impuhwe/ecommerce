import sgMail from "@sendgrid/mail";

const getFrom = (): { email: string; name?: string } => {
  const email = process.env.EMAIL_FROM;
  if (!email) {
    throw new Error("EMAIL_FROM is not set");
  }

  const name = process.env.EMAIL_FROM_NAME;
  return name ? { email, name } : { email };
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
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not set");
  }

  sgMail.setApiKey(apiKey);

  try {
    await sgMail.send({
      to,
      from: getFrom(),
      subject,
      html,
    });
  } catch (error) {
    const err = error as { message?: string; response?: { body?: unknown } };
    console.error("SendGrid send failed:", err.response?.body ?? err.message);
    throw error;
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

export const sendPasswordResetEmail = async (
  name: string,
  email: string,
  resetUrl: string
): Promise<void> => {
  await sendEmail(
    email,
    "Reset your password",
    emailLayout(
      name,
      `<p>We received a request to reset your password.</p><p><a href="${escapeHtml(resetUrl)}" style="color:#315b50">Reset password</a></p><p>This link expires in one hour. If you did not request this, you can ignore this email.</p>`
    )
  );
};
