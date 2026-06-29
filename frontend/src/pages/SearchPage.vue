<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import type { Note, SearchMeta, SearchResponse } from "../types/note";

type SortMode = "relevance" | "latest" | "popular";

const notes = ref<Note[]>([]);
const meta = ref<SearchMeta | null>(null);

const keyword = ref("微積分");
const course = ref("");
const category = ref("");
const tag = ref("");

const sort = ref<SortMode>("relevance");
const page = ref(1);
const pageSize = 10;

const loading = ref(false);
const errorMessage = ref("");
const showAdvancedFilters = ref(false);

const quickKeywords = [
  "微積分",
  "工程數學",
  "熱力學",
  "自動控制",
  "材料力學",
  "流體力學",
  "機械設計",
  "期中考",
  "考古題",
];

const sortOptions: Array<{
  label: string;
  value: SortMode;
  description: string;
}> = [
  {
    label: "相關度",
    value: "relevance",
    description: "依 Ranking Score 排序",
  },
  {
    label: "最新",
    value: "latest",
    description: "依建立時間排序",
  },
  {
    label: "熱門",
    value: "popular",
    description: "依瀏覽、按讚、收藏排序",
  },
];

const totalResultText = computed(() => {
  if (!meta.value) return "準備搜尋";
  return `${meta.value.total} 筆結果｜第 ${meta.value.page} / ${meta.value.totalPages} 頁`;
});

const cacheLabel = computed(() => {
  if (!meta.value) return "Waiting";
  return meta.value.cache === "hit" ? "Cache Hit" : "Cache Miss";
});

const cacheClass = computed(() => {
  if (!meta.value) return "idle";
  return meta.value.cache === "hit" ? "hit" : "miss";
});

const activeFilterCount = computed(() => {
  return [course.value, category.value, tag.value].filter(Boolean).length;
});

const hasQueryCondition = computed(() => {
  return Boolean(
    keyword.value.trim() ||
      course.value.trim() ||
      category.value.trim() ||
      tag.value.trim()
  );
});

const topScore = computed(() => {
  return Math.max(...notes.value.map((note) => note.score ?? 0), 0);
});

function formatScore(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "0.00";
  return value.toFixed(2);
}

function formatPercent(value?: number) {
  if (value === undefined || Number.isNaN(value)) return "0";
  return Math.round(value).toString();
}

function scoreWidth(value?: number) {
  const score = value ?? 0;
  const maxScore = Math.max(topScore.value, 1);

  return `${Math.min((score / maxScore) * 100, 100)}%`;
}

function getScoreLevel(score?: number) {
  const value = score ?? 0;

  if (value >= 80) return "高度相關";
  if (value >= 60) return "中高度相關";
  if (value >= 40) return "部分相關";
  if (value > 0) return "低度相關";

  return "尚無分數";
}

function getMainReason(note: Note) {
  const detail = note.scoreDetail;

  if (!detail) return "尚未取得 scoreBreakdown";

  const signals = [
    {
      label: "標題命中",
      value: detail.titleMatch,
    },
    {
      label: "課程命中",
      value: detail.courseMatch,
    },
    {
      label: "標籤命中",
      value: detail.tagMatch,
    },
    {
      label: "分類命中",
      value: detail.categoryMatch,
    },
    {
      label: "內容命中",
      value: detail.contentMatch,
    },
    {
      label: "熱門度",
      value: detail.popularity,
    },
    {
      label: "品質分數",
      value: detail.quality,
    },
    {
      label: "新鮮度",
      value: detail.recency,
    },
  ];

  const bestSignal = signals.sort((a, b) => b.value - a.value)[0];

  if (!bestSignal || bestSignal.value <= 0) {
    return "主要由資料完整度與排序規則決定";
  }

  return `主要原因：${bestSignal.label} ${Math.round(bestSignal.value)} 分`;
}

async function fetchSearchResults() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await api.get<SearchResponse>("/search", {
      params: {
        q: keyword.value.trim() || undefined,
        course: course.value.trim() || undefined,
        category: category.value.trim() || undefined,
        tag: tag.value.trim() || undefined,
        sort: sort.value,
        page: page.value,
        pageSize,
      },
    });

    notes.value = res.data.data;
    meta.value = res.data.meta;
  } catch (error) {
    console.error(error);
    errorMessage.value =
      "搜尋失敗，請確認後端已啟動，並完成 Prisma migration / seed。";
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  fetchSearchResults();
}

function applyQuickKeyword(value: string) {
  keyword.value = value;
  page.value = 1;
  fetchSearchResults();
}

function changeSort(nextSort: SortMode) {
  sort.value = nextSort;
  page.value = 1;
  fetchSearchResults();
}

function clearAdvancedFilters() {
  course.value = "";
  category.value = "";
  tag.value = "";
  page.value = 1;
  fetchSearchResults();
}

function handleReset() {
  keyword.value = "";
  course.value = "";
  category.value = "";
  tag.value = "";
  sort.value = "relevance";
  page.value = 1;
  fetchSearchResults();
}

function changePage(nextPage: number) {
  if (!meta.value) return;
  if (nextPage < 1 || nextPage > meta.value.totalPages) return;

  page.value = nextPage;
  fetchSearchResults();
}

onMounted(fetchSearchResults);
</script>

<template>
  <section class="search-page page-frame">
    <section class="search-hero">
      <div class="hero-copy">
        <p class="page-kicker">Search Intelligence</p>

        <h1>
          搜尋筆記，<br />
          看懂排序原因。
        </h1>

        <p>
          這裡是 UniNote 的核心展示頁。使用者只需要輸入一個搜尋詞，
          系統會召回候選筆記、計算 Ranking Score，並回傳可 debug 的
          scoreBreakdown。
        </p>

        <div class="hero-tags">
          <span>Rule-based Ranking</span>
          <span>Score Breakdown</span>
          <span>Cache Demo</span>
        </div>
      </div>

      <aside class="hero-status">
        <span :class="['cache-pill', cacheClass]">
          {{ cacheLabel }}
        </span>

        <strong>{{ meta?.total ?? 0 }}</strong>
        <small>results found</small>

        <div class="status-divider"></div>

        <p>
          Candidate limit:
          <b>{{ meta?.candidateLimit ?? 1000 }}</b>
        </p>
      </aside>
    </section>

    <section class="search-console">
      <div class="main-search-row">
        <div class="main-search-field">
          <label>Search Query</label>

          <input
            v-model="keyword"
            placeholder="搜尋課程、筆記、考古題，例如：自控 期中考、工程數學 傅立葉"
            @keyup.enter="handleSearch"
          />
        </div>

        <button
          type="button"
          class="run-search-btn"
          :disabled="loading"
          @click="handleSearch"
        >
          {{ loading ? "搜尋中..." : "執行搜尋" }}
        </button>
      </div>

      <div class="quick-row">
        <span>熱門搜尋</span>

        <button
          v-for="item in quickKeywords"
          :key="item"
          type="button"
          :class="{ active: keyword === item }"
          @click="applyQuickKeyword(item)"
        >
          {{ item }}
        </button>
      </div>

      <div class="console-divider"></div>

      <div class="sort-row">
        <div>
          <span class="section-label">排序模式</span>

          <p>
            相關度使用 Ranking Score，最新與熱門則作為對照排序。
          </p>
        </div>

        <div class="sort-tabs">
          <button
            v-for="option in sortOptions"
            :key="option.value"
            type="button"
            :class="{ active: sort === option.value }"
            @click="changeSort(option.value)"
          >
            <strong>{{ option.label }}</strong>
            <small>{{ option.description }}</small>
          </button>
        </div>
      </div>

      <div class="advanced-toggle-row">
        <button
          type="button"
          class="advanced-toggle"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <span>
            {{ showAdvancedFilters ? "收合進階篩選" : "展開進階篩選" }}
          </span>

          <b v-if="activeFilterCount > 0">
            {{ activeFilterCount }}
          </b>
        </button>

        <button
          v-if="hasQueryCondition"
          type="button"
          class="reset-link"
          @click="handleReset"
        >
          清除全部條件
        </button>
      </div>

      <div v-if="showAdvancedFilters" class="advanced-panel">
        <div class="filter-field">
          <label>Course</label>

          <input
            v-model="course"
            placeholder="例如：工程數學、自動控制、熱力學"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="filter-field">
          <label>Category</label>

          <input
            v-model="category"
            placeholder="例如：考試整理、課堂筆記、實驗報告"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="filter-field">
          <label>Tag</label>

          <input
            v-model="tag"
            placeholder="例如：期中考、考古題、公式整理"
            @keyup.enter="handleSearch"
          />
        </div>

        <div class="filter-actions">
          <button type="button" class="secondary-action" @click="handleSearch">
            套用篩選
          </button>

          <button type="button" class="ghost-action" @click="clearAdvancedFilters">
            清除篩選
          </button>
        </div>
      </div>
    </section>

    <section class="result-toolbar">
      <div>
        <strong>{{ totalResultText }}</strong>

        <span>
          排序：{{ meta?.sort ?? sort }} ｜ Cache：{{ meta?.cache ?? "-" }}
        </span>
      </div>

      <router-link to="/create" class="secondary-action">
        新增可搜尋筆記
      </router-link>
    </section>

    <section v-if="loading" class="state-panel">
      <div class="spinner"></div>

      <h3>搜尋中</h3>

      <p>
        系統正在召回候選資料、計算 Ranking Score，並準備回傳
        scoreBreakdown。
      </p>
    </section>

    <section v-else-if="errorMessage" class="state-panel error">
      <h3>搜尋失敗</h3>

      <p>{{ errorMessage }}</p>
    </section>

    <section v-else-if="notes.length > 0" class="result-list">
      <article v-for="(note, index) in notes" :key="note.id" class="result-card">
        <div class="rank-panel">
          <span>Rank</span>

          <strong>#{{ (meta?.page ?? 1) * pageSize - pageSize + index + 1 }}</strong>

          <div class="rank-score">
            <b>{{ formatScore(note.score) }}</b>
            <small>{{ getScoreLevel(note.score) }}</small>
          </div>
        </div>

        <div class="result-content">
          <div class="result-topline">
            <div class="meta-chips">
              <span>{{ note.course || "未指定課程" }}</span>
              <span>{{ note.category || "未分類" }}</span>
            </div>

            <p class="reason-text">
              {{ getMainReason(note) }}
            </p>
          </div>

          <router-link :to="`/notes/${note.id}`" class="result-title">
            {{ note.title }}
          </router-link>

          <p class="description">
            {{ note.description || "這篇筆記尚未提供描述。" }}
          </p>

          <p class="content-preview">
            {{ note.content || "尚未建立可搜尋內容。" }}
          </p>

          <div class="score-bar">
            <i :style="{ width: scoreWidth(note.score) }"></i>
          </div>

          <div v-if="note.tags && note.tags.length > 0" class="tag-list">
            <span v-for="item in note.tags" :key="item.id">
              #{{ item.name }}
            </span>
          </div>

          <details v-if="note.scoreDetail" class="score-detail">
            <summary>
              <span>展開 Ranking 明細</span>
              <b>Total {{ formatScore(note.scoreDetail.total) }}</b>
            </summary>

            <div class="breakdown-section">
              <h4>核心分數</h4>

              <div class="breakdown-grid main">
                <div>
                  <span>Relevance</span>
                  <strong>{{ formatPercent(note.scoreDetail.relevance) }}</strong>
                </div>

                <div>
                  <span>Quality</span>
                  <strong>{{ formatPercent(note.scoreDetail.quality) }}</strong>
                </div>

                <div>
                  <span>Popularity</span>
                  <strong>{{ formatPercent(note.scoreDetail.popularity) }}</strong>
                </div>

                <div>
                  <span>Freshness</span>
                  <strong>{{ formatPercent(note.scoreDetail.recency) }}</strong>
                </div>
              </div>
            </div>

            <div class="breakdown-section">
              <h4>相關性訊號</h4>

              <div class="breakdown-grid">
                <div>
                  <span>Title</span>
                  <strong>{{ formatPercent(note.scoreDetail.titleMatch) }}</strong>
                </div>

                <div>
                  <span>Course</span>
                  <strong>{{ formatPercent(note.scoreDetail.courseMatch) }}</strong>
                </div>

                <div>
                  <span>Tag</span>
                  <strong>{{ formatPercent(note.scoreDetail.tagMatch) }}</strong>
                </div>

                <div>
                  <span>Category</span>
                  <strong>{{ formatPercent(note.scoreDetail.categoryMatch) }}</strong>
                </div>

                <div>
                  <span>Description</span>
                  <strong>{{ formatPercent(note.scoreDetail.descriptionMatch) }}</strong>
                </div>

                <div>
                  <span>Content</span>
                  <strong>{{ formatPercent(note.scoreDetail.contentMatch) }}</strong>
                </div>
              </div>
            </div>
          </details>
        </div>
      </article>
    </section>

    <section v-else class="state-panel">
      <h3>查無結果</h3>

      <p>
        可以更換關鍵字、清除進階篩選，或先新增測試筆記。
      </p>
    </section>

    <section v-if="meta && meta.totalPages > 1" class="pagination-panel">
      <button
        type="button"
        class="ghost-action"
        :disabled="meta.page <= 1"
        @click="changePage(meta.page - 1)"
      >
        上一頁
      </button>

      <span>{{ meta.page }} / {{ meta.totalPages }}</span>

      <button
        type="button"
        class="ghost-action"
        :disabled="meta.page >= meta.totalPages"
        @click="changePage(meta.page + 1)"
      >
        下一頁
      </button>
    </section>
  </section>
</template>

<style scoped>
.search-page {
  padding: 28px 0 64px;
}

.search-hero {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 24px;
  padding: 38px;
  border-radius: 46px;
  color: white;
  background:
    radial-gradient(circle at 78% 18%, rgba(163, 230, 53, 0.28), transparent 28%),
    radial-gradient(circle at 12% 12%, rgba(34, 211, 238, 0.16), transparent 32%),
    linear-gradient(135deg, #08111f 0%, #172554 48%, #3b0764 100%);
  box-shadow: 0 34px 100px rgba(15, 23, 42, 0.24);
}

.hero-copy h1 {
  margin: 0;
  font-size: clamp(48px, 7vw, 92px);
  line-height: 0.95;
  letter-spacing: -0.09em;
}

.hero-copy p {
  max-width: 780px;
  margin: 20px 0 0;
  color: #cbd5e1;
  line-height: 1.85;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 28px;
}

.hero-tags span {
  padding: 9px 13px;
  border-radius: 999px;
  color: white;
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 950;
}

.hero-status {
  min-height: 240px;
  padding: 24px;
  display: grid;
  align-content: center;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
}

.cache-pill {
  width: fit-content;
  padding: 8px 11px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 1000;
}

.cache-pill.hit {
  color: #1a2e05;
  background: #a3e635;
}

.cache-pill.miss {
  color: #7c2d12;
  background: #fed7aa;
}

.cache-pill.idle {
  color: #dbeafe;
  background: rgba(255, 255, 255, 0.12);
}

.hero-status strong {
  margin-top: 12px;
  font-size: 76px;
  line-height: 0.95;
  letter-spacing: -0.08em;
}

.hero-status small {
  color: #cbd5e1;
  font-weight: 800;
}

.status-divider {
  height: 1px;
  margin: 18px 0;
  background: rgba(255, 255, 255, 0.16);
}

.hero-status p {
  margin: 0;
  color: #cbd5e1;
}

.hero-status b {
  color: white;
}

.search-console {
  margin-top: 24px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 34px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(16px);
}

.main-search-row {
  display: grid;
  grid-template-columns: 1fr 170px;
  gap: 14px;
  align-items: end;
}

.main-search-field label,
.filter-field label,
.section-label {
  display: block;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
  font-weight: 1000;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.main-search-field input {
  min-height: 56px;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 800;
}

.run-search-btn {
  min-height: 56px;
  border: 0;
  border-radius: 22px;
  color: white;
  background: linear-gradient(135deg, var(--blue), var(--violet));
  font-weight: 1000;
  box-shadow: 0 18px 34px rgba(56, 103, 255, 0.24);
}

.quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  align-items: center;
  margin-top: 16px;
}

.quick-row > span {
  margin-right: 4px;
  color: #64748b;
  font-size: 13px;
  font-weight: 950;
}

.quick-row button {
  border: 1px solid rgba(148, 163, 184, 0.26);
  padding: 8px 11px;
  border-radius: 999px;
  color: #334155;
  background: rgba(255, 255, 255, 0.72);
  font-size: 13px;
  font-weight: 900;
}

.quick-row button.active,
.quick-row button:hover {
  color: white;
  border-color: transparent;
  background: linear-gradient(135deg, var(--blue), var(--violet));
}

.console-divider {
  height: 1px;
  margin: 22px 0;
  background: rgba(148, 163, 184, 0.22);
}

.sort-row {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
  align-items: center;
}

.sort-row p {
  margin: 0;
  color: #64748b;
  line-height: 1.65;
  font-size: 14px;
}

.sort-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 11px;
}

.sort-tabs button {
  border: 1px solid rgba(148, 163, 184, 0.28);
  padding: 14px;
  border-radius: 22px;
  text-align: left;
  background: rgba(255, 255, 255, 0.72);
  transition: 0.2s ease;
}

.sort-tabs button strong {
  display: block;
  color: #111827;
  font-size: 15px;
  font-weight: 1000;
}

.sort-tabs button small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  line-height: 1.4;
}

.sort-tabs button.active {
  border-color: transparent;
  background: linear-gradient(135deg, var(--blue), var(--violet));
  box-shadow: 0 16px 30px rgba(56, 103, 255, 0.22);
}

.sort-tabs button.active strong,
.sort-tabs button.active small {
  color: white;
}

.advanced-toggle-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin-top: 18px;
}

.advanced-toggle {
  border: 1px solid rgba(148, 163, 184, 0.26);
  padding: 10px 14px;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  border-radius: 999px;
  color: #334155;
  background: rgba(255, 255, 255, 0.74);
  font-weight: 1000;
}

.advanced-toggle b {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  color: white;
  background: var(--blue);
  font-size: 12px;
}

.reset-link {
  border: 0;
  padding: 10px 12px;
  color: #64748b;
  background: transparent;
  font-weight: 900;
}

.reset-link:hover {
  color: #dc2626;
}

.advanced-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 13px;
  margin-top: 16px;
  padding: 16px;
  border: 1px dashed rgba(148, 163, 184, 0.45);
  border-radius: 26px;
  background: rgba(248, 250, 252, 0.74);
}

.filter-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.result-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin: 24px 0;
}

.result-toolbar strong,
.result-toolbar span {
  display: block;
}

.result-toolbar strong {
  color: #111827;
  font-size: 23px;
  letter-spacing: -0.04em;
}

.result-toolbar span {
  margin-top: 5px;
  color: #64748b;
}

.result-list {
  display: grid;
  gap: 18px;
}

.result-card {
  display: grid;
  grid-template-columns: 148px 1fr;
  gap: 20px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 34px;
  background:
    radial-gradient(circle at top right, rgba(56, 103, 255, 0.08), transparent 28%),
    rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-soft);
  transition: 0.22s ease;
}

.result-card:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow-hard);
}

.rank-panel {
  min-height: 230px;
  padding: 18px;
  display: grid;
  align-content: space-between;
  border-radius: 28px;
  color: #08111f;
  background:
    radial-gradient(circle at 22% 20%, rgba(255, 255, 255, 0.7), transparent 26%),
    linear-gradient(135deg, #a3e635, #22d3ee);
}

.rank-panel > span {
  font-size: 12px;
  font-weight: 1000;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.rank-panel > strong {
  font-size: 42px;
  line-height: 1;
  letter-spacing: -0.08em;
}

.rank-score b,
.rank-score small {
  display: block;
}

.rank-score b {
  font-size: 38px;
  line-height: 1;
  letter-spacing: -0.08em;
}

.rank-score small {
  margin-top: 6px;
  font-weight: 900;
}

.result-content {
  min-width: 0;
}

.result-topline {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chips span {
  padding: 7px 10px;
  border-radius: 999px;
  color: #3867ff;
  background: #eff6ff;
  font-size: 12px;
  font-weight: 950;
}

.reason-text {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  font-weight: 900;
}

.result-title {
  display: block;
  margin: 14px 0 8px;
  color: #0f172a;
  font-size: 29px;
  line-height: 1.15;
  font-weight: 1000;
  letter-spacing: -0.055em;
  text-decoration: none;
}

.result-title:hover {
  color: var(--blue);
}

.description,
.content-preview {
  margin: 0 0 10px;
  color: #64748b;
  line-height: 1.75;
}

.content-preview {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.score-bar {
  height: 10px;
  margin-top: 16px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.score-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--blue), var(--pink), var(--lime));
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.tag-list span {
  padding: 6px 9px;
  border-radius: 999px;
  color: #334155;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 900;
}

.score-detail {
  margin-top: 16px;
}

.score-detail summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 18px;
  color: #111827;
  background: #f8fafc;
  cursor: pointer;
  font-weight: 1000;
}

.score-detail summary b {
  color: var(--blue);
}

.breakdown-section {
  margin-top: 14px;
}

.breakdown-section h4 {
  margin: 0 0 10px;
  color: #334155;
  font-size: 14px;
  font-weight: 1000;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 9px;
}

.breakdown-grid.main {
  grid-template-columns: repeat(4, 1fr);
}

.breakdown-grid div {
  padding: 13px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.86);
}

.breakdown-grid span {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 1000;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.breakdown-grid strong {
  display: block;
  margin-top: 6px;
  color: #111827;
  font-size: 23px;
  letter-spacing: -0.04em;
}

.pagination-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 26px;
}

.pagination-panel span {
  font-weight: 1000;
}

@media (max-width: 980px) {
  .search-hero,
  .result-card {
    grid-template-columns: 1fr;
  }

  .sort-row {
    grid-template-columns: 1fr;
  }

  .advanced-panel {
    grid-template-columns: 1fr;
  }

  .breakdown-grid,
  .breakdown-grid.main {
    grid-template-columns: repeat(2, 1fr);
  }

  .rank-panel {
    min-height: 160px;
  }
}

@media (max-width: 620px) {
  .search-page {
    padding-top: 14px;
  }

  .search-hero {
    padding: 26px;
    border-radius: 34px;
  }

  .main-search-row {
    grid-template-columns: 1fr;
  }

  .sort-tabs {
    grid-template-columns: 1fr;
  }

  .result-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .result-topline {
    flex-direction: column;
  }

  .advanced-toggle-row {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-actions {
    flex-direction: column;
  }

  .breakdown-grid,
  .breakdown-grid.main {
    grid-template-columns: 1fr;
  }
}
</style>