<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import type { Note, SearchMeta, SearchResponse } from "../types/note";

const notes = ref<Note[]>([]);
const meta = ref<SearchMeta | null>(null);
const loading = ref(false);
const errorMessage = ref("");

const keyword = ref("微積分");
const course = ref("");
const category = ref("");
const tag = ref("");
const sort = ref<"relevance" | "latest" | "popular">("relevance");
const page = ref(1);
const pageSize = ref(6);

const resultText = computed(() => {
  if (!meta.value) return "尚未搜尋";
  return `共 ${meta.value.total} 筆結果，第 ${meta.value.page} / ${meta.value.totalPages || 1} 頁`;
});

const cacheLabel = computed(() => {
  if (!meta.value) return "尚未查詢";
  return meta.value.cache === "hit" ? "Cache Hit" : "Cache Miss";
});

const cacheClass = computed(() => {
  if (!meta.value) return "";
  return meta.value.cache === "hit" ? "hit" : "miss";
});

function formatScore(value?: number) {
  return value === undefined ? "0.00" : value.toFixed(2);
}

function formatNumber(value?: number) {
  return value === undefined ? "0" : value.toLocaleString("zh-TW");
}

async function fetchSearchResults() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await api.get<SearchResponse>("/search", {
      params: {
        q: keyword.value || undefined,
        course: course.value || undefined,
        category: category.value || undefined,
        tag: tag.value || undefined,
        sort: sort.value,
        page: page.value,
        pageSize: pageSize.value,
      },
    });

    notes.value = res.data.data;
    meta.value = res.data.meta;
  } catch (error) {
    console.error(error);
    errorMessage.value = "搜尋失敗，請確認後端是否已啟動，並完成 Prisma migration。";
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
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

function fillDemoQuery() {
  keyword.value = "傅立葉";
  course.value = "工程數學";
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

onMounted(() => {
  fetchSearchResults();
});
</script>

<template>
  <section class="search-page page-shell">
    <section class="hero-panel">
      <div>
        <p class="page-eyebrow">Search API System</p>
        <h1>UniNote 搜尋與排序系統</h1>
        <p class="hero-description">
          展示關鍵字搜尋、篩選、排序、Ranking Score 與基礎快取狀態。
          這一頁是整個 MVP 的核心展示頁，可以用來向業師說明系統邏輯。
        </p>
      </div>

      <div class="metric-card">
        <span>目前結果</span>
        <strong>{{ meta?.total ?? 0 }}</strong>
        <small :class="cacheClass">{{ cacheLabel }}</small>
      </div>
    </section>

    <section class="search-panel">
      <div class="panel-header">
        <div>
          <h2>搜尋條件</h2>
          <p>輸入關鍵字或搭配課程、分類、標籤篩選資料。</p>
        </div>

        <button type="button" class="secondary-action" @click="fillDemoQuery">
          套用 Demo
        </button>
      </div>

      <div class="filter-grid">
        <label class="wide">
          <span>關鍵字</span>
          <input
            v-model="keyword"
            placeholder="例如：微積分、API、傅立葉"
            @keyup.enter="handleSearch"
          />
        </label>

        <label>
          <span>課程</span>
          <input v-model="course" placeholder="例如：工程數學" @keyup.enter="handleSearch" />
        </label>

        <label>
          <span>分類</span>
          <input v-model="category" placeholder="例如：考試整理" @keyup.enter="handleSearch" />
        </label>

        <label>
          <span>標籤</span>
          <input v-model="tag" placeholder="例如：期中考" @keyup.enter="handleSearch" />
        </label>

        <label>
          <span>排序</span>
          <select v-model="sort" @change="handleSearch">
            <option value="relevance">相關性排序</option>
            <option value="latest">最新資料</option>
            <option value="popular">熱門度排序</option>
          </select>
        </label>

        <label>
          <span>每頁筆數</span>
          <select v-model="pageSize" @change="handleSearch">
            <option :value="3">每頁 3 筆</option>
            <option :value="6">每頁 6 筆</option>
            <option :value="10">每頁 10 筆</option>
          </select>
        </label>
      </div>

      <div class="search-actions">
        <button class="primary-action" type="button" @click="handleSearch">
          搜尋
        </button>

        <button class="secondary-action" type="button" @click="handleReset">
          清除
        </button>
      </div>
    </section>

    <section class="result-toolbar">
      <p>{{ resultText }}</p>

      <div v-if="meta" class="toolbar-tags">
        <span>排序：{{ meta.sort }}</span>
        <span :class="['cache-chip', cacheClass]">{{ cacheLabel }}</span>
      </div>
    </section>

    <div v-if="loading" class="state-panel">
      <div class="loader"></div>
      <h3>搜尋中</h3>
      <p>系統正在計算查詢結果與 Ranking Score。</p>
    </div>

    <div v-else-if="errorMessage" class="state-panel state-panel--error">
      <h3>搜尋失敗</h3>
      <p>{{ errorMessage }}</p>
      <button type="button" class="primary-action retry-btn" @click="fetchSearchResults">
        重新搜尋
      </button>
    </div>

    <section v-else-if="notes.length" class="result-grid">
      <article v-for="note in notes" :key="note.id" class="search-card">
        <div class="card-topline">
          <span>{{ note.course || "未分類課程" }}</span>
          <span>{{ note.category || "未分類" }}</span>
        </div>

        <router-link :to="`/notes/${note.id}`" class="search-card-title">
          {{ note.title }}
        </router-link>

        <p class="search-card-description">
          {{ note.description || "沒有描述" }}
        </p>

        <p class="search-card-content">
          {{ note.content || "尚未建立可搜尋內容" }}
        </p>

        <div v-if="note.tags?.length" class="tag-row">
          <span v-for="item in note.tags" :key="item.id" class="tag-chip">
            #{{ item.name }}
          </span>
        </div>

        <div class="score-box">
          <div class="score-main">
            <span>Score</span>
            <strong>{{ formatScore(note.score) }}</strong>
          </div>

          <div>
            <span>Views</span>
            <strong>{{ formatNumber(note.views) }}</strong>
          </div>

          <div>
            <span>Likes</span>
            <strong>{{ formatNumber(note.likes) }}</strong>
          </div>

          <div>
            <span>Favorites</span>
            <strong>{{ note.favoriteCount ?? note.favorites?.length ?? 0 }}</strong>
          </div>
        </div>

        <details v-if="note.scoreDetail" class="score-detail">
          <summary>Ranking 細節</summary>

          <div class="detail-grid">
            <div>
              <span>標題命中</span>
              <strong>{{ note.scoreDetail.titleMatch }}</strong>
            </div>

            <div>
              <span>描述命中</span>
              <strong>{{ note.scoreDetail.descriptionMatch }}</strong>
            </div>

            <div>
              <span>內容命中</span>
              <strong>{{ note.scoreDetail.contentMatch }}</strong>
            </div>

            <div>
              <span>熱門度</span>
              <strong>{{ note.scoreDetail.popularity }}</strong>
            </div>

            <div>
              <span>新近度</span>
              <strong>{{ note.scoreDetail.recency }}</strong>
            </div>
          </div>
        </details>
      </article>
    </section>

    <section v-else class="state-panel">
      <h3>查無符合條件的筆記</h3>
      <p>可以換關鍵字，或先新增筆記 / 執行 seed 建立測試資料。</p>

      <div class="empty-actions">
        <button type="button" class="secondary-action" @click="handleReset">
          清除條件
        </button>

        <router-link to="/create" class="primary-action">
          新增筆記
        </router-link>
      </div>
    </section>

    <section v-if="meta && meta.totalPages > 1" class="pagination-bar">
      <button
        class="secondary-action"
        type="button"
        :disabled="meta.page <= 1"
        @click="changePage(meta.page - 1)"
      >
        上一頁
      </button>

      <span>{{ meta.page }} / {{ meta.totalPages }}</span>

      <button
        class="secondary-action"
        type="button"
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
  margin: 0 auto;
}

.hero-panel {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 24px;
  align-items: stretch;
  padding: 32px;
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(124, 58, 237, 0.3), transparent 30%),
    linear-gradient(135deg, #111827, #334155);
  color: white;
  box-shadow: 0 22px 58px rgba(23, 32, 51, 0.24);
}

.hero-panel h1 {
  margin: 0;
  font-size: clamp(38px, 5vw, 58px);
  line-height: 1.08;
  letter-spacing: -0.07em;
}

.hero-description {
  max-width: 800px;
  color: #dbe3f0;
  line-height: 1.8;
  margin: 14px 0 0;
}

.metric-card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.metric-card span,
.metric-card small {
  color: #dbe3f0;
  font-weight: 850;
}

.metric-card strong {
  font-size: 52px;
  line-height: 1;
  letter-spacing: -0.07em;
}

.metric-card small.hit {
  color: #86efac;
}

.metric-card small.miss {
  color: #fde68a;
}

.search-panel {
  margin: 22px 0;
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: start;
  margin-bottom: 18px;
}

.panel-header h2 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  letter-spacing: -0.05em;
}

.panel-header p {
  margin: 8px 0 0;
  color: #64748b;
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.filter-grid .wide {
  grid-column: span 2;
}

label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.search-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
}

.result-toolbar,
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  color: #64748b;
  margin: 18px 0;
}

.result-toolbar p {
  margin: 0;
  font-weight: 850;
}

.toolbar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.toolbar-tags span,
.cache-chip {
  padding: 8px 11px;
  border-radius: 999px;
  background: white;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.cache-chip.hit {
  color: #15803d;
  background: #f0fdf4;
}

.cache-chip.miss {
  color: #b45309;
  background: #fffbeb;
}

.result-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.search-card {
  padding: 22px;
  border: 1px solid rgba(203, 213, 225, 0.86);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(66, 99, 235, 0.09), transparent 32%),
    rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07);
}

.card-topline,
.tag-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.card-topline span {
  font-size: 13px;
  color: #4263eb;
  background: #eef2ff;
  padding: 6px 9px;
  border-radius: 999px;
  font-weight: 900;
}

.search-card-title {
  display: block;
  text-decoration: none;
  color: #111827;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: -0.05em;
  margin: 14px 0 8px;
}

.search-card-title:hover {
  color: #4263eb;
}

.search-card-description,
.search-card-content {
  color: #526079;
  line-height: 1.7;
}

.search-card-description {
  margin: 0 0 10px;
}

.search-card-content {
  display: -webkit-box;
  margin: 0 0 14px;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tag-chip {
  background: #f1f5f9;
  color: #475569;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 850;
}

.score-box {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1.25fr repeat(3, 1fr);
  gap: 10px;
}

.score-box div {
  background: #f8fafc;
  border-radius: 16px;
  padding: 12px;
  border: 1px solid #e2e8f0;
}

.score-box .score-main {
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  border-color: #c7d2fe;
}

.score-box span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 900;
}

.score-box strong {
  display: block;
  margin-top: 5px;
  color: #111827;
  font-size: 20px;
  letter-spacing: -0.04em;
}

.score-detail {
  margin-top: 14px;
  color: #475569;
}

.score-detail summary {
  cursor: pointer;
  font-weight: 950;
  color: #4263eb;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.detail-grid div {
  padding: 10px;
  border-radius: 14px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.detail-grid span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 900;
}

.detail-grid strong {
  color: #111827;
  font-size: 16px;
}

.retry-btn {
  margin-top: 18px;
}

.empty-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.pagination-bar {
  justify-content: center;
}

.pagination-bar span {
  padding: 10px 14px;
  border-radius: 999px;
  background: white;
  color: #334155;
  font-weight: 950;
}

@media (max-width: 980px) {
  .hero-panel,
  .result-grid,
  .filter-grid {
    grid-template-columns: 1fr;
  }

  .filter-grid .wide {
    grid-column: span 1;
  }

  .metric-card {
    min-height: 160px;
  }

  .score-box,
  .detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel-header {
    flex-direction: column;
  }
}

@media (max-width: 560px) {
  .hero-panel {
    padding: 24px;
  }

  .result-toolbar,
  .pagination-bar {
    align-items: flex-start;
    flex-direction: column;
  }

  .score-box,
  .detail-grid {
    grid-template-columns: 1fr;
  }

  .empty-actions {
    flex-direction: column;
  }
}
</style>
