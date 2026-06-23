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

const createdText = computed(() => formatDate(note.value?.createdAt));
const updatedText = computed(() => formatDate(note.value?.updatedAt));

function formatDate(value?: string) {
  if (!value) return "尚無日期";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "尚無日期";

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

async function fetchNoteDetail() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await api.get(`/notes/${route.params.id}`);
    note.value = res.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取筆記詳情失敗，請稍後再試";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchNoteDetail();
});
</script>

<template>
  <section class="detail-page page-shell">
    <button type="button" class="back-btn" @click="router.push('/notes')">
      ← 返回筆記列表
    </button>

    <div v-if="loading" class="state-panel">
      <div class="loader"></div>
      <h3>正在載入筆記詳情</h3>
      <p>系統正在讀取這篇筆記的完整資料。</p>
    </div>

    <div v-else-if="errorMessage" class="state-panel state-panel--error">
      <h3>讀取失敗</h3>
      <p>{{ errorMessage }}</p>
      <button type="button" class="primary-action retry-btn" @click="fetchNoteDetail">
        重新整理
      </button>
    </div>

    <article v-else-if="note" class="detail-card">
      <div class="detail-hero">
        <div>
          <p class="page-eyebrow">Note detail</p>
          <h1>{{ note.title }}</h1>
          <p class="description">
            {{ note.description || "這篇筆記尚未提供描述內容。" }}
          </p>
        </div>

        <div class="note-id">
          <span>NOTE ID</span>
          <strong>#{{ note.id }}</strong>
        </div>
      </div>

      <div class="info-grid">
        <div>
          <span>課程</span>
          <strong>{{ note.course || "未分類課程" }}</strong>
        </div>

        <div>
          <span>分類</span>
          <strong>{{ note.category || "未分類" }}</strong>
        </div>

        <div>
          <span>作者</span>
          <strong>{{ note.author?.name || "未知作者" }}</strong>
        </div>

        <div>
          <span>觀看 / 按讚</span>
          <strong>{{ note.views ?? 0 }} / {{ note.likes ?? 0 }}</strong>
        </div>

        <div>
          <span>建立日期</span>
          <strong>{{ createdText }}</strong>
        </div>

        <div>
          <span>更新日期</span>
          <strong>{{ updatedText }}</strong>
        </div>
      </div>

      <div class="content-section">
        <h2>可搜尋內容</h2>
        <p>
          {{ note.content || "這篇筆記尚未建立可搜尋內容。" }}
        </p>
      </div>

      <div v-if="note.tags?.length" class="tags-section">
        <h2>標籤</h2>

        <div class="tag-list">
          <span v-for="tag in note.tags" :key="tag.id">
            #{{ tag.name }}
          </span>
        </div>
      </div>

      <div class="action-panel">
        <a
          v-if="note.fileUrl"
          :href="note.fileUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="primary-action"
        >
          查看檔案
        </a>

        <router-link to="/search" class="secondary-action">
          前往搜尋系統
        </router-link>
      </div>
    </article>
  </section>
</template>

<style scoped>
.detail-page {
  margin: 0 auto;
}

.back-btn {
  border: 0;
  margin-bottom: 18px;
  padding: 11px 15px;
  border-radius: 999px;
  color: #334155;
  background: white;
  font-size: 14px;
  font-weight: 950;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.detail-card {
  padding: 30px;
  border: 1px solid rgba(203, 213, 225, 0.86);
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(66, 99, 235, 0.14), transparent 32%),
    rgba(255, 255, 255, 0.9);
  box-shadow: 0 22px 58px rgba(15, 23, 42, 0.09);
}

.detail-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: start;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.detail-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.08;
  letter-spacing: -0.07em;
}

.description {
  max-width: 780px;
  margin: 18px 0 0;
  color: #64748b;
  line-height: 1.85;
}

.note-id {
  min-width: 140px;
  padding: 18px;
  border: 1px solid #dbeafe;
  border-radius: 24px;
  background: #eff6ff;
  text-align: center;
}

.note-id span {
  color: #4263eb;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.1em;
}

.note-id strong {
  display: block;
  margin-top: 8px;
  color: #172033;
  font-size: 28px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 24px;
}

.info-grid div {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: #f8fafc;
}

.info-grid span {
  display: block;
  margin-bottom: 7px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.08em;
}

.info-grid strong {
  color: #111827;
  font-size: 16px;
}

.content-section,
.tags-section {
  margin-top: 28px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: #f8fafc;
}

.content-section h2,
.tags-section h2 {
  margin: 0 0 14px;
  color: #111827;
  font-size: 22px;
  letter-spacing: -0.04em;
}

.content-section p {
  margin: 0;
  color: #475569;
  line-height: 1.9;
  white-space: pre-wrap;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-list span {
  padding: 8px 13px;
  border-radius: 999px;
  color: #4263eb;
  background: #eef2ff;
  font-size: 13px;
  font-weight: 900;
}

.action-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.retry-btn {
  margin-top: 18px;
}

@media (max-width: 820px) {
  .detail-hero,
  .info-grid {
    grid-template-columns: 1fr;
  }

  .note-id {
    text-align: left;
  }
}
</style>
