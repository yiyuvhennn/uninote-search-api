import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";
import jwt from 'jsonwebtoken';
import { clearCache } from "../utils/cache";

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
  if (!name || !email || !password) {
    throw new Error("Name, email and password are required");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
    select: {
      ...selectSafeUser(),
    },
  });

  return newUser;
};

export const loginUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const user = await prisma.user.findUnique({
    where: { email },
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

  clearCache();

  return {
    message: "Account deleted successfully",
  };
};
