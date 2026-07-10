import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { searchNotes } from "../services/searchService";

const router = Router();

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
        q: req.query.q as string | undefined,
        course: req.query.course as string | undefined,
        category: req.query.category as string | undefined,
        tag: req.query.tag as string | undefined,
        sort: req.query.sort as "relevance" | "latest" | "popular" | undefined,
        scope: req.query.scope as "all" | "mine" | "public" | undefined,
        page: Number(req.query.page),
        pageSize: Number(req.query.pageSize),
      },
      userId
    );

    return res.json(result);
  } catch (error) {
    console.error("Search notes error:", error);
    return res.status(500).json({
      message: "Failed to search notes",
    });
  }
});

export default router;
