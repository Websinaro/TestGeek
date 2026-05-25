import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer as createViteServer } from "vite";
import { config } from "./config/app.config";
import { errorHandler } from "./middleware/error.middleware";
import { csrfProtection, xssProtection } from "./middleware/security.middleware";

// Routes
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import cartRoutes from "./routes/cart.routes";
import orderRoutes from "./routes/order.routes";
import adminRoutes from "./routes/admin.routes";
import notificationRoutes from "./routes/notification.routes";
import wishlistRoutes from "./routes/wishlist.routes";

const isProd = config.nodeEnv === "production";

async function startServer() {
  const app = express();

  // Security & Utility Middleware
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(csrfProtection);
  app.use(xssProtection);
  app.use(morgan(isProd ? "combined" : "dev"));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
  });
  if (isProd) app.use("/api/", limiter);

  // Static files for uploads
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  app.use("/uploads", express.static(uploadsDir));

  // Health Check
  app.get("/api/health", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

  // API Routes
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/wishlist", wishlistRoutes);

  // Vite middleware or Production static files
  if (!isProd) {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }

  // Error Handler (Must be last)
  app.use(errorHandler);

  app.listen(Number(config.port), "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${config.port} (${config.nodeEnv})`);
  });
}

startServer().catch((err) => {
  console.error("Startup Failure:", err);
  process.exit(1);
});
