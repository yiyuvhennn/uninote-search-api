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

async function fetchFavorites() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await api.get("/favorites");
    console.log("favorites response:", res.data);

    if (Array.isArray(res.data) && res.data.length > 0 && res.data[0].note) {
      notes.value = res.data.map((item: any) => item.note);
    } else {
      notes.value = res.data;
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取收藏失敗";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.push("/login");
    return;
  }

  fetchFavorites();
});

function handleUnfavorited(noteId: number) {
  notes.value = notes.value.filter((note) => note.id !== noteId);
}

</script>

<template>
  <div>
    <Navbar />

    <div style="max-width: 900px; margin: 0 auto; padding: 24px;">
      <h1>我的收藏</h1>

      <p v-if="loading">載入中...</p>
      <p v-else-if="errorMessage">{{ errorMessage }}</p>

      <div v-else-if="notes.length === 0">
        <p>目前沒有收藏</p>
      </div>

      <div v-else>
        <NoteCard v-for="note in notes" 
        :key="note.id" 
        :note="note" 
        :initialFavorited="true"
        :showDeleteButton="false"
        @unfavorited="handleUnfavorited"/>
      </div>
    </div>
  </div>
</template>