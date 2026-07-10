import { Router } from "express";
import {
  deleteMe,
  getMe,
  login,
  register,
  updateMe,
  updatePassword,
} from "../controllers/authController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, updateMe);
router.patch("/me/password", authMiddleware, updatePassword);
router.delete("/me", authMiddleware, deleteMe);

export default router;
