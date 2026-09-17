import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/authMiddleware";
import { clearCache } from "../utils/cache";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";

const router = Router();

function formatFavoriteNote(note: any) {
  const { searchText: _searchText, favorites: _favorites, _count, author, tags, ...safeNote } = note;
  return {
    ...safeNote,
    author: author ? { id: author.id, name: author.name } : undefined,
    tags: tags?.map((item: { tag: { id: number; name: string } }) => item.tag) ?? [],
    favoriteCount: _count?.favorites ?? 0,
    isFavorited: true,
  };
}

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { noteId } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(Number(noteId)) || Number(noteId) < 1) {
      return res.status(400).json({
        message: "Valid noteId is required",
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
            author: { select: { id: true, name: true } },
            _count: { select: { favorites: true } },
          },
        },
      },
    });
    clearCache();

    return res.status(201).json({
      message: "Favorite created successfully",
      favorite: { ...favorite, note: formatFavoriteNote(favorite.note) },
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
    const pagination = parsePagination(req.query);

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const where = {
      userId,
      note: {
        OR: [{ authorId: userId }, { visibility: "PUBLIC" }],
      },
    };
    const [total, favorites] = await Promise.all([
      prisma.favorite.count({ where }),
      prisma.favorite.findMany({
      where,
      include: {
        note: {
          include: {
            author: { select: { id: true, name: true } },
            tags: {
              include: {
                tag: true,
              },
            },
            _count: { select: { favorites: true } },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: pagination.skip,
      take: pagination.pageSize,
      }),
    ]);

    return res.json({
      data: favorites.map((favorite) => formatFavoriteNote(favorite.note)),
      meta: buildPaginationMeta(pagination.page, pagination.pageSize, total),
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("page must")) {
      return res.status(400).json({ message: error.message });
    }
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
    clearCache();

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
