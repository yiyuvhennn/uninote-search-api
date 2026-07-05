import {
  buildCjkNgrams,
  buildSearchText,
  normalizeText,
  tokenize,
} from "./textProcessing";

type PlainTag = {
  id?: number;
  name?: string | null;
};

type NoteTagRelation = {
  tag?: {
    id?: number;
    name?: string | null;
  } | null;
};
type NoteTagLike = PlainTag | NoteTagRelation;

type RankableNote = {
  title: string;
  description?: string | null;
  content?: string | null;
  searchText?: string | null;
  course?: string | null;
  category?: string | null;
  fileUrl?: string | null;
  views?: number | null;
  likes?: number | null;
  createdAt: Date | string;
  favorites?: unknown[];
  tags?: NoteTagLike[];
};

export type ScoreDetail = {
  titleMatch: number;
  courseMatch: number;
  categoryMatch: number;
  tagMatch: number;
  descriptionMatch: number;
  contentMatch: number;
  textSimilarity: number;

  relevance: number;
  quality: number;
  popularity: number;
  recency: number;
  total: number;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function isPlainTag(item: NoteTagLike): item is PlainTag {
  return "name" in item;
}

function isNoteTagRelation(item: NoteTagLike): item is NoteTagRelation {
  return "tag" in item;
}

function getTagText(tags?: NoteTagLike[]) {
  if (!tags || tags.length === 0) return "";

  return tags
    .map((item) => {
      if (isPlainTag(item)) {
        return item.name;
      }

      if (isNoteTagRelation(item)) {
        return item.tag?.name;
      }

      return "";
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * 文字相關度分數：0 ~ 100
 *
 * 規則：
 * 1. 完全相同：100
 * 2. 整句包含：85
 * 3. 拆詞後部分命中：依照命中比例給分，最高 70
 */
function textMatchScore(text: string | null | undefined, keyword: string) {
  const source = normalizeText(text);
  const target = normalizeText(keyword);

  if (!source || !target) return 0;

  if (source === target) return 100;
  if (source.includes(target)) return 85;

  const tokens = tokenize(target);

  if (tokens.length === 0) return 0;

  const matchedTokens = tokens.filter((token) => source.includes(token)).length;

  return Math.round((matchedTokens / tokens.length) * 70);
}

/**
 * calculateTextSimilarity
 *
 * 第一版文字相似度使用 token overlap：
 * 1. 把 query 切成 tokens
 * 2. 把 searchText 切成 tokens
 * 3. 計算 query tokens 有多少出現在 searchText 裡
 *
 * 例如 query = "工程數學 傅立葉"，兩個詞都命中就是 100 分，只命中一個就是 50 分。
 */
export function calculateTextSimilarity(
  query: string,
  searchText: string | null | undefined
) {
  const normalizedQuery = normalizeText(query);
  const normalizedSearchText = normalizeText(searchText);
  const queryTokens = Array.from(new Set(tokenize(query)));
  const searchTokens = new Set(tokenize(searchText));

  if (!normalizedQuery || !normalizedSearchText) {
    return 0;
  }

  if (normalizedSearchText.includes(normalizedQuery)) {
    return 100;
  }

  const matchedCount = queryTokens.filter((token) =>
    searchTokens.has(token) || normalizedSearchText.includes(token)
  ).length;
  const tokenScore =
    queryTokens.length > 0 ? (matchedCount / queryTokens.length) * 100 : 0;

  const cjkGrams = buildCjkNgrams(query);
  const matchedGramCount = cjkGrams.filter((gram) =>
    normalizedSearchText.includes(gram)
  ).length;
  const cjkScore =
    cjkGrams.length > 0 ? (matchedGramCount / cjkGrams.length) * 100 : 0;

  return clamp(Math.max(tokenScore, cjkScore));
}

/**
 * 品質分數：0 ~ 100
 *
 * 這裡先用目前資料庫已有欄位做 MVP：
 * - title 是否完整
 * - description 是否完整
 * - content 是否足夠
 * - course/category 是否有填
 * - 是否有 tag
 * - 是否有 fileUrl
 */
function calculateQualityScore(note: RankableNote) {
  let score = 0;

  if (note.title && note.title.trim().length >= 6) score += 18;
  if (note.description && note.description.trim().length >= 20) score += 18;
  if (note.content && note.content.trim().length >= 120) score += 28;
  if (note.course) score += 12;
  if (note.category) score += 8;
  if ((note.tags?.length || 0) > 0) score += 8;
  if (note.fileUrl) score += 8;

  return clamp(score);
}

/**
 * 熱門度分數：0 ~ 100
 *
 * 使用 log1p 是為了避免 views / likes 太大時直接壓過相關性。
 * 例如 1000 views 不應該是 10 views 的 100 倍重要。
 */
function calculatePopularityScore(note: RankableNote) {
  const favoriteCount = note.favorites?.length || 0;
  const views = note.views || 0;
  const likes = note.likes || 0;

  const viewScore = Math.log1p(views) * 10;
  const likeScore = Math.log1p(likes) * 16;
  const favoriteScore = Math.log1p(favoriteCount) * 20;

  return clamp(viewScore + likeScore + favoriteScore);
}

/**
 * 新鮮度分數：0 ~ 100
 *
 * 新資料加分，但不讓它壓過主要相關性。
 */
function calculateRecencyScore(createdAt: Date | string) {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) return 0;

  const daysOld = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);

  if (daysOld <= 7) return 100;
  if (daysOld <= 30) return 85;
  if (daysOld <= 90) return 65;
  if (daysOld <= 180) return 45;
  if (daysOld <= 365) return 25;

  return 10;
}

/**
 * calculateNoteScore
 *
 * 這是目前 Ranking 的核心。
 *
 * 設計邏輯：
 * - relevance：搜尋相關性，最重要
 * - quality：內容品質，避免空資料排太前面
 * - popularity：使用者互動訊號
 * - recency：新鮮度，避免舊資料長期霸榜
 */
export function calculateNoteScore(
  note: RankableNote,
  keyword: string
): ScoreDetail {
  const titleMatch = textMatchScore(note.title, keyword);
  const courseMatch = textMatchScore(note.course, keyword);
  const categoryMatch = textMatchScore(note.category, keyword);
  const tagMatch = textMatchScore(getTagText(note.tags), keyword);
  const descriptionMatch = textMatchScore(note.description, keyword);
  const contentMatch = textMatchScore(note.content, keyword);
  const searchableText = note.searchText || buildSearchText(note);
  const textSimilarity = calculateTextSimilarity(keyword, searchableText);

  /**
   * Relevance 內部權重：
   * - title：標題最重要
   * - tag：人工分類訊號很強
   * - course：課程名稱對學習筆記很重要
   * - category：分類輔助
   * - description/content：補充判斷
   */
  const relevance = clamp(
    titleMatch * 0.32 +
      tagMatch * 0.2 +
      courseMatch * 0.18 +
      categoryMatch * 0.1 +
      descriptionMatch * 0.1 +
      contentMatch * 0.1
  );

  const quality = calculateQualityScore(note);
  const popularity = calculatePopularityScore(note);
  const recency = calculateRecencyScore(note.createdAt);

  /**
   * 總分權重：
   * - relevance 最高，因為搜尋結果最重要的是相關性
   * - textSimilarity 補強整篇筆記文字與查詢詞的整體重疊程度
   * - quality 防止空內容或低品質資料排太前面
   * - popularity 作為使用者行為訊號
   * - recency 只做輔助，不讓新資料直接霸榜
   */
  const total =
    relevance * 0.45 +
    textSimilarity * 0.15 +
    quality * 0.12 +
    popularity * 0.18 +
    recency * 0.1;

  return {
    titleMatch: Math.round(titleMatch),
    courseMatch: Math.round(courseMatch),
    categoryMatch: Math.round(categoryMatch),
    tagMatch: Math.round(tagMatch),
    descriptionMatch: Math.round(descriptionMatch),
    contentMatch: Math.round(contentMatch),
    textSimilarity: Number(textSimilarity.toFixed(2)),

    relevance: Number(relevance.toFixed(2)),
    quality: Number(quality.toFixed(2)),
    popularity: Number(popularity.toFixed(2)),
    recency: Number(recency.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}
