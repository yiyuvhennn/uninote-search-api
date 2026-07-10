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

const accentClass = computed(() => {
  const list = ["accent-blue", "accent-green", "accent-amber", "accent-rose", "accent-cyan"];
  return list[props.note.id % list.length];
});

const tagList = computed(() => props.note.tags || []);
const favoriteTotal = computed(() => props.note.favoriteCount ?? props.note.favorites?.length ?? 0);

function formatDate(date?: string) {
  if (!date) return "未記錄";
  return new Intl.DateTimeFormat("zh-TW", { month: "short", day: "numeric" }).format(new Date(date));
}

async function toggleFavorite() {
  if (actionLoading.value) return;
  actionLoading.value = true;

  try {
    if (!isFavorited.value) {
      await api.post("/favorites", { noteId: props.note.id });
      isFavorited.value = true;
    } else {
      await api.delete(`/favorites/${props.note.id}`);
      isFavorited.value = false;
      emit("unfavorited", props.note.id);
    }
  } catch (error) {
    console.error("收藏操作失敗", error);
    alert("收藏操作失敗，請稍後再試");
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
    alert("刪除失敗，請稍後再試");
  } finally {
    actionLoading.value = false;
  }
}
</script>

<template>
  <article :class="['note-card', accentClass]">
    <div class="note-card__pin"></div>

    <header class="note-card__top">
      <div>
        <span class="course">{{ note.course || "未分類課程" }}</span>
        <span class="date">{{ formatDate(note.updatedAt || note.createdAt) }}</span>
      </div>

      <button
        type="button"
        :class="['favorite', { active: isFavorited }]"
        :disabled="actionLoading"
        @click="toggleFavorite"
      >
        {{ isFavorited ? "收藏中" : "收藏" }}
      </button>
    </header>

    <router-link :to="`/notes/${note.id}`" class="title-link">
      <h3>{{ note.title }}</h3>
    </router-link>

    <p class="description">{{ note.description || "這篇筆記尚未補上描述，可以從內容或檔案連結進一步查看。" }}</p>

    <div class="tag-cloud" v-if="tagList.length">
      <span v-for="tag in tagList.slice(0, 4)" :key="tag.id">#{{ tag.name }}</span>
    </div>

    <div class="mini-metrics">
      <div><span>Views</span><strong>{{ note.views ?? 0 }}</strong></div>
      <div><span>Likes</span><strong>{{ note.likes ?? 0 }}</strong></div>
      <div><span>Fav</span><strong>{{ favoriteTotal }}</strong></div>
    </div>

    <footer class="note-card__actions">
      <router-link :to="`/notes/${note.id}`" class="open-action">閱讀</router-link>
      <a v-if="note.fileUrl" :href="note.fileUrl" target="_blank" class="file-action">檔案</a>
      <button v-if="showDeleteButton" type="button" class="delete-action" :disabled="actionLoading" @click="handleDelete">刪除</button>
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
  border: 1px solid var(--line);
  border-top: 3px solid var(--accent);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.note-card:hover {
  transform: translateY(-2px);
  border-color: #cfd6e1;
  box-shadow: var(--shadow-hard);
}

.note-card__pin { display: none; }

.accent-blue { --accent: #2f6fed; }
.accent-green { --accent: #16a34a; }
.accent-amber { --accent: #d97706; }
.accent-rose { --accent: #c9467d; }
.accent-cyan { --accent: #0ea5a4; }

.note-card__top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.course,
.date {
  display: inline-flex;
  align-items: center;
  margin-right: 7px;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 750;
}

.course { color: color-mix(in srgb, var(--accent) 72%, #111827); background: color-mix(in srgb, var(--accent) 10%, white); }
.date { color: var(--muted); background: #f9fafb; border: 1px solid var(--line); }

.favorite {
  position: relative;
  z-index: 1;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 11px;
  color: #475467;
  background: #ffffff;
  font-size: 12px;
  font-weight: 750;
}
.favorite.active { color: #92400e; background: #fffbeb; border-color: #fde68a; }

.title-link { position: relative; z-index: 1; margin-top: 22px; color: inherit; text-decoration: none; }
h3 { margin: 0; color: var(--ink); font-size: 23px; line-height: 1.25; letter-spacing: 0; }
.title-link:hover h3 { color: var(--accent); }
.description { position: relative; z-index: 1; flex: 1; margin: 12px 0 16px; color: var(--muted); line-height: 1.75; }

.tag-cloud { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.tag-cloud span { padding: 5px 8px; border-radius: 999px; color: #344054; background: #f2f4f7; font-size: 12px; font-weight: 700; }

.mini-metrics { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin-bottom: 18px; }
.mini-metrics div { padding: 10px; border-radius: 10px; background: #f9fafb; border: 1px solid var(--line); }
.mini-metrics span { display: block; color: var(--subtle); font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.mini-metrics strong { display: block; margin-top: 3px; color: var(--ink); font-size: 18px; }

.note-card__actions { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 9px; }
.open-action,
.file-action,
.delete-action { min-height: 36px; padding: 0 12px; display: inline-flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 8px; font-size: 13px; font-weight: 750; text-decoration: none; }
.open-action { color: white; background: var(--ink); border-color: var(--ink); }
.file-action { color: var(--ink); background: #ffffff; }
.delete-action { color: #b42318; background: #fff5f6; border-color: #fecdd3; }
</style>
