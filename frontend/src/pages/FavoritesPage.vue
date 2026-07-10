<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import type { Note } from "../types/note";
import NoteCard from "../components/NoteCard.vue";

const notes = ref<Note[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const totalLikes = computed(() => notes.value.reduce((sum, note) => sum + (note.likes || 0), 0));

async function fetchFavorites() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await api.get("/favorites");
    if (Array.isArray(res.data) && res.data.length > 0 && res.data[0].note) notes.value = res.data.map((item: any) => item.note);
    else notes.value = res.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取收藏失敗，請稍後再試。";
  } finally { loading.value = false; }
}
function handleUnfavorited(noteId: number) { notes.value = notes.value.filter((note) => note.id !== noteId); }
onMounted(fetchFavorites);
</script>

<template>
  <section class="favorite-vault page-frame">
    <div class="vault-hero">
      <div><p class="page-kicker">Favorite vault</p><h1>收藏庫</h1><p>把重要筆記集中放在這裡，像建立一個專屬的考前資料保險箱。</p></div>
      <div class="vault-stat"><strong>{{ notes.length }}</strong><span>saved notes</span></div>
      <div class="vault-stat glow"><strong>{{ totalLikes }}</strong><span>total likes</span></div>
    </div>

    <section v-if="loading" class="state-panel dark"><div class="spinner"></div><h3>讀取收藏中</h3><p>正在開啟你的筆記保險箱。</p></section>
    <section v-else-if="errorMessage" class="state-panel error"><h3>讀取失敗</h3><p>{{ errorMessage }}</p><button class="primary-action" @click="fetchFavorites">重新整理</button></section>
    <section v-else-if="notes.length === 0" class="empty-vault"><h3>收藏庫還是空的</h3><p>到筆記列表或搜尋結果中收藏重要筆記，之後就能在這裡快速找到。</p><router-link to="/search" class="primary-action">去搜尋筆記</router-link></section>
    <section v-else class="vault-grid"><NoteCard v-for="note in notes" :key="note.id" :note="note" :initialFavorited="true" :showDeleteButton="false" @unfavorited="handleUnfavorited" /></section>
  </section>
</template>

<style scoped>
.favorite-vault { padding:28px 0 60px; }.vault-hero { display:grid; grid-template-columns:1fr 180px 180px; gap:16px; align-items:stretch; padding:32px; border:1px solid var(--line); border-radius:14px; color:var(--ink); background:#ffffff; box-shadow:var(--shadow-soft); }
h1 { margin:0; font-size:clamp(42px,6vw,72px); line-height:1.04; letter-spacing:0; }.vault-hero p:not(.page-kicker) { max-width:650px; color:#64748b; line-height:1.8; }.vault-stat { display:grid; place-items:center; align-content:center; border:1px solid var(--line); border-radius:12px; background:#f9fafb; }.vault-stat strong { font-size:52px; letter-spacing:0; }.vault-stat span { color:#64748b; font-size:12px; font-weight:800; text-transform:uppercase; }.vault-stat.glow { background:#eff6ff; border-color:#bfdbfe; }
.vault-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; margin-top:22px; }.empty-vault { margin-top:22px; padding:48px 32px; border:1px solid var(--line); border-radius:14px; color:var(--ink); background:#ffffff; text-align:center; box-shadow:var(--shadow-soft); }.empty-vault h3 { margin:0 0 10px; font-size:32px; letter-spacing:0; }.empty-vault p { max-width:560px; margin:0 auto 24px; color:#64748b; line-height:1.8; }
@media (max-width: 920px) { .vault-hero,.vault-grid { grid-template-columns:1fr; } }
</style>
