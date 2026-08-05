import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import geocodeRoutes from "./routes/geocodeRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import { UPLOADS_DIR } from "./middleware/upload.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import initSocket from "./socket/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/conversations", conversationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server in ascolto su http://localhost:${PORT}`);
});
