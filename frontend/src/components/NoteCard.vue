<script setup lang="ts">
import { computed, ref } from "vue";
import type { Note } from "../types/note";
import api from "../services/api";
import ToastMessage from "./ToastMessage.vue";

const props = defineProps<{
  note: Note;
  initialFavorited?: boolean;
  isOwner?: boolean;
  showDeleteButton?: boolean;
}>();

const emit = defineEmits<{
  (e: "unfavorited", noteId: number): void;
  (e: "deleted", noteId: number): void;
}>();

const isFavorited = ref(props.initialFavorited ?? false);
const actionLoading = ref(false);
const feedbackMessage = ref("");
const feedbackType = ref<"success" | "error">("success");

const accentClass = computed(() => {
  const list = ["accent-blue", "accent-green", "accent-amber", "accent-rose", "accent-cyan"];
  return list[props.note.id % list.length];
});

const tagList = computed(() =>
  (props.note.tags || [])
    .map((item: any) => item?.name ? item : item?.tag)
    .filter((item): item is { id: number; name: string } => Boolean(item?.name))
);
const visibleTags = computed(() => tagList.value.slice(0, 3));
const hiddenTagCount = computed(() => Math.max(tagList.value.length - visibleTags.value.length, 0));
const favoriteTotal = computed(() => props.note.favoriteCount ?? props.note.favorites?.length ?? 0);
const visibilityLabel = computed(() => (props.note.visibility === "PRIVATE" ? "私人" : "公開"));
const isOwner = computed(() => props.isOwner ?? Boolean(props.showDeleteButton));
const canDelete = computed(() => Boolean(props.showDeleteButton));
const referenceLink = computed(() => {
  const value = props.note.fileUrl?.trim();

  if (!value || value.startsWith("uploaded-pdf:")) {
    return "";
  }

  return /^https?:\/\//i.test(value) ? value : "";
});

function formatDate(date?: string) {
  if (!date) return "未記錄";
  return new Intl.DateTimeFormat("zh-TW", { month: "short", day: "numeric" }).format(new Date(date));
}

async function toggleFavorite() {
  if (actionLoading.value) return;
  actionLoading.value = true;
  feedbackMessage.value = "";

  try {
    if (!isFavorited.value) {
      await api.post("/favorites", { noteId: props.note.id });
      isFavorited.value = true;
      feedbackType.value = "success";
      feedbackMessage.value = "已加入收藏";
    } else {
      await api.delete(`/favorites/${props.note.id}`);
      isFavorited.value = false;
      feedbackType.value = "success";
      feedbackMessage.value = "已取消收藏";
      emit("unfavorited", props.note.id);
    }
  } catch (error) {
    console.error("收藏操作失敗", error);
    feedbackType.value = "error";
    feedbackMessage.value = "收藏失敗，請稍後再試";
  } finally {
    actionLoading.value = false;
  }
}

async function handleDelete() {
  const confirmed = window.confirm("確定要刪除這篇筆記嗎？這個動作無法復原。");
  if (!confirmed) return;

  actionLoading.value = true;
  feedbackMessage.value = "";

  try {
    await api.delete(`/notes/${props.note.id}`);
    feedbackType.value = "success";
    feedbackMessage.value = "筆記已刪除";
    emit("deleted", props.note.id);
  } catch (error) {
    console.error("刪除筆記失敗", error);
    feedbackType.value = "error";
    feedbackMessage.value = "刪除失敗，請稍後再試";
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <article :class="['note-card', accentClass]">
    <header class="note-card__top">
      <div class="meta-row">
        <span class="course">{{ note.course || "未分類課程" }}</span>
        <span :class="['visibility-badge', note.visibility === 'PRIVATE' ? 'private' : 'public']">
          {{ visibilityLabel }}
        </span>
        <span v-if="isOwner" class="owner-badge">我的筆記</span>
        <span class="date">{{ formatDate(note.updatedAt || note.createdAt) }}</span>
      </div>

      <button
        type="button"
        :class="['favorite', { active: isFavorited }]"
        :disabled="actionLoading"
        @click="toggleFavorite"
      >
        {{ isFavorited ? "已收藏" : "收藏" }}
      </button>
    </header>

    <router-link :to="`/notes/${note.id}`" class="title-link">
      <h3>{{ note.title }}</h3>
    </router-link>

    <p class="description">{{ note.description || "這篇筆記尚未補上描述，可以從內容或檔案連結進一步查看。" }}</p>

    <div class="tag-cloud" v-if="visibleTags.length">
      <span v-for="tag in visibleTags" :key="tag.id">#{{ tag.name }}</span>
      <span v-if="hiddenTagCount > 0" class="more-tags">+{{ hiddenTagCount }}</span>
    </div>

    <div class="mini-metrics">
      <div><span>瀏覽</span><strong>{{ note.views ?? 0 }}</strong></div>
      <div><span>按讚</span><strong>{{ note.likes ?? 0 }}</strong></div>
      <div><span>收藏</span><strong>{{ favoriteTotal }}</strong></div>
    </div>

    <ToastMessage v-if="feedbackMessage" :message="feedbackMessage" :type="feedbackType" inline />

    <footer class="note-card__actions">
      <div class="primary-actions">
        <router-link :to="`/notes/${note.id}`" class="open-action">閱讀</router-link>
        <a v-if="referenceLink" :href="referenceLink" target="_blank" rel="noreferrer" class="file-action">參考連結</a>
      </div>

      <button v-if="canDelete" type="button" class="delete-action" :disabled="actionLoading" @click="handleDelete">刪除</button>
    </footer>
  </article>
</template>

<style scoped>
.note-card {
  position: relative;
  min-height: 292px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(255,250,240,.94), rgba(248,239,223,.9));
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.note-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 5px;
  background: var(--accent);
}

.note-card::after {
  content: "";
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(183, 121, 34, 0.16);
  pointer-events: none;
}

.note-card:hover {
  transform: translateY(-2px);
  border-color: var(--line-strong);
  box-shadow: 0 18px 42px rgba(56,39,23,.12);
}

.accent-blue { --accent: #234f9f; }
.accent-green { --accent: #1f6f55; }
.accent-amber { --accent: #b77922; }
.accent-rose { --accent: #9b2f3d; }
.accent-cyan { --accent: #1d6f78; }

.note-card__top,
.meta-row {
  position: relative;
  z-index: 1;
  display: flex;
}

.note-card__top {
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.meta-row {
  flex-wrap: wrap;
  gap: 7px;
}

.course,
.date,
.visibility-badge,
.owner-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
}

.course { color: color-mix(in srgb, var(--accent) 72%, #231b16); background: color-mix(in srgb, var(--accent) 12%, #fffaf0); border: 1px solid color-mix(in srgb, var(--accent) 24%, #ded1bd); }
.date { color: var(--muted); background: #f4ead5; border: 1px solid var(--line); }
.visibility-badge.public { color: #047857; background: #ecfdf3; border: 1px solid #bbf7d0; }
.visibility-badge.private { color: #7c2d12; background: #fff7ed; border: 1px solid #fed7aa; }
.owner-badge { color: var(--blue); background: #edf4ff; border: 1px solid #b7cdec; }

.favorite {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 8px 11px;
  color: #57422b;
  background: rgba(255,250,240,.86);
  font-size: 12px;
  font-weight: 750;
}
.favorite.active { color: #92400e; background: #fff8e7; border-color: #f3d37a; }

.title-link { position: relative; z-index: 1; margin-top: 22px; color: inherit; text-decoration: none; }
h3 { margin: 0; color: var(--ink); font-size: 24px; line-height: 1.28; letter-spacing: 0; text-wrap: balance; }
.title-link:hover h3 { color: var(--accent); }
.description { position: relative; z-index: 1; flex: 1; margin: 12px 0 16px; color: var(--muted); line-height: 1.75; }

.tag-cloud { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.tag-cloud span { padding: 5px 8px; border-radius: 999px; color: #57422b; background: #f4ead5; border: 1px solid rgba(198,179,146,.48); font-size: 12px; font-weight: 760; }
.tag-cloud .more-tags { color: var(--blue); background: #edf4ff; }

.mini-metrics { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin-bottom: 18px; }
.mini-metrics div { padding: 10px; border-radius: 4px; background: rgba(255,250,240,.72); border: 1px solid var(--line); }
.mini-metrics span { display: block; color: var(--subtle); font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.mini-metrics strong { display: block; margin-top: 3px; color: var(--ink); font-size: 18px; }

.note-card__actions { position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.primary-actions { display: flex; flex-wrap: wrap; gap: 9px; }
.open-action,
.file-action,
.delete-action { min-height: 36px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 3px; font-size: 13px; font-weight: 800; text-decoration: none; }
.open-action { color: white; background: var(--slate); border-color: var(--slate); }
.file-action { color: var(--ink); background: #fffaf0; }
.delete-action { min-height: 32px; color: #b42318; background: transparent; border-color: transparent; }
.delete-action:hover { background: #fff5f6; border-color: #fecdd3; }

@media (max-width: 560px) {
  .note-card { min-height: 0; padding: 16px; }
  .note-card__top,
  .note-card__actions {
    align-items: stretch;
    flex-direction: column;
  }
  .favorite,
  .open-action,
  .file-action,
  .delete-action {
    width: 100%;
  }
  .mini-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
