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
  const list = ["accent-blue", "accent-lime", "accent-orange", "accent-pink", "accent-cyan"];
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
  min-height: 310px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 32px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.72)),
    var(--accent-bg);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
  overflow: hidden;
  transition: 0.24s ease;
}

.note-card:hover {
  transform: translateY(-6px) rotate(-0.2deg);
  box-shadow: 0 34px 80px rgba(15, 23, 42, 0.16);
}

.note-card::after {
  content: "";
  position: absolute;
  width: 160px;
  height: 160px;
  right: -70px;
  top: -70px;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0.16;
}

.note-card__pin {
  position: absolute;
  top: 16px;
  right: 22px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 7px color-mix(in srgb, var(--accent) 18%, transparent);
}

.accent-blue { --accent: #3867ff; --accent-bg: #eff6ff; }
.accent-lime { --accent: #84cc16; --accent-bg: #f7fee7; }
.accent-orange { --accent: #fb923c; --accent-bg: #fff7ed; }
.accent-pink { --accent: #ec4899; --accent-bg: #fdf2f8; }
.accent-cyan { --accent: #06b6d4; --accent-bg: #ecfeff; }

.note-card__top {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.course,
.date {
  display: inline-flex;
  align-items: center;
  margin-right: 7px;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 950;
}

.course { color: white; background: var(--accent); }
.date { color: #475569; background: rgba(255, 255, 255, 0.78); border: 1px solid rgba(148, 163, 184, 0.22); }

.favorite {
  position: relative;
  z-index: 1;
  border: 0;
  border-radius: 999px;
  padding: 8px 11px;
  color: #475569;
  background: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  font-weight: 950;
}
.favorite.active { color: #854d0e; background: #fef3c7; }

.title-link { position: relative; z-index: 1; margin-top: 26px; color: inherit; text-decoration: none; }
h3 { margin: 0; color: #0f172a; font-size: 27px; line-height: 1.18; letter-spacing: -0.055em; }
.title-link:hover h3 { color: var(--accent); }
.description { position: relative; z-index: 1; flex: 1; margin: 14px 0 18px; color: #5b6678; line-height: 1.78; }

.tag-cloud { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
.tag-cloud span { padding: 6px 9px; border-radius: 999px; color: #334155; background: rgba(255, 255, 255, 0.76); font-size: 12px; font-weight: 900; }

.mini-metrics { position: relative; z-index: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 9px; margin-bottom: 18px; }
.mini-metrics div { padding: 12px; border-radius: 18px; background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(148, 163, 184, 0.2); }
.mini-metrics span { display: block; color: #94a3b8; font-size: 10px; font-weight: 1000; letter-spacing: 0.1em; text-transform: uppercase; }
.mini-metrics strong { display: block; margin-top: 3px; color: #111827; font-size: 20px; }

.note-card__actions { position: relative; z-index: 1; display: flex; flex-wrap: wrap; gap: 9px; }
.open-action,
.file-action,
.delete-action { min-height: 38px; padding: 0 13px; display: inline-flex; align-items: center; justify-content: center; border: 0; border-radius: 999px; font-size: 13px; font-weight: 950; text-decoration: none; }
.open-action { color: white; background: #111827; }
.file-action { color: #111827; background: rgba(255, 255, 255, 0.82); }
.delete-action { color: #be123c; background: #fff1f2; }
</style>
