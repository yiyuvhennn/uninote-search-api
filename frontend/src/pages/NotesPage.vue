<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import type { Note } from "../types/note";
import NoteCard from "../components/NoteCard.vue";
import Navbar from "../components/Navbar.vue";

const router = useRouter();
const notes = ref<Note[]>([]);
const loading = ref(true);
const errorMessage = ref("");


async function fetchNotes() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await api.get("/notes");
    notes.value = res.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取筆記失敗";
  } finally {
    loading.value = false;
  }
}


function handleDeleted(noteId: number) {
  notes.value = notes.value.filter((note) => note.id !== noteId);
}

onMounted(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.push("/login");
    return;
  }

  fetchNotes();
});
</script>

<template>
  <div>
    <Navbar />

    <div class="page-container">
      <h1 class="page-title">筆記列表</h1>
      <div class="card" style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <p class="card-text" style="margin: 0;">
        這裡是所有筆記的管理列表。若要使用 Ranking、篩選、排序與分頁，請前往搜尋系統。
      </p>

      <router-link to="/search" class="primary-btn" style="text-decoration: none;">
        前往搜尋系統
      </router-link>
    </div>

      <p v-if="loading">載入中...</p>
      <p v-else-if="errorMessage">{{ errorMessage }}</p>

      <div v-else-if="notes.length === 0">
        <p>查無符合條件的筆記</p>
      </div>

      <div v-else>
        <NoteCard
          v-for="note in notes"
          :key="note.id"
          :note="note"
          :showDeleteButton="true"
          @deleted="handleDeleted"
        />
      </div>
    </div>
  </div>
</template>