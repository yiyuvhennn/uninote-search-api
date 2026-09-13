<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import type { Note } from "../types/note";
import NoteCard from "../components/NoteCard.vue";

const notes = ref<Note[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const currentUserId = ref<number | null>(null);
const quickFilter = ref("");
const emptyTitle = computed(() => quickFilter.value.trim() ? "沒有符合條件的收藏" : "還沒有收藏筆記");
const filteredNotes = computed(() => {
  const key = quickFilter.value.trim().toLowerCase();
  if (!key) return notes.value;
  return notes.value.filter((note) => [note.title, note.course, note.category, note.description].filter(Boolean).some((item) => String(item).toLowerCase().includes(key)));
});

async function fetchFavorites() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [meRes, res] = await Promise.all([
      api.get("/auth/me"),
      api.get("/favorites"),
    ]);

    currentUserId.value = meRes.data.user.id;
    if (Array.isArray(res.data) && res.data.length > 0 && res.data[0].note) notes.value = res.data.map((item: any) => item.note);
    else notes.value = res.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "目前無法取得收藏筆記，請稍後再試。";
  } finally { loading.value = false; }
}
function handleUnfavorited(noteId: number) { notes.value = notes.value.filter((note) => note.id !== noteId); }
onMounted(fetchFavorites);
</script>

<template>
  <section class="favorite-vault page-frame">
    <div class="vault-hero">
      <div><p class="page-kicker">我的收藏</p><h1>收藏</h1><p>把常用或之後想讀的筆記集中保存，複習時可以更快回到重點內容。</p></div>
      <div class="vault-tools">
        <div class="vault-stat"><strong>{{ notes.length }}</strong><span>已收藏</span></div>
        <label class="favorite-search">
          <span>收藏內搜尋</span>
          <input v-model="quickFilter" placeholder="搜尋標題、課程或分類" />
        </label>
      </div>
    </div>

    <section v-if="loading" class="state-panel dark"><div class="spinner"></div><h3>讀取收藏中</h3><p>正在整理你的收藏筆記。</p></section>
    <section v-else-if="errorMessage" class="state-panel error"><h3>讀取失敗</h3><p>{{ errorMessage }}</p><button class="primary-action" @click="fetchFavorites">重新整理</button></section>
    <section v-else-if="filteredNotes.length === 0" class="empty-vault">
      <h3>{{ emptyTitle }}</h3>
      <p>{{ quickFilter ? "目前沒有符合篩選的收藏筆記，可以換個關鍵字試試。" : "你收藏的公開筆記會出現在這裡。看到重要資料時，點擊收藏就能快速回來查看。" }}</p>
      <div class="empty-actions">
        <router-link to="/search" class="primary-action">去搜尋筆記</router-link>
        <router-link to="/notes" class="secondary-action">查看筆記庫</router-link>
      </div>
    </section>
    <section v-else class="vault-grid"><NoteCard v-for="note in filteredNotes" :key="note.id" :note="note" :initialFavorited="true" :isOwner="note.authorId === currentUserId" :showDeleteButton="false" @unfavorited="handleUnfavorited" /></section>
  </section>
</template>

<style scoped>
.favorite-vault { padding:14px 0 64px; }.vault-hero { position:relative; display:grid; grid-template-columns:1fr minmax(260px, 390px); gap:16px; align-items:stretch; padding:26px; border:1px solid var(--line-strong); border-radius:5px; color:var(--ink); background:rgba(255,250,240,.84); box-shadow:var(--shadow-soft); backdrop-filter:blur(18px); }
.vault-hero::before { content:""; position:absolute; inset:10px; border:1px solid rgba(183,121,34,.16); pointer-events:none; }
h1 { margin:0; font-size:clamp(34px,4.4vw,52px); line-height:1.08; letter-spacing:0; }.vault-hero p:not(.page-kicker) { max-width:650px; color:var(--muted); line-height:1.72; }.vault-stat { display:grid; place-items:center; align-content:center; border:1px solid var(--line); border-radius:5px; background:#f4ead5; }.vault-stat strong { font-size:42px; letter-spacing:0; }.vault-stat span { color:var(--muted); font-size:12px; font-weight:850; text-transform:uppercase; }.vault-stat.glow { background:#edf4ff; border-color:#b7cdec; }
.vault-tools { display:grid; grid-template-columns:110px 1fr; gap:10px; align-items:stretch; }
.favorite-search { display:grid; gap:7px; align-content:center; padding:13px; border:1px solid var(--line); border-radius:5px; background:#f4ead5; }
.favorite-search span { color:var(--muted); font-size:11px; font-weight:850; letter-spacing:.08em; text-transform:uppercase; }
.vault-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; margin-top:22px; }.empty-vault { margin-top:22px; padding:50px 32px; border:1px solid var(--line-strong); border-radius:5px; color:var(--ink); background:rgba(255,250,240,.84); text-align:center; box-shadow:var(--shadow-soft); backdrop-filter:blur(18px); }.empty-vault h3 { margin:0 0 10px; font-size:30px; letter-spacing:0; }.empty-vault p { max-width:560px; margin:0 auto 24px; color:var(--muted); line-height:1.8; }
.empty-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:12px; }
@media (max-width: 920px) { .vault-hero,.vault-grid,.vault-tools { grid-template-columns:1fr; } }
@media (max-width: 560px) { .empty-actions { flex-direction:column; } }
</style>
