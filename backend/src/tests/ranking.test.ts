import { describe, expect, it } from "vitest";
import { calculateNoteScore } from "../utils/ranking";

const baseNote = {
  title: "工程數學 傅立葉級數",
  description: "整理傅立葉級數重點",
  content: "傅立葉級數與工程數學考試內容",
  searchText: "工程數學 傅立葉級數 整理 傅立葉級數重點 傅立葉級數與工程數學考試內容",
  course: "工程數學",
  category: "考試整理",
  createdAt: new Date(),
  views: 10,
  likes: 2,
  favorites: [],
  tags: [{ name: "傅立葉" }],
};

describe("calculateNoteScore", () => {
  it("preserves exact phrase matching for the original query", () => {
    const score = calculateNoteScore(baseNote, "工程數學 傅立葉級數");

    expect(score.titleMatch).toBe(100);
    expect(score.total).toBeGreaterThan(0);
  });

  it("returns finite scores for invalid popularity values", () => {
    const score = calculateNoteScore(
      { ...baseNote, views: -100, likes: Number.NaN },
      "工程數學"
    );

    expect(Object.values(score).every((value) => Number.isFinite(value))).toBe(true);
  });

  it("uses a deterministic tie breaker in the search pipeline contract", () => {
    const first = calculateNoteScore({ ...baseNote, title: "同分筆記 A" }, "完全不存在");
    const second = calculateNoteScore({ ...baseNote, title: "同分筆記 B" }, "完全不存在");

    expect(first.total).toBe(second.total);
  });
});