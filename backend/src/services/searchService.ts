/// searchService為真正搜尋大腦
// 1. 整理搜尋參數
// 2. 產生 cache key
// 3. 檢查快取有沒有資料
// 4. 用 Prisma 查 Note
// 5. 計算每篇筆記的 score
// 6. 根據 sort 排序
// 7. 做分頁
// 8. 回傳 data + meta
// 9. 把結果存進 cache 60 秒

import { prisma } from "../lib/prisma";
import { getCache, setCache } from "../utils/cache";
import { calculateNoteScore } from "../utils/ranking";

//SearchParams 型別 : 搜尋功能可以接收哪些參數？
type SearchParams = {
  q?: string; //關鍵字
  course?: string; //課程
  category?: string; //分類
  tag?: string; //標籤
  sort?: "relevance" | "latest" | "popular";
  //排序方式只能是三種 relevance：相關度排序 | latest：最新排序 | popular：熱門排序
  //sort 不能亂填，只能是這三個字串其中一個。

  page?: number; //代表第幾頁
  pageSize?: number; //代表一頁幾筆資料
};

//toPositiveNumber：把頁數整理成正常數字
function toPositiveNumber(value: unknown, fallback: number) { //value：要被轉成數字的值
  //unknown 代表：可能是字串、數字、undefined、null。               fallback：如果轉換失敗，要使用的預設值
  const numberValue = Number(value);

  //檢查：numberValue 是不是合法數字？numberValue 是否大於 0？
  if (!Number.isFinite(numberValue) || numberValue <= 0) { 
    return fallback; //如果不是合法數字，或小於等於 0，就回傳預設值。
  }
  return Math.floor(numberValue);//如果是合法數字，就無條件捨去小數。
}
//normalizeParams：整理搜尋參數 : 把前端傳來的搜尋條件整理乾淨
function normalizeParams(params: SearchParams) { 
  return {
    q: params.q?.trim() || "", //如果 q 有值，就去掉前後空白。如果 q 沒有值，就變成空字串。
    course: params.course?.trim() || "",
    category: params.category?.trim() || "",
    tag: params.tag?.trim() || "",
    sort: params.sort || "relevance", //如果前端沒有傳排序方式，就預設：relevance
    page: toPositiveNumber(params.page, 1), //把 page 轉成正整數。如果沒有傳或傳錯，就預設第 1 頁。
    pageSize: Math.min(toPositiveNumber(params.pageSize, 10), 50), //pageSize 預設 10。但最多不能超過 50。
  };
}

//searchNotes：主要搜尋函式
//export 代表其他檔案可以使用它。 async 代表裡面會有非同步操作，也就是後面會查資料庫：
export async function searchNotes(params: SearchParams) {

  const normalized = normalizeParams(params); //整理參數
  const cacheKey = `search:${JSON.stringify(normalized)}`; //產生 cache key
  const cached = getCache(cacheKey); //讀取 cache
  //如果 cache 命中，就直接回傳
  if (cached) {
    return {
      ...(cached as object),
      meta: {
        ...(cached as any).meta,
        cache: "hit",
      },
    };
  };
  //沒有 cache，就用 Prisma 查資料庫
  const notes = await prisma.note.findMany({
    where: {
      AND: [ //裡面的條件都要同時成立。

        //如果 q 有值，就加入關鍵字搜尋條件。如果 q 沒有值，就給空物件，不限制關鍵字。
        normalized.q
          ? {
              OR: [ //只要其中一個欄位有包含 q，就算符合。
                { title: { contains: normalized.q } },
                { description: { contains: normalized.q } },
                { content: { contains: normalized.q } },
                { course: { contains: normalized.q } },
              ],
            }
          : {},
        normalized.course //只找 course 包含「工程數學」的筆記
          ? {
              course: {
                contains: normalized.course,
              },
            }
          : {}, //如果沒有傳 course，就不限制課程。
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
                  tag: { //Tag 的 name 裡面包含 normalized.tag。
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
    include: { //include：順便查作者、標籤、收藏 : 查 Note 的時候，順便把相關資料一起查出來。
      author: { //查作者資料，但只拿： id、name、email
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      tags: { //查出這篇筆記的標籤。因為 Note 和 Tag 中間有 NoteTag，所以要 include 真正的 tag。
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
