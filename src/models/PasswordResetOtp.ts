import mongoose, { type Document, Schema } from "mongoose";

export interface IPasswordResetOtp extends Document {
  userId: mongoose.Types.ObjectId;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  used: boolean;
  createdAt: Date;
}

const passwordResetOtpSchema = new Schema<IPasswordResetOtp>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

passwordResetOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetOtp = mongoose.model<IPasswordResetOtp>(
  "PasswordResetOtp",
  passwordResetOtpSchema
);

export default PasswordResetOtp;
