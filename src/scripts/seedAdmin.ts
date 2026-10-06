import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";
import bcrypt from "bcrypt";

(async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce_db";

  try {
    await mongoose.connect(mongoUri);

    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("Missing admin environment variables");
      process.exit(1);
    }

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log("Admin already exists, skipping creation");
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const adminUser = new User({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    });

    await adminUser.save();

    console.log("Admin user created successfully");
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
})();