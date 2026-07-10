import { Request, Response } from "express";
import {
  changeCurrentUserPassword,
  deleteCurrentUser,
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
} from "../services/authService";

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser(name, email, password);

    return res.status(201).json({
      message: "Register success",
      user,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Register failed",
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser(email, password);

    return res.status(200).json({
      message: "Login success",
      ...result,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Login failed",
    });
  }
};

function getAuthenticatedUserId(req: Request) {
  return req.user?.userId;
}

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await getCurrentUser(userId);

    return res.json({
      user,
    });
  } catch (error) {
    return res.status(404).json({
      message: "User not found",
    });
  }
};

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await updateCurrentUser(userId, req.body.name);

    return res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to update profile",
    });
  }
};

export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await changeCurrentUserPassword(
      userId,
      req.body.currentPassword,
      req.body.newPassword,
      req.body.confirmPassword
    );

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to update password",
    });
  }
};

export const deleteMe = async (req: Request, res: Response) => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await deleteCurrentUser(
      userId,
      req.body.currentPassword,
      req.body.confirmText
    );

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({
      message: error.message || "Failed to delete account",
    });
  }
};
