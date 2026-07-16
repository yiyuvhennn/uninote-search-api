<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import type { Note } from "../types/note";
import NoteCard from "../components/NoteCard.vue";

const notes = ref<Note[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const currentUserId = ref<number | null>(null);
const totalLikes = computed(() => notes.value.reduce((sum, note) => sum + (note.likes || 0), 0));

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
      <div class="vault-stat"><strong>{{ notes.length }}</strong><span>已收藏</span></div>
      <div class="vault-stat glow"><strong>{{ totalLikes }}</strong><span>按讚數</span></div>
    </div>

    <section v-if="loading" class="state-panel dark"><div class="spinner"></div><h3>讀取收藏中</h3><p>正在整理你的收藏筆記。</p></section>
    <section v-else-if="errorMessage" class="state-panel error"><h3>讀取失敗</h3><p>{{ errorMessage }}</p><button class="primary-action" @click="fetchFavorites">重新整理</button></section>
    <section v-else-if="notes.length === 0" class="empty-vault">
      <h3>還沒有收藏筆記</h3>
      <p>你收藏的公開筆記會出現在這裡。看到重要資料時，點擊收藏就能快速回來查看。</p>
      <div class="empty-actions">
        <router-link to="/search" class="primary-action">去搜尋筆記</router-link>
        <router-link to="/notes" class="secondary-action">查看筆記庫</router-link>
      </div>
    </section>
    <section v-else class="vault-grid"><NoteCard v-for="note in notes" :key="note.id" :note="note" :initialFavorited="true" :isOwner="note.authorId === currentUserId" :showDeleteButton="false" @unfavorited="handleUnfavorited" /></section>
  </section>
</template>

<style scoped>
.favorite-vault { padding:22px 0 60px; }.vault-hero { display:grid; grid-template-columns:1fr 160px 160px; gap:16px; align-items:stretch; padding:24px; border:1px solid var(--line); border-radius:14px; color:var(--ink); background:#ffffff; box-shadow:var(--shadow-soft); }
h1 { margin:0; font-size:clamp(34px,5vw,54px); line-height:1.08; letter-spacing:0; }.vault-hero p:not(.page-kicker) { max-width:650px; color:#64748b; line-height:1.7; }.vault-stat { display:grid; place-items:center; align-content:center; border:1px solid var(--line); border-radius:12px; background:#f9fafb; }.vault-stat strong { font-size:44px; letter-spacing:0; }.vault-stat span { color:#64748b; font-size:12px; font-weight:800; text-transform:uppercase; }.vault-stat.glow { background:#eff6ff; border-color:#bfdbfe; }
.vault-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; margin-top:22px; }.empty-vault { margin-top:22px; padding:48px 32px; border:1px solid var(--line); border-radius:14px; color:var(--ink); background:#ffffff; text-align:center; box-shadow:var(--shadow-soft); }.empty-vault h3 { margin:0 0 10px; font-size:32px; letter-spacing:0; }.empty-vault p { max-width:560px; margin:0 auto 24px; color:#64748b; line-height:1.8; }
.empty-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:12px; }
@media (max-width: 920px) { .vault-hero,.vault-grid { grid-template-columns:1fr; } }
@media (max-width: 560px) { .empty-actions { flex-direction:column; } }
</style>
