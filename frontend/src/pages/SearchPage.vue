<script setup lang="ts">
import { computed, ref } from "vue";
import api from "../services/api";
import type { Note, SearchMeta, SearchResponse } from "../types/note";

type SortMode = "relevance" | "latest" | "popular";
type SearchScope = "all" | "mine" | "public";

const notes = ref<Note[]>([]);
const meta = ref<SearchMeta | null>(null);

const keyword = ref("");
const course = ref("");
const category = ref("");
const tag = ref("");

const sort = ref<SortMode>("relevance");
const scope = ref<SearchScope>("all");
const page = ref(1);
const pageSize = 10;

const loading = ref(false);
const errorMessage = ref("");
const showAdvancedFilters = ref(false);
const hasSearched = ref(false);
const actionLoadingId = ref<number | null>(null);

const quickKeywords = ["微積分", "資料庫", "傅立葉", "期中考", "工程數學", "自動控制", "考古題"];

const sortOptions: Array<{ label: string; value: SortMode }> = [
  { label: "相關度", value: "relevance" },
  { label: "最新", value: "latest" },
  { label: "熱門", value: "popular" },
];

const scopeOptions: Array<{ label: string; value: SearchScope }> = [
  { label: "全部可見", value: "all" },
  { label: "我的筆記", value: "mine" },
  { label: "公開筆記", value: "public" },
];

const activeFilterCount = computed(() => [course.value, category.value, tag.value].filter(Boolean).length);
const hasQueryCondition = computed(() => Boolean(keyword.value.trim() || course.value.trim() || category.value.trim() || tag.value.trim()));
const totalResultText = computed(() => {
  if (!hasSearched.value || !meta.value) return "尚未搜尋";
  return `${meta.value.total} 筆結果`;
});
const currentScopeLabel = computed(() => scopeOptions.find((option) => option.value === (meta.value?.scope ?? scope.value))?.label ?? "全部可見");
const currentSortLabel = computed(() => sortOptions.find((option) => option.value === (meta.value?.sort ?? sort.value))?.label ?? "相關度");
const topScore = computed(() => Math.max(...notes.value.map((note) => note.score ?? 0), 1));

function getScoreLevel(score?: number) {
  const value = score ?? 0;

  if (value >= 80) return "高度相關";
  if (value >= 60) return "中高度相關";
  if (value >= 40) return "部分相關";
  if (value > 0) return "低度相關";

  return "待判斷";
}

function scoreWidth(score?: number) {
  return `${Math.min(((score ?? 0) / topScore.value) * 100, 100)}%`;
}

function visibleTags(note: Note) {
  return (note.tags || []).slice(0, 3);
}

function hiddenTagCount(note: Note) {
  return Math.max((note.tags?.length || 0) - visibleTags(note).length, 0);
}

function isFavorited(note: Note) {
  return Boolean(note.favorites?.length);
}

function getReasonItems(note: Note) {
  const detail = note.scoreDetail;
  if (!detail) return [];

  const reasons: string[] = [];

  if ((detail.titleMatch ?? 0) > 0 || (detail.contentMatch ?? 0) > 0 || (detail.descriptionMatch ?? 0) > 0) {
    reasons.push("標題、描述或內容與關鍵字相符。");
  }

  if ((detail.textSimilarity ?? 0) > 0) {
    reasons.push("筆記文字與搜尋內容有明顯相符。");
  }

  if ((detail.courseMatch ?? 0) > 0) {
    reasons.push("屬於你指定或搜尋到的課程。");
  }

  if ((detail.tagMatch ?? 0) > 0 || (detail.categoryMatch ?? 0) > 0) {
    reasons.push("標籤或分類符合搜尋條件。");
  }

  if ((detail.recency ?? 0) > 0) {
    reasons.push("這篇筆記最近有更新。");
  }

  if ((detail.popularity ?? 0) > 0) {
    reasons.push("收藏、瀏覽或按讚熱度較高。");
  }

  if (!reasons.length && (detail.quality ?? 0) > 0) {
    reasons.push("筆記資訊較完整，適合先閱讀。");
  }

  return reasons.slice(0, 5);
}

async function fetchSearchResults() {
  loading.value = true;
  errorMessage.value = "";
  hasSearched.value = true;

  try {
    const res = await api.get<SearchResponse>("/search", {
      params: {
        q: keyword.value.trim() || undefined,
        course: course.value.trim() || undefined,
        category: category.value.trim() || undefined,
        tag: tag.value.trim() || undefined,
        sort: sort.value,
        scope: scope.value,
        page: page.value,
        pageSize,
      },
    });

    notes.value = res.data.data;
    meta.value = res.data.meta;
  } catch (error) {
    console.error(error);
    errorMessage.value = "目前無法完成搜尋，請稍後再試。";
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
  if (hasSearched.value) {
    page.value = 1;
    fetchSearchResults();
  }
}

function changeScope(nextScope: SearchScope) {
  scope.value = nextScope;
  if (hasSearched.value) {
    page.value = 1;
    fetchSearchResults();
  }
}

function clearAdvancedFilters() {
  course.value = "";
  category.value = "";
  tag.value = "";
  page.value = 1;
  if (hasSearched.value) fetchSearchResults();
}

function handleReset() {
  keyword.value = "";
  course.value = "";
  category.value = "";
  tag.value = "";
  sort.value = "relevance";
  scope.value = "all";
  page.value = 1;
  notes.value = [];
  meta.value = null;
  hasSearched.value = false;
}

function changePage(nextPage: number) {
  if (!meta.value) return;
  if (nextPage < 1 || nextPage > meta.value.totalPages) return;

  page.value = nextPage;
  fetchSearchResults();
}

async function toggleFavorite(note: Note) {
  if (actionLoadingId.value) return;
  actionLoadingId.value = note.id;

  try {
    if (!isFavorited(note)) {
      await api.post("/favorites", { noteId: note.id });
      note.favorites = [{}];
      note.favoriteCount = (note.favoriteCount ?? 0) + 1;
    } else {
      await api.delete(`/favorites/${note.id}`);
      note.favorites = [];
      note.favoriteCount = Math.max((note.favoriteCount ?? 1) - 1, 0);
    }
  } catch (error) {
    console.error("收藏操作失敗", error);
    alert("收藏操作失敗，請稍後再試");
  } finally {
    actionLoadingId.value = null;
  }
}
</script>

<template>
  <section class="search-page page-frame">
    <header class="search-header">
      <div>
        <p class="page-kicker">搜尋筆記</p>
        <h1>找到需要的課堂重點</h1>
        <p>搜尋公開筆記與自己的私人筆記，快速篩選課程、分類與標籤。</p>
      </div>

      <router-link to="/create" class="secondary-action">新增筆記</router-link>
    </header>

    <section class="search-toolbar">
      <div class="main-search-row">
        <label class="main-search-field">
          <span>搜尋關鍵字</span>
          <input
            v-model="keyword"
            placeholder="輸入課程、主題、公式或考試關鍵字"
            @keyup.enter="handleSearch"
          />
        </label>

        <button type="button" class="run-search-btn" :disabled="loading" @click="handleSearch">
          {{ loading ? "搜尋中..." : "搜尋" }}
        </button>
      </div>

      <div class="quick-row">
        <span>範例</span>
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

      <div class="toolbar-grid">
        <div class="control-group">
          <span>搜尋範圍</span>
          <div class="segmented-control">
            <button
              v-for="option in scopeOptions"
              :key="option.value"
              type="button"
              :class="{ active: scope === option.value }"
              @click="changeScope(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="control-group">
          <span>排序</span>
          <div class="segmented-control">
            <button
              v-for="option in sortOptions"
              :key="option.value"
              type="button"
              :class="{ active: sort === option.value }"
              @click="changeSort(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div class="filter-toggle-row">
          <button type="button" class="advanced-toggle" @click="showAdvancedFilters = !showAdvancedFilters">
            {{ showAdvancedFilters ? "收合篩選" : "更多篩選" }}
            <b v-if="activeFilterCount > 0">{{ activeFilterCount }}</b>
          </button>

          <button v-if="hasQueryCondition || hasSearched" type="button" class="reset-link" @click="handleReset">
            清除
          </button>
        </div>
      </div>

      <div v-if="showAdvancedFilters" class="advanced-panel">
        <label class="filter-field">
          <span>課程</span>
          <input v-model="course" placeholder="例如：工程數學" @keyup.enter="handleSearch" />
        </label>

        <label class="filter-field">
          <span>分類</span>
          <input v-model="category" placeholder="例如：考試整理" @keyup.enter="handleSearch" />
        </label>

        <label class="filter-field">
          <span>標籤</span>
          <input v-model="tag" placeholder="例如：期中考" @keyup.enter="handleSearch" />
        </label>

        <div class="filter-actions">
          <button type="button" class="secondary-action" @click="handleSearch">套用篩選</button>
          <button type="button" class="ghost-action" @click="clearAdvancedFilters">清除篩選</button>
        </div>
      </div>
    </section>

    <section class="result-toolbar">
      <div>
        <strong>{{ totalResultText }}</strong>
        <span v-if="hasSearched">範圍：{{ currentScopeLabel }} ｜ 排序：{{ currentSortLabel }}</span>
        <span v-else>輸入關鍵字或點選範例開始搜尋。</span>
      </div>
    </section>

    <section v-if="!hasSearched && !loading" class="state-panel start-state">
      <h3>開始搜尋你的學習資料</h3>
      <p>可以搜尋課程、主題、公式或考試關鍵字，例如：微積分、資料庫、傅立葉、期中考。</p>
    </section>

    <section v-else-if="loading" class="state-panel">
      <div class="spinner"></div>
      <h3>搜尋中</h3>
      <p>正在比對標題、課程、標籤與筆記內容。</p>
    </section>

    <section v-else-if="errorMessage" class="state-panel error">
      <h3>搜尋失敗</h3>
      <p>{{ errorMessage }}</p>
    </section>

    <section v-else-if="notes.length > 0" class="result-list">
      <article v-for="note in notes" :key="note.id" class="result-card">
        <div class="result-main">
          <div class="result-topline">
            <div class="meta-chips">
              <span>{{ note.course || "未指定課程" }}</span>
              <span>{{ note.category || "未分類" }}</span>
              <span :class="['visibility-badge', note.visibility === 'PRIVATE' ? 'private' : 'public']">
                {{ note.visibility === "PRIVATE" ? "私人" : "公開" }}
              </span>
            </div>

            <div class="relevance-pill">
              <i :style="{ width: scoreWidth(note.score) }"></i>
              <span>{{ getScoreLevel(note.score) }}</span>
            </div>
          </div>

          <router-link :to="`/notes/${note.id}`" class="result-title">
            {{ note.title }}
          </router-link>

          <p class="description">
            {{ note.description || note.content || "這篇筆記尚未提供描述。" }}
          </p>

          <p v-if="note.description && note.content" class="content-preview">
            {{ note.content }}
          </p>

          <div v-if="note.tags && note.tags.length > 0" class="tag-list">
            <span v-for="item in visibleTags(note)" :key="item.id">#{{ item.name }}</span>
            <span v-if="hiddenTagCount(note) > 0" class="more-tags">+{{ hiddenTagCount(note) }}</span>
          </div>

          <details v-if="note.scoreDetail" class="score-detail">
            <summary>為什麼排在這裡</summary>
            <ul>
              <li v-for="reason in getReasonItems(note)" :key="reason">{{ reason }}</li>
            </ul>
          </details>
        </div>

        <aside class="result-actions">
          <button
            type="button"
            :class="['favorite-action', { active: isFavorited(note) }]"
            :disabled="actionLoadingId === note.id"
            @click="toggleFavorite(note)"
          >
            {{ isFavorited(note) ? "已收藏" : "收藏" }}
          </button>

          <router-link :to="`/notes/${note.id}`" class="open-action">閱讀</router-link>
        </aside>
      </article>
    </section>

    <section v-else class="state-panel empty-state">
      <h3>找不到符合的筆記</h3>
      <p>可以換一個關鍵字、放寬篩選條件、查看公開筆記，或新增自己的筆記。</p>
      <div class="empty-actions">
        <button type="button" class="secondary-action" @click="handleReset">放寬條件</button>
        <button type="button" class="secondary-action" @click="changeScope('public')">查看公開筆記</button>
        <router-link to="/create" class="primary-action">新增筆記</router-link>
      </div>
    </section>

    <section v-if="meta && meta.totalPages > 1" class="pagination-panel">
      <button type="button" class="ghost-action" :disabled="meta.page <= 1" @click="changePage(meta.page - 1)">
        上一頁
      </button>
      <span>{{ meta.page }} / {{ meta.totalPages }}</span>
      <button type="button" class="ghost-action" :disabled="meta.page >= meta.totalPages" @click="changePage(meta.page + 1)">
        下一頁
      </button>
    </section>
  </section>
</template>

<style scoped>
.search-page {
  padding: 18px 0 64px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  padding: 20px 22px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

.search-header h1 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(30px, 4vw, 46px);
  line-height: 1.08;
  letter-spacing: 0;
}

.search-header p:not(.page-kicker) {
  max-width: 720px;
  margin: 10px 0 0;
  color: var(--muted);
  line-height: 1.7;
}

.search-toolbar {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-soft);
}

.main-search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px;
  gap: 12px;
  align-items: end;
}

.main-search-field,
.filter-field {
  display: grid;
  gap: 7px;
}

.main-search-field span,
.filter-field span,
.control-group > span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.main-search-field input {
  min-height: 54px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 750;
}

.run-search-btn {
  min-height: 54px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: var(--blue);
  font-weight: 850;
  box-shadow: 0 12px 22px rgba(47, 111, 237, 0.18);
}

.quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 12px;
}

.quick-row > span {
  color: var(--muted);
  font-size: 13px;
  font-weight: 800;
}

.quick-row button,
.segmented-control button,
.advanced-toggle,
.reset-link {
  border: 1px solid var(--line);
  border-radius: 8px;
  color: #334155;
  background: #ffffff;
  font-weight: 800;
}

.quick-row button {
  padding: 7px 10px;
  font-size: 13px;
}

.quick-row button.active,
.quick-row button:hover {
  color: white;
  border-color: var(--blue);
  background: var(--blue);
}

.toolbar-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr) auto;
  gap: 14px;
  align-items: end;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--line);
}

.control-group {
  display: grid;
  gap: 8px;
}

.segmented-control {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.segmented-control button {
  min-height: 38px;
  padding: 0 12px;
}

.segmented-control button.active {
  color: #1d4ed8;
  border-color: #bfdbfe;
  background: #eff6ff;
}

.filter-toggle-row {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.advanced-toggle,
.reset-link {
  min-height: 38px;
  padding: 0 12px;
}

.advanced-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.advanced-toggle b {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  border-radius: 7px;
  color: white;
  background: var(--blue);
  font-size: 12px;
}

.reset-link {
  color: #b42318;
  background: #fffafa;
}

.advanced-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: end;
  margin-top: 14px;
  padding: 14px;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  background: #f9fafb;
}

.filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.result-toolbar {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  margin: 18px 0 14px;
}

.result-toolbar strong,
.result-toolbar span {
  display: block;
}

.result-toolbar strong {
  color: #111827;
  font-size: 22px;
  letter-spacing: 0;
}

.result-toolbar span {
  margin-top: 4px;
  color: #64748b;
}

.result-list {
  display: grid;
  gap: 14px;
}

.result-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 124px;
  gap: 18px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

.result-main {
  min-width: 0;
}

.result-topline {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.meta-chips,
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-chips span,
.tag-list span {
  padding: 6px 9px;
  border-radius: 8px;
  color: #334155;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 750;
}

.visibility-badge.public {
  color: #047857;
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
}

.visibility-badge.private {
  color: #7c2d12;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.relevance-pill {
  min-width: 118px;
  padding: 8px;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  background: #eff6ff;
}

.relevance-pill i {
  display: block;
  height: 6px;
  border-radius: 999px;
  background: var(--blue);
}

.relevance-pill span {
  display: block;
  margin-top: 6px;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 850;
}

.result-title {
  display: block;
  margin: 13px 0 8px;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 850;
  letter-spacing: 0;
  text-decoration: none;
}

.result-title:hover {
  color: var(--blue);
}

.description,
.content-preview {
  margin: 0 0 10px;
  color: var(--muted);
  line-height: 1.7;
}

.content-preview {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.tag-list {
  margin-top: 12px;
}

.tag-list .more-tags {
  color: #1d4ed8;
  background: #eff6ff;
}

.score-detail {
  margin-top: 14px;
}

.score-detail summary {
  width: fit-content;
  padding: 9px 11px;
  border: 1px solid var(--line);
  border-radius: 8px;
  color: #334155;
  background: #f8fafc;
  cursor: pointer;
  font-size: 13px;
  font-weight: 850;
}

.score-detail ul {
  margin: 10px 0 0;
  padding: 12px 14px 12px 30px;
  border: 1px solid var(--line);
  border-radius: 10px;
  color: #475569;
  background: #ffffff;
  line-height: 1.7;
}

.result-actions {
  display: grid;
  gap: 9px;
  align-content: start;
}

.favorite-action,
.open-action {
  min-height: 40px;
  padding: 0 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 850;
  text-decoration: none;
}

.favorite-action {
  border: 1px solid var(--line);
  color: #475467;
  background: #ffffff;
}

.favorite-action.active {
  color: #92400e;
  background: #fffbeb;
  border-color: #fde68a;
}

.open-action {
  color: white;
  background: var(--ink);
}

.empty-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 18px;
}

.pagination-panel {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  margin-top: 24px;
}

.pagination-panel span {
  font-weight: 800;
}

@media (max-width: 980px) {
  .search-header,
  .toolbar-grid,
  .advanced-panel,
  .result-card {
    grid-template-columns: 1fr;
  }

  .search-header {
    display: grid;
  }

  .filter-toggle-row,
  .filter-actions {
    justify-content: flex-start;
  }

  .result-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .search-page {
    padding-top: 14px;
  }

  .search-header,
  .search-toolbar,
  .result-card {
    padding: 16px;
  }

  .main-search-row,
  .result-actions {
    grid-template-columns: 1fr;
  }

  .segmented-control,
  .filter-toggle-row,
  .filter-actions,
  .empty-actions {
    flex-direction: column;
  }

  .segmented-control button,
  .advanced-toggle,
  .reset-link,
  .favorite-action,
  .open-action {
    width: 100%;
  }

  .result-toolbar,
  .result-topline {
    align-items: stretch;
    flex-direction: column;
  }

  .relevance-pill {
    width: 100%;
  }
}
</style>
