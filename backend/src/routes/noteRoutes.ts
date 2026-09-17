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
import {
  sanitizeOriginalFilename,
  validatePdfExtension,
  validatePdfMagicNumber,
  validatePdfMimeType,
} from "../utils/fileValidation";
import {
  parseStoredPdfReference,
  removeStoredPdf,
  savePdfFile,
} from "../services/uploadStorageService";
import { buildPaginationMeta, parsePagination } from "../utils/pagination";

const router = Router();
type NoteScope = "all" | "mine" | "public";

/**
 * getMaxUploadMb
 *
 * 從環境變數讀取 PDF 上傳大小限制；若未設定或設定錯誤，預設使用 10MB。
 */
function getMaxUploadMb() {
  const value = Number(process.env.MAX_UPLOAD_MB);

  if (Number.isFinite(value) && value > 0) {
    return value;
  }

  return 10;
}

const maxUploadMb = getMaxUploadMb();
const maxUploadBytes = maxUploadMb * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes,
  },
  fileFilter: (_req, file, callback) => {
    if (!validatePdfExtension(file.originalname)) {
      callback(new Error("只支援 .pdf 副檔名，請重新選擇 PDF 檔案。"));
      return;
    }

    if (!validatePdfMimeType(file.mimetype)) {
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
          ? `PDF 檔案太大，請上傳 ${maxUploadMb}MB 以下的檔案。`
          : "PDF 上傳失敗，請重新選擇檔案。";

      res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message });
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
function parseTagsInput(value: unknown): string[] {
  let tags: string[];
  if (Array.isArray(value)) {
    tags = value
      .flatMap((item) => parseTagsInput(item))
      .map((tag) => tag.trim())
      .filter(Boolean);
  } else if (typeof value === "string") {
    tags = value
      .split(/[,\uFF0C\u3001\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
  } else {
    return [];
  }

  return Array.from(new Set(tags)).slice(0, 30);
}

function normalizeExternalFileUrl(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("fileUrl must be a valid http or https URL");

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("fileUrl must be a valid http or https URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("fileUrl must be a valid http or https URL");
  }

  return url.toString();
}

function readOptionalQueryText(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw new Error(`${field} must be a single string`);
  if (value.length > 200) throw new Error(`${field} must be 200 characters or fewer`);
  return value;
}

function normalizeVisibility(value: unknown) {
  if (value === undefined || value === "PUBLIC") return "PUBLIC";
  if (value === "PRIVATE") return "PRIVATE";
  throw new Error("visibility must be PUBLIC or PRIVATE");
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

function formatNoteResponse(note: any) {
  const { searchText: _searchText, _count, favorites, author, tags, ...safeNote } = note;
  return {
    ...safeNote,
    author: author ? { id: author.id, name: author.name } : undefined,
    tags: tags?.map((item: { tag: { id: number; name: string } }) => item.tag) ?? [],
    favoriteCount: _count?.favorites ?? 0,
    isFavorited: Boolean(favorites?.length),
  };
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;
    const pagination = parsePagination(req.query);
    const scope = normalizeScope(req.query.scope);
    const keyword = readOptionalQueryText(req.query.keyword, "keyword");
    const course = readOptionalQueryText(req.query.course, "course");
    const category = readOptionalQueryText(req.query.category, "category");
    const tag = readOptionalQueryText(req.query.tag, "tag");

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const where = {
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
      };
    const [total, notes] = await Promise.all([
      prisma.note.count({ where }),
      prisma.note.findMany({
      where,
      include: {
        author: { select: { id: true, name: true } },
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
        _count: { select: { favorites: true } },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: pagination.skip,
      take: pagination.pageSize,
      }),
    ]);

    res.json({
      data: notes.map(formatNoteResponse),
      meta: buildPaginationMeta(pagination.page, pagination.pageSize, total),
    });
  } catch (error) {
    if (error instanceof Error && (error.message.startsWith("page must") || error.message.includes("must be"))) {
      return res.status(400).json({ message: error.message });
    }
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
      views,
      likes,
      visibility,
      tags: rawTags,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof course !== "string" ||
      !course.trim()
    ) {
      return res.status(400).json({
        message: "Title and course are required",
      });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const tags = parseTagsInput(rawTags);
    const normalizedFileUrl = normalizeExternalFileUrl(fileUrl);

    if (views !== undefined || likes !== undefined) {
      return res.status(400).json({
        message: "views and likes are managed by the server",
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
          tags,
        }),
        fileUrl: normalizedFileUrl,
        course,
        category,
        views: 0,
        likes: 0,
        visibility: normalizeVisibility(visibility),
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
      message: "Note created successfully",
      note: formatNoteResponse(newNote),
    });
  } catch (error) {
    if (error instanceof Error && /fileUrl|visibility/.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }
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

      if (!validatePdfMagicNumber(req.file.buffer)) {
        return res.status(400).json({
          message: "PDF 檔案內容格式不正確，請確認檔案不是偽裝成 PDF 的其他檔案。",
        });
      }

      const content = await extractTextFromPdf(req.file);
      const tags = parseTagsInput(req.body.tags);
      const safeFilename = sanitizeOriginalFilename(req.file.originalname);
      const title =
        String(req.body.title || "").trim() ||
        safeFilename.replace(/\.pdf$/i, "");
      const course = String(req.body.course || "未指定課程").trim();
      const category = String(req.body.category || "PDF 匯入").trim();
      const visibility = normalizeVisibility(req.body.visibility);
      const description = "由 PDF 匯入";
      const fileUrl = await savePdfFile(req.file.buffer, safeFilename);

      let note;

      try {
        note = await prisma.note.create({
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
      } catch (error) {
        await removeStoredPdf(fileUrl);
        throw error;
      }

      clearCache();

      return res.status(201).json({
        message: "PDF 匯入成功，已建立可搜尋筆記。",
        note,
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes("visibility")) {
        return res.status(400).json({ message: error.message });
      }
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

router.get("/:id/file", authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid note id" });
    }

    const note = await prisma.note.findFirst({
      where: {
        id,
        OR: [{ authorId: userId }, { visibility: "PUBLIC" }],
      },
      select: { fileUrl: true },
    });
    const storedPdf = parseStoredPdfReference(note?.fileUrl);

    if (!storedPdf) {
      return res.status(404).json({ message: "PDF file not found" });
    }

    res.type("application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(storedPdf.originalName)}`
    );
    return res.sendFile(storedPdf.absolutePath);
  } catch (error) {
    console.error("Get PDF file error:", error);
    return res.status(404).json({ message: "PDF file not found" });
  }
});

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

    return res.json(formatNoteResponse(note));
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

    await removeStoredPdf(note.fileUrl);

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
