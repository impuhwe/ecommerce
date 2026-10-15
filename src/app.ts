import express, { Application, Request, Response, NextFunction } from "express";
import multer from "multer";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import cors from "cors";
import { env } from "./config/env";
import "./config/cloudinary";

const app: Application = express();

app.use(
  cors({
    origin: [...new Set([...env.CORS_ORIGINS, "http://localhost:8443"])],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "My E-Commerce API",
      version: "1.0.0",
      description: "E-Commerce REST API with Node.js, Express, and TypeScript",
    },
    servers: [
      {url:`https://ecommerce-lojy.onrender.com`},
        {url: `http://localhost:${process.env.PORT || 5000}`},
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "E-Commerce API is running" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller."
        : err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Only JPEG, PNG, and WebP images are allowed."
          : "Image upload failed.";

    res.status(400).json({
      success: false,
      message,
    });
    return;
  }

  console.error(err.stack ?? err.message);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;