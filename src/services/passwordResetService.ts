import bcrypt from "bcrypt";
import User from "../models/User";
import PasswordResetOtp from "../models/PasswordResetOtp";
import { sendOtpEmail, sendPasswordChangedEmail } from "../config/email";
import { generateOtp, hashOtp, otpHashesEqual } from "../utils/otp";
import { logError } from "../utils/logError";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const BCRYPT_COST = 12;

export const requestPasswordReset = async (email: string): Promise<void> => {
  const user = await User.findOne({ email });
  if (!user) {
    return;
  }

  const userId = String(user._id);
  await PasswordResetOtp.deleteMany({ userId: user._id });

  const otp = generateOtp();
  await PasswordResetOtp.create({
    userId: user._id,
    otpHash: hashOtp(userId, otp),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendOtpEmail(user.email, otp);
};

export const completePasswordReset = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<boolean> => {
  const user = await User.findOne({ email });
  if (!user) {
    return false;
  }

  const userId = String(user._id);
  const now = new Date();
  const otpDoc = await PasswordResetOtp.findOneAndUpdate(
    {
      userId: user._id,
      used: false,
      expiresAt: { $gt: now },
      attempts: { $lt: MAX_ATTEMPTS },
    },
    { $inc: { attempts: 1 } },
    { new: true }
  );

  if (!otpDoc) {
    return false;
  }

  const submittedHash = hashOtp(userId, otp);
  if (!otpHashesEqual(otpDoc.otpHash, submittedHash)) {
    if (otpDoc.attempts >= MAX_ATTEMPTS) {
      await PasswordResetOtp.deleteOne({ _id: otpDoc._id });
    }
    return false;
  }

  const claimed = await PasswordResetOtp.findOneAndUpdate(
    { _id: otpDoc._id, used: false },
    { $set: { used: true } }
  );

  if (!claimed) {
    return false;
  }

  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_COST);
  await User.updateOne(
    { _id: user._id },
    {
      $set: { password: hashedPassword },
      $inc: { tokenVersion: 1 },
      $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
    }
  );

  void sendPasswordChangedEmail(user.email).catch((err: unknown) => {
    logError("password-changed-email", err);
  });

  return true;
};
