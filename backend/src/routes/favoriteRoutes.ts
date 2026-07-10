import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { noteId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!noteId) {
      return res.status(400).json({
        message: "noteId is required",
      });
    }

    const note = await prisma.note.findFirst({
      where: {
        id: Number(noteId),
        OR: [{ authorId: userId }, { visibility: "PUBLIC" }],
      },
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId,
        noteId: Number(noteId),
      },
      include: {
        note: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return res.status(201).json({
      message: "Favorite created successfully",
      favorite,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({
        message: "You already favorited this note",
      });
    }

    console.error("Create favorite error:", error);
    return res.status(500).json({
      message: "Failed to create favorite",
    });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        note: {
          OR: [{ authorId: userId }, { visibility: "PUBLIC" }],
        },
      },
      include: {
        note: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(favorites);
  } catch (error) {
    console.error("Get favorites error:", error);
    return res.status(500).json({
      message: "Failed to fetch favorites",
    });
  }
});


router.delete("/:noteId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const noteId = Number(req.params.noteId);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!noteId || Number.isNaN(noteId)) {
      return res.status(400).json({
        message: "Valid noteId is required",
      });
    }

    const existingFavorite = await prisma.favorite.findFirst({
      where: {
        userId,
        noteId,
        note: {
          OR: [{ authorId: userId }, { visibility: "PUBLIC" }],
        },
      },
    });

    if (!existingFavorite) {
      return res.status(404).json({
        message: "Favorite not found",
      });
    }

    await prisma.favorite.delete({
      where: {
        id: existingFavorite.id,
      },
    });

    return res.json({
      message: "Favorite removed successfully",
    });
  } catch (error) {
    console.error("Delete favorite error:", error);
    return res.status(500).json({
      message: "Failed to remove favorite",
    });
  }
});

export default router;
