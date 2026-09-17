import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { searchNotes } from "../services/searchService";

const router = Router();

function readQueryText(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string") {
    throw new Error(`${field} must be a single string`);
  }
  if (value.length > 200) {
    throw new Error(`${field} must be 200 characters or fewer`);
  }
  return value;
}

function readPositiveInteger(value: unknown, field: string) {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^\d+$/.test(value) || Number(value) < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return Number(value);
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const result = await searchNotes(
      {
        q: readQueryText(req.query.q, "q"),
        course: readQueryText(req.query.course, "course"),
        category: readQueryText(req.query.category, "category"),
        tag: readQueryText(req.query.tag, "tag"),
        sort: req.query.sort as "relevance" | "latest" | "popular" | undefined,
        scope: req.query.scope as "all" | "mine" | "public" | undefined,
        page: readPositiveInteger(req.query.page, "page"),
        pageSize: readPositiveInteger(req.query.pageSize, "pageSize"),
      },
      userId
    );

    return res.json(result);
  } catch (error) {
    if (error instanceof Error && /must be a single string|must be a positive integer/.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Search notes error:", error);
    return res.status(500).json({
      message: "Failed to search notes",
    });
  }
});

export default router;
