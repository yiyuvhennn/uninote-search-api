import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/authMiddleware";
import { clearCache } from "../utils/cache";
import { buildSearchText } from "../utils/textProcessing";
import {
  extractTextFromPdf,
  PdfParseError,
} from "../services/pdfParserService";

const router = Router();
type NoteScope = "all" | "mine" | "public";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      callback(new Error("只支援 PDF 檔案，請重新選擇 .pdf 檔。"));
      return;
    }

    callback(null, true);
  },
});

/**
 * uploadPdfFile
 *
 * 將 multer 包成一般 Express middleware。
 * 這樣檔案太大或格式錯誤時，可以回傳 JSON 錯誤，而不是交給預設錯誤頁。
 */
const uploadPdfFile = (req: Request, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "PDF 檔案太大，請上傳 10MB 以下的檔案。"
          : "PDF 上傳失敗，請重新選擇檔案。";

      res.status(400).json({ message });
      return;
    }

    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "PDF 上傳失敗，請重新選擇檔案。",
    });
  });
};

/**
 * parseTagsInput
 *
 * 將前端傳來的 tags 字串轉成陣列。
 * 支援用逗號、中文逗號或空白分隔，例如：「期中考,工程數學」。
 */
function parseTagsInput(value: unknown) {
  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/[,\uFF0C\u3001\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function normalizeVisibility(value: unknown) {
  return value === "PRIVATE" ? "PRIVATE" : "PUBLIC";
}

function normalizeScope(value: unknown): NoteScope {
  return value === "mine" || value === "public" ? value : "all";
}

function buildVisibleNoteWhere(userId: number, scope: NoteScope) {
  if (scope === "mine") {
    return { authorId: userId };
  }

  if (scope === "public") {
    return { visibility: "PUBLIC" };
  }

  return {
    OR: [{ authorId: userId }, { visibility: "PUBLIC" }],
  };
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const scope = normalizeScope(req.query.scope);
    const keyword = req.query.keyword as string | undefined;
    const course = req.query.course as string | undefined;
    const category = req.query.category as string | undefined;
    const tag = req.query.tag as string | undefined;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const notes = await prisma.note.findMany({
      where: {
        AND: [
          buildVisibleNoteWhere(userId, scope),
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
        favorites: {
          where: {
            userId,
          },
        },
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
      visibility,
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
        visibility: normalizeVisibility(visibility),
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

router.post(
  "/upload-pdf",
  authMiddleware,
  uploadPdfFile,
  async (req, res) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          message: "Unauthorized",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "請選擇要上傳的 PDF 檔案。",
        });
      }

      const content = await extractTextFromPdf(req.file);
      const tags = parseTagsInput(req.body.tags);
      const title =
        String(req.body.title || "").trim() ||
        req.file.originalname.replace(/\.pdf$/i, "");
      const course = String(req.body.course || "未指定課程").trim();
      const category = String(req.body.category || "PDF 匯入").trim();
      const visibility = normalizeVisibility(req.body.visibility);
      const description = "由 PDF 匯入";
      const fileUrl = `uploaded-pdf:${req.file.originalname}`;

      const note = await prisma.note.create({
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
            tags,
          }),
          fileUrl,
          course,
          category,
          visibility,
          authorId: userId,
          tags: {
            create: tags.map((tagName) => ({
              tag: {
                connectOrCreate: {
                  where: { name: tagName },
                  create: { name: tagName },
                },
              },
            })),
          },
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
        },
      });

      clearCache();

      return res.status(201).json({
        message: "PDF 匯入成功，已建立可搜尋筆記。",
        note,
      });
    } catch (error) {
      if (error instanceof PdfParseError) {
        return res.status(error.statusCode).json({
          message: error.message,
        });
      }

      if (error instanceof Error && error.message.includes("PDF")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      console.error("Upload PDF note error:", error);
      return res.status(500).json({
        message: "PDF 匯入失敗，請稍後再試。",
      });
    }
  }
);

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({
        message: "Invalid note id",
      });
    }

    const note = await prisma.note.findFirst({
      where: {
        id,
        OR: [{ authorId: userId }, { visibility: "PUBLIC" }],
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
        favorites: {
          where: {
            userId,
          },
        },
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

    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        authorId: userId,
      },
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
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
