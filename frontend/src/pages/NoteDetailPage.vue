<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";
import type { Note } from "../types/note";

const route = useRoute();
const router = useRouter();
const note = ref<Note | null>(null);
const loading = ref(true);
const errorMessage = ref("");
const tagList = computed(() => note.value?.tags || []);

function formatDate(date?: string) {
  if (!date) return "未記錄";
  return new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "long", day: "numeric" }).format(new Date(date));
}
async function fetchNoteDetail() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const res = await api.get(`/notes/${route.params.id}`);
    note.value = res.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取筆記詳情失敗，請稍後再試。";
  } finally { loading.value = false; }
}
onMounted(fetchNoteDetail);
</script>

<template>
  <section class="detail-room page-frame">
    <button class="ghost-action back" type="button" @click="router.push('/notes')">← 返回筆記庫</button>
    <section v-if="loading" class="state-panel"><div class="spinner"></div><h3>載入筆記詳情</h3><p>正在讀取完整資料。</p></section>
    <section v-else-if="errorMessage" class="state-panel error"><h3>讀取失敗</h3><p>{{ errorMessage }}</p><button class="primary-action" @click="fetchNoteDetail">重新整理</button></section>

    <article v-else-if="note" class="detail-document">
      <header class="document-hero">
        <div>
          <p class="page-kicker">Document detail</p>
          <h1>{{ note.title }}</h1>
          <p>{{ note.description || "這篇筆記尚未提供描述。" }}</p>
        </div>
        <aside><span>Note ID</span><strong>#{{ note.id }}</strong></aside>
      </header>

      <div class="info-rack">
        <div><span>Course</span><strong>{{ note.course || '未分類' }}</strong></div>
        <div><span>Author</span><strong>{{ note.author?.name || '未知作者' }}</strong></div>
        <div><span>Updated</span><strong>{{ formatDate(note.updatedAt || note.createdAt) }}</strong></div>
        <div><span>Stats</span><strong>{{ note.views }} views / {{ note.likes }} likes</strong></div>
      </div>

      <section class="content-section" v-if="note.content"><h2>可搜尋內容</h2><p>{{ note.content }}</p></section>
      <section v-if="tagList.length" class="tags-section"><h2>Tags</h2><div><span v-for="tag in tagList" :key="tag.id">#{{ tag.name }}</span></div></section>

      <footer class="action-strip">
        <a v-if="note.fileUrl" :href="note.fileUrl" target="_blank" class="primary-action">查看檔案</a>
        <router-link to="/search" class="secondary-action">用搜尋艙驗證</router-link>
      </footer>
    </article>
  </section>
</template>

<style scoped>
.detail-room { padding:28px 0 60px; }.back { margin-bottom:18px; width:auto; }
.detail-document { padding:32px; border:1px solid var(--line); border-radius:42px; background:linear-gradient(145deg,#ffffff,#f8fafc); box-shadow:var(--shadow-soft); }
.document-hero { display:grid; grid-template-columns:1fr 180px; gap:22px; align-items:start; padding-bottom:26px; border-bottom:1px solid rgba(148,163,184,.25); }.document-hero h1 { margin:0; font-size:clamp(42px,6vw,76px); line-height:.98; letter-spacing:-.09em; }.document-hero p:not(.page-kicker) { max-width:760px; color:#64748b; line-height:1.85; }.document-hero aside { padding:22px; border-radius:28px; color:#08111f; background:linear-gradient(135deg,#a3e635,#22d3ee); text-align:center; }.document-hero aside span { font-size:12px; font-weight:1000; text-transform:uppercase; }.document-hero aside strong { display:block; margin-top:8px; font-size:36px; letter-spacing:-.07em; }
.info-rack { display:grid; grid-template-columns:repeat(4,1fr); gap:13px; margin:24px 0; }.info-rack div { padding:16px; border-radius:22px; background:#f8fafc; border:1px solid rgba(148,163,184,.2); }.info-rack span { color:#94a3b8; font-size:11px; font-weight:1000; text-transform:uppercase; }.info-rack strong { display:block; margin-top:7px; }
.content-section,.tags-section { margin-top:24px; padding:24px; border-radius:30px; background:#fff7ed; }.content-section h2,.tags-section h2 { margin:0 0 12px; font-size:28px; letter-spacing:-.06em; }.content-section p { margin:0; color:#475569; line-height:1.9; }.tags-section { background:#eff6ff; }.tags-section div { display:flex; flex-wrap:wrap; gap:10px; }.tags-section span { padding:8px 12px; border-radius:999px; color:#3867ff; background:white; font-weight:950; }
.action-strip { display:flex; flex-wrap:wrap; gap:12px; margin-top:26px; padding-top:24px; border-top:1px solid rgba(148,163,184,.25); }
@media (max-width: 920px) { .document-hero,.info-rack { grid-template-columns:1fr; } }
</style>
