//第 3～11 行：定義「可以被算分的筆記」

type RankableNote = {
  title: string;
  description?: string | null;
  content?: string | null;
  views?: number | null;
  likes?: number | null;
  createdAt: Date | string;
  favorites?: unknown[];
};

//第 13～20 行：定義「分數明細」的格式

export type ScoreDetail = {
  titleMatch: number;
  descriptionMatch: number;
  contentMatch: number;
  popularity: number;
  recency: number;
  total: number;
};

//第 26～28 行：文字標準化函式

function normalizeText(text: string | null | undefined) {
  return (text || "").toLowerCase().trim(); // .toLowerCase()自動轉小寫, .trim()：去掉前後空白
};

// 第 32～39 行：判斷關鍵字有沒有命中

function countKeywordMatch(text: string | null | undefined, keyword: string) {
  const source = normalizeText(text);
  const target = normalizeText(keyword);
  if (!source || !target) {
    return 0;
  }
  return source.includes(target) ? 1 : 0;
};

//第 43～47 行：計算筆記新鮮度

function calculateRecency(createdAt: Date | string) {
  const createdTime = new Date(createdAt).getTime();
  const daysOld = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
  return Math.max(0, 30 - daysOld) / 30;
};

//第 51～72 行：主函式，真正計算筆記分數

export function calculateNoteScore(note: RankableNote, keyword: string): ScoreDetail {
  const titleMatch = countKeywordMatch(note.title, keyword); //計算'標題'有沒有命中關鍵字
  const descriptionMatch = countKeywordMatch(note.description, keyword); //計算'描述'有沒有命中關鍵字
  const contentMatch = countKeywordMatch(note.content, keyword); //計算'內容'有沒有命中關鍵字
  const favoriteCount = note.favorites?.length || 0;//計算'收藏數'
  const popularity = (note.views || 0) * 0.1 + (note.likes || 0) * 0.5 + favoriteCount * 1;//計算'熱門度'
  const recency = calculateRecency(note.createdAt);//計算'新鮮度'
  const total =
    titleMatch * 5 +
    descriptionMatch * 2 +
    contentMatch * 2 +
    popularity * 3 +
    recency * 1;
  return {
    titleMatch,
    descriptionMatch,
    contentMatch,
    popularity: Number(popularity.toFixed(2)),
    recency: Number(recency.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
};
