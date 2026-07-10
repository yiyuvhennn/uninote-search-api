import { prisma } from "../lib/prisma";
import { getCache, setCache } from "../utils/cache";
import { calculateNoteScore, type ScoreDetail } from "../utils/ranking";
import { buildCjkNgrams, tokenize } from "../utils/textProcessing";

type SearchSort = "relevance" | "latest" | "popular";
type SearchScope = "all" | "mine" | "public";

type SearchParams = {
  q?: string;
  course?: string;
  category?: string;
  tag?: string;
  sort?: SearchSort;
  scope?: SearchScope;
  page?: number;
  pageSize?: number;
};

type SearchMeta = {
  q: string;
  course: string;
  category: string;
  tag: string;
  sort: SearchSort;
  scope: SearchScope;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  cache: "hit" | "miss";
  candidateLimit: number;
};

type SearchResult = {
  data: Array<{
    id: number;
    title: string;
    description: string | null;
    content: string | null;
    searchText: string | null;
    fileUrl: string;
    course: string;
    category: string | null;
    visibility: string;
    views: number;
    likes: number;
    createdAt: Date;
    updatedAt: Date;
    authorId: number;
    author: {
      id: number;
      name: string;
      email: string;
    };
    tags: Array<{
      id: number;
      name: string;
    }>;
    favorites: unknown[];
    favoriteCount: number;
    score: number;
    scoreDetail: ScoreDetail;
  }>;
  meta: SearchMeta;
};

type SearchResultNote = SearchResult["data"][number];

const CANDIDATE_LIMIT = 1000;

function buildSearchNoteInclude(userId: number) {
  return {
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
    _count: {
      select: {
        favorites: true,
      },
    },
  };
}

const synonymMap: Record<string, string[]> = {
  自控: ["自動控制", "控制系統"],
  控制: ["自動控制", "控制系統", "線性控制"],
  熱流: ["熱力學", "流體力學", "熱傳學"],
  熱傳: ["熱傳學", "Heat Transfer"],
  流力: ["流體力學", "Fluid Mechanics"],
  材力: ["材料力學", "Mechanics of Materials"],
  工數: ["工程數學", "Engineering Mathematics"],
  微積分: ["Calculus"],
  普物: ["普通物理", "General Physics"],
  製造: ["機械製造", "Mechanical Manufacturing"],
  機設: ["機械設計", "Machine Design"],
  機動: ["機動學", "Mechanism"],
  考古: ["考古題", "歷屆試題"],
  期中: ["期中考", "考試整理"],
  期末: ["期末考", "考試整理"],
};

function toPositiveNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return fallback;
  }

  return Math.floor(numberValue);
}

function normalizeText(value?: string) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function normalizeSort(sort?: SearchSort): SearchSort {
  if (sort === "latest" || sort === "popular" || sort === "relevance") {
    return sort;
  }

  return "relevance";
}

function normalizeScope(scope?: SearchScope): SearchScope {
  if (scope === "mine" || scope === "public" || scope === "all") {
    return scope;
  }

  return "all";
}

function normalizeParams(params: SearchParams) {
  return {
    q: normalizeText(params.q),
    course: normalizeText(params.course),
    category: normalizeText(params.category),
    tag: normalizeText(params.tag),
    sort: normalizeSort(params.sort),
    scope: normalizeScope(params.scope),
    page: toPositiveNumber(params.page, 1),
    pageSize: Math.min(toPositiveNumber(params.pageSize, 12), 50),
  };
}

function buildVisibleNoteWhere(userId: number, scope: SearchScope) {
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

/**
 * Query Understanding 簡化版：
 * 把使用者輸入的 query 加入同義詞。
 *
 * 例如：
 * q = 自控
 * 會同時搜尋：自控、自動控制、控制系統
 */
function expandQueryTerms(query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return [];

  const terms = new Set<string>();
  terms.add(normalizedQuery);
  tokenize(normalizedQuery).forEach((token) => terms.add(token));

  Object.entries(synonymMap).forEach(([key, values]) => {
    if (normalizedQuery.includes(key)) {
      terms.add(key);
      values.forEach((value) => terms.add(value));
    }

    values.forEach((value) => {
      if (normalizedQuery.includes(value)) {
        terms.add(key);
        values.forEach((item) => terms.add(item));
      }
    });
  });

  buildCjkNgrams(normalizedQuery).forEach((gram) => terms.add(gram));

  return Array.from(terms);
}

function buildKeywordWhere(queryTerms: string[]) {
  if (queryTerms.length === 0) return {};

  return {
    OR: queryTerms.flatMap((term) => [
      {
        title: {
          contains: term,
        },
      },
      {
        description: {
          contains: term,
        },
      },
      {
        content: {
          contains: term,
        },
      },
      {
        searchText: {
          contains: term,
        },
      },
      {
        course: {
          contains: term,
        },
      },
      {
        category: {
          contains: term,
        },
      },
      {
        tags: {
          some: {
            tag: {
              name: {
                contains: term,
              },
            },
          },
        },
      },
    ]),
  };
}

function buildFilterWhere(normalized: ReturnType<typeof normalizeParams>) {
  return [
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
  ];
}

function buildRankingKeyword(normalized: ReturnType<typeof normalizeParams>) {
  const parts = [
    normalized.q,
    normalized.course,
    normalized.category,
    normalized.tag,
    ...expandQueryTerms(normalized.q),
  ].filter(Boolean);

  return Array.from(new Set(parts)).join(" ");
}

function getPopularValue(note: {
  views: number;
  likes: number;
  favoriteCount: number;
}) {
  return note.views * 0.1 + note.likes * 0.5 + note.favoriteCount;
}

export async function searchNotes(
  params: SearchParams,
  userId: number
): Promise<SearchResult> {
  const normalized = normalizeParams(params);
  const queryTerms = expandQueryTerms(normalized.q);
  const cacheKey = `search:${JSON.stringify({
    userId,
    ...normalized,
    queryTerms,
  })}`;

  const cached = getCache<SearchResult>(cacheKey);

  if (cached) {
    return {
      ...cached,
      meta: {
        ...cached.meta,
        cache: "hit",
      },
    };
  }

  /**
   * Candidate Retrieval：
   * 先從資料庫召回最多 1000 筆候選資料。
   * 不直接對全資料庫做 ranking，避免資料量變大後變慢。
   */
  const notes = await prisma.note.findMany({
    where: {
      AND: [
        {
          ...buildVisibleNoteWhere(userId, normalized.scope),
        },
        buildKeywordWhere(queryTerms),
        ...buildFilterWhere(normalized),
      ],
    },
    include: buildSearchNoteInclude(userId),
    take: CANDIDATE_LIMIT,
    orderBy: {
      createdAt: "desc",
    },
  });

  const rankingKeyword = buildRankingKeyword(normalized);

  const scoredNotes: SearchResultNote[] = notes.map((note) => {
    const tags = note.tags.map((item) => item.tag);
    const favoriteCount = note._count.favorites;
    const rankableNote = {
      title: note.title,
      description: note.description,
      content: note.content,
      searchText: note.searchText,
      course: note.course,
      category: note.category,
      fileUrl: note.fileUrl,
      views: note.views,
      likes: note.likes,
      createdAt: note.createdAt,
      favorites: Array.from({ length: favoriteCount }),
      tags,
    };
    const scoreDetail = calculateNoteScore(rankableNote, rankingKeyword);

    return {
      id: note.id,
      title: note.title,
      description: note.description,
      content: note.content,
      searchText: note.searchText,
      fileUrl: note.fileUrl,
      course: note.course,
      category: note.category,
      visibility: note.visibility,
      views: note.views,
      likes: note.likes,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      authorId: note.authorId,
      author: note.author,
      tags,
      favorites: note.favorites,
      favoriteCount,
      score: scoreDetail.total,
      scoreDetail,
    };
  });

  scoredNotes.sort((a, b) => {
    if (normalized.sort === "latest") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (normalized.sort === "popular") {
      return getPopularValue(b) - getPopularValue(a);
    }

    return b.score - a.score;
  });

  const total = scoredNotes.length;
  const totalPages = Math.max(Math.ceil(total / normalized.pageSize), 1);
  const safePage = Math.min(normalized.page, totalPages);
  const start = (safePage - 1) * normalized.pageSize;
  const data = scoredNotes.slice(start, start + normalized.pageSize);

  const result: SearchResult = {
    data,
    meta: {
      q: normalized.q,
      course: normalized.course,
      category: normalized.category,
      tag: normalized.tag,
      sort: normalized.sort,
      scope: normalized.scope,
      page: safePage,
      pageSize: normalized.pageSize,
      total,
      totalPages,
      cache: "miss",
      candidateLimit: CANDIDATE_LIMIT,
    },
  };

  setCache(cacheKey, result, 60);

  return result;
}
