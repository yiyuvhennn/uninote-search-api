import express from "express"; //express：建立 API server
import cors from "cors"; //express：建立 API server
import dotenv from "dotenv"; //dotenv：讀取 .env 裡面的環境變數
import noteRoutes from "./routes/noteRoutes"; //筆記 API
import authRoutes from "./routes/authRoutes"; //登入註冊 API
import favoriteRoutes from "./routes/favoriteRoutes"; //收藏 API
import searchRoutes from "./routes/searchRoutes"; //搜尋 API

dotenv.config(); //dotenv.config()：讀取 .env
const app = express(); //app：建立 Express app
const PORT = process.env.PORT || 3000; //PORT：優先用 .env 的 PORT，沒有就用 3000

app.use(cors()); //cors()：讓前端可以跨來源呼叫後端
app.use(express.json()); //express.json()：讓後端看得懂前端傳來的 JSON body

app.get("/", (_req, res) => {
  res.json({ message: "UniNotes Search API is running" });
});

app.use("/notes", noteRoutes);
app.use("/auth", authRoutes);
app.use("/favorites", favoriteRoutes);
app.use("/search", searchRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});