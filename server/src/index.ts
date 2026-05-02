import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { connectDB } from "./config/database";
import { connectRedis } from "./config/redis";
import { syncDatabase } from "./models";
import { initSocket } from "./services/socketService";

import authRoutes from "./routes/authRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminRoutes from "./routes/adminRoutes";
import voiceRoutes from "./routes/voiceRoutes";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/voice", voiceRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();
    await connectRedis();
    await syncDatabase();
    
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
};

startServer();
