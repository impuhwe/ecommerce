import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User";
import bcrypt from "bcrypt";
import Product from "../models/Product";

(async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ecommerce_db";
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Missing admin environment variables");
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(mongoUri);

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log("Admin already exists, skipping creation");
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      const adminUser = new User({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "admin",
      });
      await adminUser.save();
      console.log("Admin user created successfully");
    }

    const sampleProducts = [
      {
        name: "Market Vegetable Box",
        description: "A seasonal selection of fresh vegetables for the week ahead.",
        category: "Food",
        price: 28,
        quantity: 40,
        image: "https://images.unsplash.com/photo-1540420773420-3366772f4999",
        options: ["Small box", "Large box", "Family box"],
      },
      {
        name: "Country Sourdough",
        description: "Naturally leavened sourdough baked with a crisp crust.",
        category: "Food",
        price: 8,
        quantity: 30,
        image: "https://images.unsplash.com/photo-1585478259715-876acc5be8eb",
        options: ["One loaf"],
      },
      {
        name: "Cloud Linen Sofa",
        description: "A relaxed, comfortable sofa upholstered in textured linen.",
        category: "Home Furniture",
        price: 1290,
        quantity: 5,
        image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc",
        options: ["Natural linen", "Warm grey"],
      },
      {
        name: "Arc Lounge Chair",
        description: "A sculptural lounge chair made for slow afternoons.",
        category: "Home Furniture",
        price: 460,
        quantity: 8,
        image: "https://images.unsplash.com/photo-1598300056393-4aac492f4344",
        options: ["Oak", "Walnut"],
      },
    ];

    for (const product of sampleProducts) {
      await Product.updateOne(
        { name: product.name, category: product.category },
        { $setOnInsert: product },
        { upsert: true }
      );
    }
    console.log("Sample products are ready");
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
})();