<script setup lang="ts">
import { ref } from "vue";
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

async function toggleFavorite() {
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
  }
}

async function handleDelete() {
  const confirmed = window.confirm("確定要刪除這篇筆記嗎？");

  if (!confirmed) return;

  try {
    await api.delete(`/notes/${props.note.id}`);
    emit("deleted", props.note.id);
  } catch (error) {
    console.error("刪除筆記失敗", error);
    alert("刪除失敗");
  }
}
</script>

<template>
  <div class="card">
    <router-link
      :to="`/notes/${props.note.id}`"
      style="text-decoration: none;"
    >
      <h3 class="card-title">{{ props.note.title }}</h3>
    </router-link>

    <p class="card-text">{{ props.note.description }}</p>
    <p class="card-text">課程：{{ props.note.course }}</p>
    <p class="card-text">作者：{{ props.note.author?.name }}</p>

    <a :href="props.note.fileUrl" target="_blank">查看檔案</a>

    <div class="row" style="margin-top: 12px;">
      <button @click="toggleFavorite">
        {{ isFavorited ? "取消收藏" : "收藏" }}
      </button>

      <button v-if="props.showDeleteButton" @click="handleDelete">
        刪除
      </button>
    </div>
  </div>
</template>