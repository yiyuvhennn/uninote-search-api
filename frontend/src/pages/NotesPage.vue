<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import type { Note } from "../types/note";
import NoteCard from "../components/NoteCard.vue";

const notes = ref<Note[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const quickFilter = ref("");

const filteredNotes = computed(() => {
  const key = quickFilter.value.trim().toLowerCase();
  if (!key) return notes.value;
  return notes.value.filter((note) => [note.title, note.course, note.category, note.description].filter(Boolean).some((item) => String(item).toLowerCase().includes(key)));
});
const totalCourses = computed(() => new Set(notes.value.map((note) => note.course).filter(Boolean)).size);
const totalViews = computed(() => notes.value.reduce((sum, note) => sum + (note.views || 0), 0));

async function fetchNotes() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await api.get("/notes");
    notes.value = res.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取筆記失敗，請確認後端是否已啟動。";
  } finally { loading.value = false; }
}
function handleDeleted(noteId: number) { notes.value = notes.value.filter((note) => note.id !== noteId); }
onMounted(fetchNotes);
</script>

<template>
  <section class="notes-board page-frame">
    <div class="board-hero">
      <div>
        <p class="page-kicker">Library board</p>
        <h1>筆記庫</h1>
        <p>用卡片牆管理所有筆記。這裡偏向瀏覽與管理；真正的 Ranking 展示請進入搜尋艙。</p>
      </div>
      <div class="board-actions">
        <router-link to="/search" class="primary-action">前往搜尋艙</router-link>
        <router-link to="/create" class="secondary-action">新增筆記</router-link>
      </div>
    </div>

    <div class="library-overview">
      <article><span>Total notes</span><strong>{{ notes.length }}</strong></article>
      <article><span>Courses</span><strong>{{ totalCourses }}</strong></article>
      <article><span>Views</span><strong>{{ totalViews }}</strong></article>
      <div class="quick-search"><span>Quick filter</span><input v-model="quickFilter" placeholder="搜尋標題、課程、分類" /></div>
    </div>

    <section v-if="loading" class="state-panel"><div class="spinner"></div><h3>載入筆記中</h3><p>正在從後端讀取 notes 資料。</p></section>
    <section v-else-if="errorMessage" class="state-panel error"><h3>讀取失敗</h3><p>{{ errorMessage }}</p><button class="primary-action" @click="fetchNotes">重新整理</button></section>
    <section v-else-if="filteredNotes.length === 0" class="state-panel"><h3>沒有符合的筆記</h3><p>試著更換快速搜尋條件，或新增一篇筆記。</p><router-link to="/create" class="primary-action">新增筆記</router-link></section>

    <section v-else class="note-masonry">
      <NoteCard v-for="note in filteredNotes" :key="note.id" :note="note" :showDeleteButton="true" @deleted="handleDeleted" />
    </section>
  </section>
</template>

<style scoped>
.notes-board { padding: 28px 0 60px; }
.board-hero { display:grid; grid-template-columns:1fr auto; gap:22px; align-items:end; padding:34px; border-radius:40px; background:linear-gradient(135deg,#fff7ed,#ffffff 56%,#eff6ff); border:1px solid rgba(148,163,184,.24); box-shadow:var(--shadow-soft); }
h1 { margin:0; font-size:clamp(48px,7vw,86px); line-height:.95; letter-spacing:-.09em; }.board-hero p { max-width:680px; color:#64748b; line-height:1.8; }.board-actions { display:flex; flex-wrap:wrap; gap:12px; justify-content:flex-end; }
.library-overview { display:grid; grid-template-columns: repeat(3, 1fr) 1.5fr; gap:14px; margin:22px 0; }
.library-overview article,.quick-search { padding:20px; border-radius:28px; border:1px solid var(--line); background:rgba(255,255,255,.84); box-shadow:var(--shadow-soft); }
.library-overview span,.quick-search span { display:block; margin-bottom:8px; color:#64748b; font-size:12px; font-weight:1000; letter-spacing:.1em; text-transform:uppercase; }.library-overview strong { font-size:42px; letter-spacing:-.07em; }
.note-masonry { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:18px; }
.state-panel .primary-action { margin-top:18px; }
@media (max-width: 980px) { .board-hero,.library-overview,.note-masonry { grid-template-columns:1fr; } .board-actions { justify-content:flex-start; } }
</style>
