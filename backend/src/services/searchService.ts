import { prisma } from "../lib/prisma";
import { getCache, setCache } from "../utils/cache";
import { calculateNoteScore } from "../utils/ranking";

type SearchParams = {
  q?: string;
  course?: string;
  category?: string;
  tag?: string;
  sort?: "relevance" | "latest" | "popular";
  page?: number;
  pageSize?: number;
};

function toPositiveNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return fallback;
  }

  return Math.floor(numberValue);
}

function normalizeParams(params: SearchParams) {
  return {
    q: params.q?.trim() || "",
    course: params.course?.trim() || "",
    category: params.category?.trim() || "",
    tag: params.tag?.trim() || "",
    sort: params.sort || "relevance",
    page: toPositiveNumber(params.page, 1),
    pageSize: Math.min(toPositiveNumber(params.pageSize, 10), 50),
  };
}

export async function searchNotes(params: SearchParams) {
  const normalized = normalizeParams(params);
  const cacheKey = `search:${JSON.stringify(normalized)}`;
  const cached = getCache(cacheKey);

  if (cached) {
    return {
      ...(cached as object),
      meta: {
        ...(cached as any).meta,
        cache: "hit",
      },
    };
  }

  const notes = await prisma.note.findMany({
    where: {
      AND: [
        normalized.q
          ? {
              OR: [
                { title: { contains: normalized.q } },
                { description: { contains: normalized.q } },
                { content: { contains: normalized.q } },
                { course: { contains: normalized.q } },
              ],
            }
          : {},
        normalized.course
          ? {
              course: {
                contains: normalized.course,
              },
            }
          : {},
        normalized.category
          ? {
              category: {
                contains: normalized.category,
              },
            }
          : {},
        normalized.tag
          ? {
              tags: {
                some: {
                  tag: {
                    name: {
                      contains: normalized.tag,
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
  });

  const scoredNotes = notes.map((note) => {
    const scoreDetail = calculateNoteScore(note, normalized.q);

    return {
      ...note,
      score: scoreDetail.total,
      scoreDetail,
      favoriteCount: note.favorites.length,
      tags: note.tags.map((item) => item.tag),
    };
  });

  scoredNotes.sort((a, b) => {
    if (normalized.sort === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (normalized.sort === "popular") {
      const aPopular = a.views * 0.1 + a.likes * 0.5 + a.favoriteCount;
      const bPopular = b.views * 0.1 + b.likes * 0.5 + b.favoriteCount;
      return bPopular - aPopular;
    }

    return b.score - a.score;
  });

  const total = scoredNotes.length;
  const totalPages = Math.ceil(total / normalized.pageSize) || 1;
  const start = (normalized.page - 1) * normalized.pageSize;
  const data = scoredNotes.slice(start, start + normalized.pageSize);

  const result = {
    data,
    meta: {
      q: normalized.q,
      course: normalized.course,
      category: normalized.category,
      tag: normalized.tag,
      sort: normalized.sort,
      page: normalized.page,
      pageSize: normalized.pageSize,
      total,
      totalPages,
      cache: "miss",
    },
  };

  setCache(cacheKey, result, 60);

  return result;
}
