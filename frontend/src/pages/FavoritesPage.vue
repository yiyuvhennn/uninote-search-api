<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import type { Note } from "../types/note";
import NoteCard from "../components/NoteCard.vue";

const notes = ref<Note[]>([]);
const loading = ref(true);
const errorMessage = ref("");

const totalFavorites = computed(() => notes.value.length);

async function fetchFavorites() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await api.get("/favorites");

    if (Array.isArray(res.data) && res.data.length > 0 && res.data[0].note) {
      notes.value = res.data.map((item: { note: Note }) => item.note);
    } else {
      notes.value = res.data;
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取收藏失敗，請稍後再試";
  } finally {
    loading.value = false;
  }
}

function handleUnfavorited(noteId: number) {
  notes.value = notes.value.filter((note) => note.id !== noteId);
}

onMounted(() => {
  fetchFavorites();
});
</script>

<template>
  <section class="favorites-page page-shell">
    <div class="page-hero">
      <div>
        <p class="page-eyebrow">Saved notes</p>
        <h1>我的收藏</h1>
        <p>
          收藏清單可以作為個人的學習工作台。你可以保留常用筆記，
          再從搜尋頁面快速比對不同筆記的 Ranking 表現。
        </p>
      </div>

      <div class="hero-stat">
        <span>已收藏</span>
        <strong>{{ totalFavorites }}</strong>
      </div>
    </div>

    <div v-if="loading" class="state-panel">
      <div class="loader"></div>
      <h3>正在載入收藏</h3>
      <p>系統正在讀取你的收藏筆記。</p>
    </div>

    <div v-else-if="errorMessage" class="state-panel state-panel--error">
      <h3>讀取失敗</h3>
      <p>{{ errorMessage }}</p>
      <button type="button" class="primary-action retry-btn" @click="fetchFavorites">
        重新整理
      </button>
    </div>

    <div v-else-if="notes.length === 0" class="state-panel">
      <h3>目前沒有收藏</h3>
      <p>到筆記列表或搜尋系統中收藏常用筆記，這裡就會出現你的收藏清單。</p>

      <div class="empty-actions">
        <router-link to="/search" class="primary-action">前往搜尋系統</router-link>
        <router-link to="/notes" class="secondary-action">查看筆記列表</router-link>
      </div>
    </div>

    <div v-else class="notes-grid">
      <NoteCard
        v-for="note in notes"
        :key="note.id"
        :note="note"
        :initialFavorited="true"
        :showDeleteButton="false"
        @unfavorited="handleUnfavorited"
      />
    </div>
  </section>
</template>

<style scoped>
.favorites-page {
  margin: 0 auto;
}

.page-hero {
  display: grid;
  grid-template-columns: 1fr 170px;
  gap: 24px;
  align-items: stretch;
  margin-bottom: 22px;
  padding: 30px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.16), transparent 32%),
    rgba(255, 255, 255, 0.84);
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

.hero-stat {
  display: grid;
  place-items: center;
  border: 1px solid #fde68a;
  border-radius: 24px;
  background: #fffbeb;
}

.hero-stat span {
  color: #b45309;
  font-size: 13px;
  font-weight: 950;
}

.hero-stat strong {
  color: #78350f;
  font-size: 48px;
  line-height: 1;
  letter-spacing: -0.06em;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
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

@media (max-width: 900px) {
  .page-hero,
  .notes-grid {
    grid-template-columns: 1fr;
  }

  .hero-stat {
    min-height: 140px;
  }
}

@media (max-width: 560px) {
  .empty-actions {
    flex-direction: column;
  }
}
</style>
