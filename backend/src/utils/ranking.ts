type RankableNote = {
  title: string;
  description?: string | null;
  content?: string | null;
  views?: number | null;
  likes?: number | null;
  createdAt: Date | string;
  favorites?: unknown[];
};

export type ScoreDetail = {
  titleMatch: number;
  descriptionMatch: number;
  contentMatch: number;
  popularity: number;
  recency: number;
  total: number;
};

function normalizeText(text: string | null | undefined) {
  return (text || "").toLowerCase().trim();
}

function countKeywordMatch(text: string | null | undefined, keyword: string) {
  const source = normalizeText(text);
  const target = normalizeText(keyword);

  if (!source || !target) {
    return 0;
  }

  return source.includes(target) ? 1 : 0;
}

function calculateRecency(createdAt: Date | string) {
  const createdTime = new Date(createdAt).getTime();
  const daysOld = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);

  return Math.max(0, 30 - daysOld) / 30;
}

export function calculateNoteScore(note: RankableNote, keyword: string): ScoreDetail {
  const titleMatch = countKeywordMatch(note.title, keyword);
  const descriptionMatch = countKeywordMatch(note.description, keyword);
  const contentMatch = countKeywordMatch(note.content, keyword);
  const favoriteCount = note.favorites?.length || 0;

  const popularity = (note.views || 0) * 0.1 + (note.likes || 0) * 0.5 + favoriteCount * 1;
  const recency = calculateRecency(note.createdAt);

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
}
