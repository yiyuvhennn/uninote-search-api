type SearchTextTag =
  | string
  | {
      name?: string | null;
    }
  | {
      tag?: {
        name?: string | null;
      } | null;
    };

type SearchTextNote = {
  title?: string | null;
  description?: string | null;
  content?: string | null;
  course?: string | null;
  category?: string | null;
  tags?: SearchTextTag[] | null;
};

/**
 * normalizeText
 *
 * 把不同來源的文字整理成一致格式。
 * 例如：大小寫統一、標點符號改成空白、多個空白壓成一個空白。
 * 這樣搜尋與相似度計算時，比較不會因為格式不同而漏掉命中。
 */
export function normalizeText(text: string | null | undefined): string {
  return (text || "")
    .toLowerCase()
    .replace(/[｜|、，,。．.：:；;！!？?（）()［\][\]{}「」『』"'`]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * tokenize
 *
 * 將整理後的文字切成 tokens。
 * 第一版先用空白切詞，並移除空字串，目標是簡單、可解釋、容易展示。
 */
export function tokenize(text: string | null | undefined): string[] {
  return normalizeText(text)
    .split(" ")
    .map((word) => word.trim())
    .filter(Boolean);
}

/**
 * buildCjkNgrams
 *
 * 針對沒有空白的中文查詢建立簡單 n-gram。
 * 例如「工程數學傅立葉」會產生「工程數學」與「傅立葉」這類片段，
 * 讓搜尋不需要複雜 NLP 套件也能有基本中文 contains fallback。
 */
export function buildCjkNgrams(
  text: string | null | undefined,
  sizes = [4, 3, 2]
): string[] {
  const compactText = normalizeText(text).replace(/\s+/g, "");
  const cjkText = compactText.replace(/[^\u4e00-\u9fff]/g, "");

  if (cjkText.length < 2) {
    return [];
  }

  const grams = new Set<string>();

  sizes.forEach((size) => {
    if (cjkText.length < size) return;

    for (let index = 0; index <= cjkText.length - size; index += 1) {
      grams.add(cjkText.slice(index, index + size));
    }
  });

  return Array.from(grams);
}

/**
 * getTagName
 *
 * 支援兩種 tag 格式：
 * 1. 前端或一般資料：{ name: "期中考" }
 * 2. Prisma relation：{ tag: { name: "期中考" } }
 */
function getTagName(item: SearchTextTag): string {
  if (typeof item === "string") {
    return item;
  }

  if ("tag" in item) {
    return item.tag?.name || "";
  }

  return (item as { name?: string | null }).name || "";
}

/**
 * buildSearchText
 *
 * 將一篇筆記中適合被搜尋的欄位合併成一段文字。
 * 目前來源包含：title、description、content、course、category、tags。
 */
export function buildSearchText(note: SearchTextNote): string {
  const tagText = (note.tags || []).map(getTagName).join(" ");
  const parts = [
    note.title,
    note.description,
    note.content,
    note.course,
    note.category,
    tagText,
  ];

  return normalizeText(parts.filter(Boolean).join(" "));
}
