import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import jwt from 'jsonwebtoken';
import { clearCache } from "../utils/cache";
import { createHash, randomBytes } from "node:crypto";
import { sendPasswordResetEmail } from "./emailService";
import { removeStoredPdf } from "./uploadStorageService";

function selectSafeUser() {
  return {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    updatedAt: true,
  };
}

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    throw new Error("Name, email and password are required");
  }

  name = name.trim();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
    },
    select: {
      ...selectSafeUser(),
    },
  });

  return newUser;
};

export const loginUser = async (email: string, password: string) => {
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
};

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export const requestPasswordReset = async (email: unknown) => {
  const result: { message: string; resetUrl?: string; delivery?: "email" | "development-link" } = {
    message: "如果此 Email 已註冊，系統會提供密碼重設方式。",
  };
  if (typeof email !== "string" || !email.trim()) return result;

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) return result;

  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashResetToken(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      userId: user.id,
    },
  });

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const emailSent = await sendPasswordResetEmail(user.email, resetUrl);

  if (emailSent) {
    result.delivery = "email";
  } else if (process.env.NODE_ENV !== "production") {
    result.delivery = "development-link";
    result.resetUrl = resetUrl;
  } else {
    throw new Error("Email service is not configured");
  }

  return result;
};

export const resetPasswordWithToken = async (
  token: unknown,
  newPassword: unknown,
  confirmPassword: unknown
) => {
  if (typeof token !== "string" || !token) throw new Error("重設連結無效");
  if (typeof newPassword !== "string" || newPassword.length < 6) {
    throw new Error("新密碼至少需要 6 個字元");
  }
  if (newPassword !== confirmPassword) throw new Error("兩次輸入的密碼不一致");

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
  });
  if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= new Date()) {
    throw new Error("重設連結無效或已過期，請重新申請");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword, tokenVersion: { increment: 1 } },
    }),
    prisma.passwordResetToken.update({ where: { id: resetRecord.id }, data: { usedAt: new Date() } }),
  ]);
  return { message: "密碼已更新，請使用新密碼登入。" };
};

export const getCurrentUser = async (userId: number) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: selectSafeUser(),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const updateCurrentUser = async (userId: number, name: unknown) => {
  if (typeof name !== "string" || name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters");
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
    },
    select: selectSafeUser(),
  });
};

export const changeCurrentUserPassword = async (
  userId: number,
  currentPassword: unknown,
  newPassword: unknown,
  confirmPassword: unknown
) => {
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    typeof confirmPassword !== "string"
  ) {
    throw new Error("Current password, new password and confirm password are required");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("Confirm password does not match");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      tokenVersion: {
        increment: 1,
      },
    },
  });

  return {
    message: "Password updated successfully",
  };
};

export const deleteCurrentUser = async (
  userId: number,
  currentPassword: unknown,
  confirmText: unknown
) => {
  if (typeof currentPassword !== "string") {
    throw new Error("Current password is required");
  }

  if (confirmText !== "DELETE") {
    throw new Error("Please type DELETE to confirm account deletion");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const storedFiles = await prisma.note.findMany({
    where: { authorId: userId },
    select: { fileUrl: true },
  });

  await prisma.$transaction(async (tx) => {
    const notes = await tx.note.findMany({
      where: { authorId: userId },
      select: { id: true },
    });
    const noteIds = notes.map((note) => note.id);

    await tx.favorite.deleteMany({
      where: {
        OR: [
          { userId },
          noteIds.length > 0
            ? {
                noteId: {
                  in: noteIds,
                },
              }
            : { id: -1 },
        ],
      },
    });

    if (noteIds.length > 0) {
      await tx.noteTag.deleteMany({
        where: {
          noteId: {
            in: noteIds,
          },
        },
      });

      await tx.note.deleteMany({
        where: {
          id: {
            in: noteIds,
          },
        },
      });
    }

    await tx.user.delete({
      where: { id: userId },
    });
  });

  await Promise.all(storedFiles.map((note) => removeStoredPdf(note.fileUrl)));

  clearCache();

  return {
    message: "Account deleted successfully",
  };
};
