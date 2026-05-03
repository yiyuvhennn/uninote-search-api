<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import Navbar from "../components/Navbar.vue";
import type { Note, SearchMeta, SearchResponse } from "../types/note";

const router = useRouter();
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
  return `共 ${meta.value.total} 筆結果，第 ${meta.value.page} / ${meta.value.totalPages} 頁`;
});

function formatScore(value?: number) {
  return value === undefined ? "0.00" : value.toFixed(2);
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

function changePage(nextPage: number) {
  if (!meta.value) return;
  if (nextPage < 1 || nextPage > meta.value.totalPages) return;
  page.value = nextPage;
  fetchSearchResults();
}

onMounted(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    router.push("/login");
    return;
  }
  fetchSearchResults();
});
</script>

<template>
  <div>
    <Navbar />
    <main class="search-page">
      <section class="hero-panel">
        <div>
          <p class="eyebrow">Search API System</p>
          <h1>UniNote 搜尋與排序系統</h1>
          <p class="hero-description">展示關鍵字搜尋、篩選、排序、Ranking score 與基礎快取狀態。</p>
        </div>
        <div class="metric-card">
          <span>目前結果</span>
          <strong>{{ meta?.total ?? 0 }}</strong>
          <small>Cache：{{ meta?.cache ?? "-" }}</small>
        </div>
      </section>

      <section class="search-panel">
        <input v-model="keyword" placeholder="關鍵字，例如：微積分、API、傅立葉" @keyup.enter="handleSearch" />
        <input v-model="course" placeholder="課程，例如：工程數學" @keyup.enter="handleSearch" />
        <input v-model="category" placeholder="分類，例如：考試整理" @keyup.enter="handleSearch" />
        <input v-model="tag" placeholder="標籤，例如：期中考" @keyup.enter="handleSearch" />
        <select v-model="sort" @change="handleSearch">
          <option value="relevance">相關性排序</option>
          <option value="latest">最新資料</option>
          <option value="popular">熱門度排序</option>
        </select>
        <select v-model="pageSize" @change="handleSearch">
          <option :value="3">每頁 3 筆</option>
          <option :value="6">每頁 6 筆</option>
          <option :value="10">每頁 10 筆</option>
        </select>
        <button class="primary-btn" @click="handleSearch">搜尋</button>
        <button class="secondary-btn" @click="handleReset">清除</button>
      </section>

      <section class="result-toolbar">
        <p>{{ resultText }}</p>
        <p v-if="meta">排序：{{ meta.sort }}，Cache：{{ meta.cache }}</p>
      </section>

      <p v-if="loading" class="status-text">搜尋中...</p>
      <p v-else-if="errorMessage" class="error-text">{{ errorMessage }}</p>

      <section v-else-if="notes.length" class="result-grid">
        <article v-for="note in notes" :key="note.id" class="search-card">
          <div class="card-topline">
            <span>{{ note.course }}</span>
            <span>{{ note.category || "未分類" }}</span>
          </div>
          <router-link :to="`/notes/${note.id}`" class="search-card-title">{{ note.title }}</router-link>
          <p class="search-card-description">{{ note.description || "沒有描述" }}</p>
          <p class="search-card-content">{{ note.content || "尚未建立可搜尋內容" }}</p>
          <div class="tag-row">
            <span v-for="item in note.tags" :key="item.id" class="tag-chip">#{{ item.name }}</span>
          </div>
          <div class="score-box">
            <div><span>Score</span><strong>{{ formatScore(note.score) }}</strong></div>
            <div><span>Views</span><strong>{{ note.views }}</strong></div>
            <div><span>Likes</span><strong>{{ note.likes }}</strong></div>
            <div><span>Favorites</span><strong>{{ note.favoriteCount ?? note.favorites?.length ?? 0 }}</strong></div>
          </div>
          <details v-if="note.scoreDetail" class="score-detail">
            <summary>Ranking 細節</summary>
            <ul>
              <li>標題命中：{{ note.scoreDetail.titleMatch }}</li>
              <li>描述命中：{{ note.scoreDetail.descriptionMatch }}</li>
              <li>內容命中：{{ note.scoreDetail.contentMatch }}</li>
              <li>熱門度：{{ note.scoreDetail.popularity }}</li>
              <li>新近度：{{ note.scoreDetail.recency }}</li>
            </ul>
          </details>
        </article>
      </section>

      <section v-else class="empty-state">
        <h2>查無符合條件的筆記</h2>
        <p>可以換關鍵字，或先執行 seed 建立測試資料。</p>
      </section>

      <section v-if="meta && meta.totalPages > 1" class="pagination-bar">
        <button class="secondary-btn" :disabled="meta.page <= 1" @click="changePage(meta.page - 1)">上一頁</button>
        <span>{{ meta.page }} / {{ meta.totalPages }}</span>
        <button class="secondary-btn" :disabled="meta.page >= meta.totalPages" @click="changePage(meta.page + 1)">下一頁</button>
      </section>
    </main>
  </div>
</template>
