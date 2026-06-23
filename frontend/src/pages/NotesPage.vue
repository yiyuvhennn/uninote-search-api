<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import type { Note } from "../types/note";
import NoteCard from "../components/NoteCard.vue";

const router = useRouter();

const notes = ref<Note[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const searchTerm = ref("");

const filteredNotes = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();

  if (!term) return notes.value;

  return notes.value.filter((note) => {
    return [note.title, note.description, note.course, note.category, note.content]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term));
  });
});

const totalNotes = computed(() => notes.value.length);

const totalCourses = computed(() => {
  return new Set(notes.value.map((note) => note.course).filter(Boolean)).size;
});

const totalFavorites = computed(() => {
  return notes.value.reduce((sum, note) => {
    return sum + (note.favoriteCount ?? note.favorites?.length ?? 0);
  }, 0);
});

async function fetchNotes() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await api.get("/notes");
    notes.value = res.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取筆記失敗，請稍後再試";
  } finally {
    loading.value = false;
  }
}

function handleDeleted(noteId: number) {
  notes.value = notes.value.filter((note) => note.id !== noteId);
}

onMounted(() => {
  fetchNotes();
});
</script>

<template>
  <section class="notes-page page-shell">
    <div class="page-hero">
      <div>
        <p class="page-eyebrow">Notes workspace</p>
        <h1>筆記列表</h1>
        <p>
          管理所有可被 Search API 搜尋的筆記資料。這裡可以先確認資料品質，
          再到搜尋系統測試 Ranking、篩選、排序與分頁。
        </p>
      </div>

      <div class="hero-actions">
        <router-link to="/search" class="primary-action">
          前往搜尋系統
        </router-link>

        <router-link to="/create" class="secondary-action">
          新增筆記
        </router-link>
      </div>
    </div>

    <div class="stats-grid">
      <article>
        <span>總筆記數</span>
        <strong>{{ totalNotes }}</strong>
      </article>

      <article>
        <span>課程數量</span>
        <strong>{{ totalCourses }}</strong>
      </article>

      <article>
        <span>收藏總數</span>
        <strong>{{ totalFavorites }}</strong>
      </article>
    </div>

    <div class="toolbar-card">
      <label>
        <span>快速搜尋筆記</span>
        <input
          v-model="searchTerm"
          type="search"
          placeholder="輸入標題、課程、分類或內容關鍵字"
        />
      </label>

      <button type="button" class="secondary-action" @click="fetchNotes">
        重新整理
      </button>
    </div>

    <div v-if="loading" class="state-panel">
      <div class="loader"></div>
      <h3>正在載入筆記</h3>
      <p>系統正在從後端讀取 notes 資料。</p>
    </div>

    <div v-else-if="errorMessage" class="state-panel state-panel--error">
      <h3>讀取失敗</h3>
      <p>{{ errorMessage }}</p>
      <button type="button" class="primary-action retry-btn" @click="fetchNotes">
        重新整理
      </button>
    </div>

    <div v-else-if="notes.length === 0" class="state-panel">
      <h3>目前沒有筆記</h3>
      <p>你可以先建立一篇筆記，或執行 seed 產生測試資料。</p>
      <router-link to="/create" class="primary-action empty-action">
        新增第一篇筆記
      </router-link>
    </div>

    <div v-else-if="filteredNotes.length === 0" class="state-panel">
      <h3>找不到符合條件的筆記</h3>
      <p>請換一個關鍵字，或清空搜尋條件。</p>
      <button type="button" class="secondary-action empty-action" @click="searchTerm = ''">
        清空搜尋
      </button>
    </div>

    <div v-else class="notes-grid">
      <NoteCard
        v-for="note in filteredNotes"
        :key="note.id"
        :note="note"
        :showDeleteButton="true"
        @deleted="handleDeleted"
      />
    </div>
  </section>
</template>

<style scoped>
.notes-page {
  margin: 0 auto;
}

.page-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: end;
  margin-bottom: 22px;
  padding: 30px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(66, 99, 235, 0.15), transparent 32%),
    rgba(255, 255, 255, 0.82);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
}

.page-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(38px, 5vw, 58px);
  line-height: 1.05;
  letter-spacing: -0.07em;
}

.page-hero p {
  max-width: 760px;
  margin: 16px 0 0;
  color: #64748b;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}

.stats-grid article {
  padding: 20px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.stats-grid span {
  color: #64748b;
  font-size: 13px;
  font-weight: 900;
}

.stats-grid strong {
  display: block;
  margin-top: 8px;
  color: #111827;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.05em;
}

.toolbar-card {
  margin-bottom: 22px;
  padding: 18px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: end;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.06);
}

.toolbar-card label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.retry-btn,
.empty-action {
  margin-top: 18px;
}

@media (max-width: 900px) {
  .page-hero,
  .toolbar-card {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    justify-content: flex-start;
  }

  .notes-grid,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
