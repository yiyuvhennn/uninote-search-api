<script setup lang="ts">
import { computed, ref } from "vue";
import type { Note } from "../types/note";
import api from "../services/api";

const props = defineProps<{
  note: Note;
  initialFavorited?: boolean;
  showDeleteButton?: boolean;
}>();

const emit = defineEmits<{
  (e: "unfavorited", noteId: number): void;
  (e: "deleted", noteId: number): void;
}>();

const isFavorited = ref(props.initialFavorited ?? false);
const actionLoading = ref(false);

const favoriteCountText = computed(() => {
  const count = props.note.favoriteCount ?? props.note.favorites?.length ?? 0;
  return count.toString();
});

const updatedText = computed(() => {
  if (!props.note.updatedAt && !props.note.createdAt) return "尚無日期";
  const date = new Date(props.note.updatedAt || props.note.createdAt || "");
  if (Number.isNaN(date.getTime())) return "尚無日期";
  return new Intl.DateTimeFormat("zh-TW", {
    month: "short",
    day: "numeric",
  }).format(date);
});

async function toggleFavorite() {
  if (actionLoading.value) return;

  actionLoading.value = true;

  try {
    if (!isFavorited.value) {
      await api.post("/favorites", {
        noteId: props.note.id,
      });

      isFavorited.value = true;
    } else {
      await api.delete(`/favorites/${props.note.id}`);
      isFavorited.value = false;
      emit("unfavorited", props.note.id);
    }
  } catch (error) {
    console.error("收藏操作失敗", error);
    window.alert("收藏操作失敗，請稍後再試");
  } finally {
    actionLoading.value = false;
  }
}

async function handleDelete() {
  const confirmed = window.confirm("確定要刪除這篇筆記嗎？這個動作無法復原。");

  if (!confirmed) return;

  actionLoading.value = true;

  try {
    await api.delete(`/notes/${props.note.id}`);
    emit("deleted", props.note.id);
  } catch (error) {
    console.error("刪除筆記失敗", error);
    window.alert("刪除失敗，請稍後再試");
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <article class="note-card">
    <div class="card-top">
      <span class="course-pill">
        {{ props.note.course || "未分類課程" }}
      </span>

      <button
        type="button"
        class="favorite-btn"
        :class="{ active: isFavorited }"
        :disabled="actionLoading"
        @click="toggleFavorite"
      >
        {{ isFavorited ? "已收藏" : "收藏" }}
      </button>
    </div>

    <router-link :to="`/notes/${props.note.id}`" class="note-link">
      <h3>{{ props.note.title }}</h3>
    </router-link>

    <p class="description">
      {{ props.note.description || "這篇筆記尚未提供描述內容。" }}
    </p>

    <div class="meta-grid">
      <div>
        <span>作者</span>
        <strong>{{ props.note.author?.name || "未知作者" }}</strong>
      </div>

      <div>
        <span>更新</span>
        <strong>{{ updatedText }}</strong>
      </div>

      <div>
        <span>觀看</span>
        <strong>{{ props.note.views ?? 0 }}</strong>
      </div>

      <div>
        <span>收藏</span>
        <strong>{{ favoriteCountText }}</strong>
      </div>
    </div>

    <div v-if="props.note.tags?.length" class="tag-row">
      <span v-for="tag in props.note.tags.slice(0, 4)" :key="tag.id">
        #{{ tag.name }}
      </span>
    </div>

    <div class="card-actions">
      <router-link :to="`/notes/${props.note.id}`" class="detail-btn">
        查看詳情
      </router-link>

      <a
        v-if="props.note.fileUrl"
        :href="props.note.fileUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="file-btn"
      >
        查看檔案
      </a>

      <button
        v-if="props.showDeleteButton"
        type="button"
        class="delete-btn"
        :disabled="actionLoading"
        @click="handleDelete"
      >
        刪除
      </button>
    </div>
  </article>
</template>

<style scoped>
.note-card {
  position: relative;
  min-height: 286px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(203, 213, 225, 0.86);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(66, 99, 235, 0.1), transparent 30%),
    rgba(255, 255, 255, 0.91);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.07);
  transition: 0.22s ease;
}

.note-card:hover {
  transform: translateY(-3px);
  border-color: #bfdbfe;
  box-shadow: 0 24px 52px rgba(15, 23, 42, 0.11);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.course-pill {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 999px;
  color: #4263eb;
  background: #eef2ff;
  font-size: 12px;
  font-weight: 950;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.favorite-btn {
  border: 0;
  padding: 8px 11px;
  border-radius: 999px;
  color: #64748b;
  background: #f8fafc;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
  transition: 0.18s ease;
}

.favorite-btn.active {
  color: #b45309;
  background: #fffbeb;
}

.note-link {
  color: inherit;
  text-decoration: none;
}

.note-link h3 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  line-height: 1.25;
  letter-spacing: -0.045em;
}

.note-link:hover h3 {
  color: #4263eb;
}

.description {
  flex: 1;
  margin: 12px 0 20px;
  color: #64748b;
  line-height: 1.75;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.meta-grid div {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: #f8fafc;
}

.meta-grid span {
  display: block;
  margin-bottom: 5px;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 950;
  letter-spacing: 0.08em;
}

.meta-grid strong {
  color: #334155;
  font-size: 13px;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag-row span {
  padding: 6px 9px;
  border-radius: 999px;
  color: #475569;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 800;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-btn,
.file-btn,
.delete-btn {
  min-height: 38px;
  padding: 0 13px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 950;
  text-decoration: none;
  cursor: pointer;
}

.detail-btn {
  color: white;
  background: linear-gradient(135deg, #4263eb, #7c3aed);
}

.file-btn {
  color: #334155;
  background: #f1f5f9;
}

.delete-btn {
  border: 0;
  color: #b91c1c;
  background: #fef2f2;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

@media (max-width: 720px) {
  .meta-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
