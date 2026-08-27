import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import geocodeRoutes from "./routes/geocodeRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { UPLOADS_DIR } from "./middleware/upload.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimiters.js";

dotenv.config();

const app = express();

// Necessario per ottenere il vero IP del client quando dietro un reverse proxy
// (es. Nginx, load balancer). Da adattare (numero di hop o lista IP) in produzione.
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(UPLOADS_DIR));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", globalLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
