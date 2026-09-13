<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";
import type { Note } from "../types/note";
import ToastMessage from "../components/ToastMessage.vue";

const route = useRoute();
const router = useRouter();
const note = ref<Note | null>(null);
const loading = ref(true);
const errorMessage = ref("");
const actionMessage = ref("");
const actionError = ref("");
const favoriteLoading = ref(false);
const isFavorited = ref(false);
const currentUserId = ref<number | null>(null);
const pdfLoading = ref(false);
const tagList = computed(() => note.value?.tags || []);
const visibilityLabel = computed(() => (note.value?.visibility === "PRIVATE" ? "私人" : "公開"));
const isOwner = computed(() => Boolean(note.value && currentUserId.value === note.value.authorId));
const referenceLink = computed(() => {
  const value = note.value?.fileUrl?.trim();
  if (!value || value.startsWith("uploaded-pdf:")) return "";
  return /^https?:\/\//i.test(value) ? value : "";
});
const hasStoredPdf = computed(() => note.value?.fileUrl?.startsWith("uploaded-pdf:") ?? false);
const favoriteCount = computed(() => note.value?.favoriteCount ?? note.value?.favorites?.length ?? 0);

function formatDate(date?: string) {
  if (!date) return "未記錄";
  return new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "long", day: "numeric" }).format(new Date(date));
}
async function fetchNoteDetail() {
  loading.value = true;
  errorMessage.value = "";
  actionMessage.value = "";
  actionError.value = "";
  try {
    const [noteRes, meRes] = await Promise.all([
      api.get(`/notes/${route.params.id}`),
      api.get("/auth/me"),
    ]);
    note.value = noteRes.data;
    currentUserId.value = meRes.data.user.id;
    isFavorited.value = Boolean(noteRes.data.favorites?.length);
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取筆記詳情失敗，請稍後再試。";
  } finally { loading.value = false; }
}

async function toggleFavorite() {
  if (!note.value || favoriteLoading.value) return;

  favoriteLoading.value = true;
  actionMessage.value = "";
  actionError.value = "";

  try {
    if (!isFavorited.value) {
      await api.post("/favorites", { noteId: note.value.id });
      isFavorited.value = true;
      note.value.favoriteCount = (note.value.favoriteCount ?? favoriteCount.value) + 1;
      note.value.favorites = [{}];
      actionMessage.value = "已加入收藏";
    } else {
      await api.delete(`/favorites/${note.value.id}`);
      isFavorited.value = false;
      note.value.favoriteCount = Math.max((note.value.favoriteCount ?? favoriteCount.value) - 1, 0);
      note.value.favorites = [];
      actionMessage.value = "已取消收藏";
    }
  } catch (error) {
    console.error(error);
    actionError.value = "收藏失敗，請稍後再試。";
  } finally {
    favoriteLoading.value = false;
  }
}

async function openOriginalPdf() {
  if (!note.value || pdfLoading.value) return;

  pdfLoading.value = true;
  actionError.value = "";
  try {
    const response = await api.get(`/notes/${note.value.id}/file`, {
      responseType: "blob",
    });
    const url = URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" })
    );
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    console.error(error);
    actionError.value = "PDF 原始檔讀取失敗，請稍後再試。";
  } finally {
    pdfLoading.value = false;
  }
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
          <p class="page-kicker">筆記詳情</p>
          <div class="detail-badges">
            <span :class="['visibility-badge', note.visibility === 'PRIVATE' ? 'private' : 'public']">{{ visibilityLabel }}</span>
            <span v-if="isOwner" class="owner-badge">我的筆記</span>
          </div>
          <h1>{{ note.title }}</h1>
          <p>{{ note.description || "這篇筆記尚未提供描述。" }}</p>
        </div>
        <aside>
          <span>收藏狀態</span>
          <strong>{{ isFavorited ? "已收藏" : "尚未收藏" }}</strong>
          <button type="button" :disabled="favoriteLoading" @click="toggleFavorite">
            {{ favoriteLoading ? "處理中..." : isFavorited ? "取消收藏" : "加入收藏" }}
          </button>
        </aside>
      </header>

      <div class="info-rack">
        <div><span>課程</span><strong>{{ note.course || '未指定課程' }}</strong></div>
        <div><span>分類</span><strong>{{ note.category || '未分類' }}</strong></div>
        <div><span>作者</span><strong>{{ note.author?.name || '未知作者' }}</strong></div>
        <div><span>收藏</span><strong>{{ favoriteCount }} 人收藏</strong></div>
        <div><span>更新時間</span><strong>{{ formatDate(note.updatedAt || note.createdAt) }}</strong></div>
      </div>

      <ToastMessage v-if="actionMessage" :message="actionMessage" type="success" inline />
      <ToastMessage v-if="actionError" :message="actionError" type="error" inline />

      <section class="content-section" v-if="note.content"><h2>筆記內容</h2><p>{{ note.content }}</p></section>
      <section v-if="tagList.length" class="tags-section"><h2>標籤</h2><div><span v-for="tag in tagList" :key="tag.id">#{{ tag.name }}</span></div></section>

      <footer class="action-strip">
        <button v-if="hasStoredPdf" type="button" class="primary-action" :disabled="pdfLoading" @click="openOriginalPdf">
          {{ pdfLoading ? "開啟中..." : "查看 PDF 原始檔" }}
        </button>
        <a v-if="referenceLink" :href="referenceLink" target="_blank" rel="noreferrer" class="primary-action">參考連結</a>
        <router-link to="/search" class="secondary-action">回到搜尋</router-link>
      </footer>
    </article>
  </section>
</template>

<style scoped>
.detail-room { padding:14px 0 64px; }.back { margin-bottom:18px; width:auto; }
.detail-document { position:relative; padding:30px; border:1px solid var(--line-strong); border-radius:5px; background:rgba(255,250,240,.88); box-shadow:var(--shadow-soft); backdrop-filter:blur(18px); }
.detail-document::before { content:""; position:absolute; inset:12px; border:1px solid rgba(183,121,34,.16); pointer-events:none; }
.document-hero { position:relative; z-index:1; display:grid; grid-template-columns:1fr 230px; gap:22px; align-items:start; padding-bottom:26px; border-bottom:1px solid var(--line); }.document-hero h1 { margin:10px 0 0; font-size:clamp(36px,5vw,56px); line-height:1.06; letter-spacing:0; }.document-hero p:not(.page-kicker) { max-width:760px; color:var(--muted); line-height:1.85; }.document-hero aside { padding:18px; border:1px solid #d9ad55; border-radius:5px; color:#7f4f10; background:linear-gradient(180deg,#fff4df 0%,#fffaf0 100%); text-align:left; }.document-hero aside span { font-size:12px; font-weight:850; text-transform:uppercase; }.document-hero aside strong { display:block; margin:8px 0 14px; font-size:22px; letter-spacing:0; }.document-hero aside button { width:100%; min-height:42px; border:0; border-radius:4px; color:#fff; background:linear-gradient(180deg,#c99637,#8f5d16); font-weight:850; }
.detail-badges { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
.visibility-badge,.owner-badge { display:inline-flex; align-items:center; padding:6px 10px; border-radius:999px; font-size:12px; font-weight:800; }
.visibility-badge.public { color:#047857; background:#ecfdf3; border:1px solid #bbf7d0; }
.visibility-badge.private { color:#7c2d12; background:#fff7ed; border:1px solid #fed7aa; }
.owner-badge { color:var(--blue); background:#edf4ff; border:1px solid #b7cdec; }
.info-rack { position:relative; z-index:1; display:grid; grid-template-columns:repeat(5,1fr); gap:13px; margin:24px 0; }.info-rack div { padding:16px; border-radius:5px; background:#f4ead5; border:1px solid var(--line); }.info-rack span { color:var(--subtle); font-size:11px; font-weight:850; text-transform:uppercase; }.info-rack strong { display:block; margin-top:7px; }
.content-section,.tags-section { position:relative; z-index:1; margin-top:24px; padding:24px; border:1px solid var(--line-strong); border-radius:5px; background:#fffaf0; }.content-section h2,.tags-section h2 { margin:0 0 12px; font-size:26px; letter-spacing:0; }.content-section p { margin:0; color:var(--muted); line-height:1.9; }.tags-section { background:#edf4ff; border-color:#b7cdec; }.tags-section div { display:flex; flex-wrap:wrap; gap:10px; }.tags-section span { padding:8px 12px; border-radius:999px; color:var(--blue); background:white; font-weight:750; }
.action-strip { display:flex; flex-wrap:wrap; gap:12px; margin-top:26px; padding-top:24px; border-top:1px solid rgba(148,163,184,.25); }
@media (max-width: 1100px) { .info-rack { grid-template-columns:repeat(2,1fr); } }
@media (max-width: 920px) { .document-hero { grid-template-columns:1fr; } }
@media (max-width: 560px) { .detail-room { padding-top: 8px; } .detail-document { padding: 18px; } .info-rack { grid-template-columns:1fr; } }
</style>
