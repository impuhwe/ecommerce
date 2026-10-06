import express, { Application, Request, Response } from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";

const app: Application = express();

app.use(express.json());

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce API",
      version: "1.0.0",
      description: "E-Commerce REST API with Node.js, Express, and TypeScript",
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
      },
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

// Health check
app.get("/", (req: Request, res: Response) => {
  res.json({ message: "E-Commerce API is running" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response): void => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

export default app;