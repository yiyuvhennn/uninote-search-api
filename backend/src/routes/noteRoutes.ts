import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/authMiddleware";
import { clearCache } from "../utils/cache";
import { buildSearchText } from "../utils/textProcessing";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const keyword = req.query.keyword as string | undefined;
    const course = req.query.course as string | undefined;
    const category = req.query.category as string | undefined;
    const tag = req.query.tag as string | undefined;

    const notes = await prisma.note.findMany({
      where: {
        AND: [
          keyword
            ? {
                OR: [
                  { title: { contains: keyword } },
                  { description: { contains: keyword } },
                  { content: { contains: keyword } },
                  { searchText: { contains: keyword } },
                ],
              }
            : {},
          course
            ? {
                course: {
                  contains: course,
                },
              }
            : {},
          category
            ? {
                category: {
                  contains: category,
                },
              }
            : {},
          tag
            ? {
                tags: {
                  some: {
                    tag: {
                      name: {
                        contains: tag,
                      },
                    },
                  },
                },
              }
            : {},
        ],
      },
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
        favorites: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(notes);
  } catch (error) {
    console.error("Get notes error:", error);
    res.status(500).json({ message: "Failed to fetch notes" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      title,
      description,
      content,
      fileUrl,
      course,
      category,
      views = 0,
      likes = 0,
    } = req.body;

    if (!title || !fileUrl || !course) {
      return res.status(400).json({
        message: "Title, fileUrl and course are required",
      });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const newNote = await prisma.note.create({
      data: {
        title,
        description,
        content,
        searchText: buildSearchText({
          title,
          description,
          content,
          course,
          category,
          tags: [],
        }),
        fileUrl,
        course,
        category,
        views: Number(views) || 0,
        likes: Number(likes) || 0,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    clearCache();

    return res.status(201).json({
      message: "Note created successfully",
      note: newNote,
    });
  } catch (error) {
    console.error("Create note error:", error);
    return res.status(500).json({
      message: "Failed to create note",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const note = await prisma.note.findUnique({
      where: { id },
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
        favorites: true,
      },
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    await prisma.note.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    clearCache();

    return res.json(note);
  } catch (error) {
    console.error("Get note by id error:", error);
    return res.status(500).json({
      message: "Failed to fetch note",
    });
  }
});

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const noteId = Number(req.params.id);
    const userId = req.user?.userId;

    if (!noteId || Number.isNaN(noteId)) {
      return res.status(400).json({
        message: "Invalid note id",
      });
    }

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    if (note.authorId !== userId) {
      return res.status(403).json({
        message: "You do not have permission to delete this note",
      });
    }

    await prisma.favorite.deleteMany({
      where: { noteId },
    });

    await prisma.noteTag.deleteMany({
      where: { noteId },
    });

    await prisma.note.delete({
      where: { id: noteId },
    });

    clearCache();

    return res.json({
      message: "Note deleted successfully",
    });
  } catch (error) {
    console.error("Delete note error:", error);
    return res.status(500).json({
      message: "Failed to delete note",
    });
  }
});

export default router;
