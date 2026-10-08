import { env } from "./config/env";
import app from "./app";
import connectDB from "./config/db";

const startServer = async (): Promise<void> => {
  await connectDB();

  const server = app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
  });

  process.on("SIGINT", () => {
    server.close(() => process.exit(0));
  });
};

void startServer();
