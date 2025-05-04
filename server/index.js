import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { setupSocketHandlers } from "./socket/socketHandlers.js";
import boardRoutes from "./routes/boardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { setupYjs } from "./yjs/setup.js";

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use("/api/boards", boardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/uploads", uploadRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.io setup
setupSocketHandlers(io);

// Yjs setup
setupYjs(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`TeamBoard server running on port ${PORT}`);
});
