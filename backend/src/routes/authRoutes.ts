import { Router } from "express";
import {
  deleteMe,
  getMe,
  login,
  register,
  updateMe,
  updatePassword,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { authRateLimiter } from "../middlewares/rateLimit";

const router = Router();

// 只限制可被暴力嘗試的入口；/me 等已驗證請求不應消耗登入額度。
router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/forgot-password", authRateLimiter, forgotPassword);
router.post("/reset-password", authRateLimiter, resetPassword);
router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, updateMe);
router.patch("/me/password", authMiddleware, updatePassword);
router.delete("/me", authMiddleware, deleteMe);

export default router;
