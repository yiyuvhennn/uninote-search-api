import express from "express"; //express：建立 API server
import cors from "cors"; //express：建立 API server
import dotenv from "dotenv"; //dotenv：讀取 .env 裡面的環境變數
import helmet from "helmet";
import noteRoutes from "./routes/noteRoutes"; //筆記 API
import authRoutes from "./routes/authRoutes"; //登入註冊 API
import favoriteRoutes from "./routes/favoriteRoutes"; //收藏 API
import searchRoutes from "./routes/searchRoutes"; //搜尋 API
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { apiRateLimiter, authRateLimiter } from "./middlewares/rateLimit";

dotenv.config(); //dotenv.config()：讀取 .env
const app = express(); //app：建立 Express app
const PORT = process.env.PORT || 3000; //PORT：優先用 .env 的 PORT，沒有就用 3000
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
); //cors：只允許設定好的前端來源呼叫後端
app.use(apiRateLimiter);
app.use(express.json()); //express.json()：讓後端看得懂前端傳來的 JSON body

app.get("/", (_req, res) => {
  res.json({ message: "UniNotes Search API is running" });
});

app.use("/notes", noteRoutes);
app.use("/auth", authRateLimiter, authRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/search", searchRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
