import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import noteRoutes from "./routes/noteRoutes";
import authRoutes from "./routes/authRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import searchRoutes from "./routes/searchRoutes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { apiRateLimiter, authRateLimiter } from "./middlewares/rateLimit";

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const allowedOrigins = new Set<string>();

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, "");
}

if (process.env.FRONTEND_URL) {
  allowedOrigins.add(normalizeOrigin(process.env.FRONTEND_URL));
}

if (!isProduction) {
  allowedOrigins.add("http://localhost:5173");
}

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.has(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }

      const error = new Error("Not allowed by CORS") as Error & {
        status?: number;
      };
      error.status = 403;
      callback(error);
    },
  })
);
app.use(apiRateLimiter);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "UniNotes Search API is running" });
});

app.use("/notes", noteRoutes);
app.use("/auth", authRateLimiter, authRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/search", searchRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
