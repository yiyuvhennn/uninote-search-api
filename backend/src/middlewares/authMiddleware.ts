import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Invalid token format",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT secret is not configured");

    const decoded = jwt.verify(token, secret);
    if (
      typeof decoded === "string" ||
      !Number.isInteger(decoded.userId) ||
      typeof decoded.email !== "string"
      || !Number.isInteger(decoded.tokenVersion)
    ) {
      throw new Error("Invalid token payload");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, tokenVersion: true },
    });
    if (
      !user ||
      user.email !== decoded.email ||
      user.tokenVersion !== decoded.tokenVersion
    ) {
      throw new Error("Token user is no longer valid");
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};