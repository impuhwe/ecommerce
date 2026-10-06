import "dotenv/config";
import app from "./app";
import connectDB from "./config/db";

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
};

void startServer();