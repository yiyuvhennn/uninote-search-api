<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";
import type { Note } from "../types/note";
import Navbar from "../components/Navbar.vue";

const route = useRoute();
const router = useRouter();

const note = ref<Note | null>(null);
const loading = ref(true);
const errorMessage = ref("");

async function fetchNoteDetail() {
  loading.value = true;
  errorMessage.value = "";

  try {
    const res = await api.get(`/notes/${route.params.id}`);
    note.value = res.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "讀取筆記詳情失敗";
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

  fetchNoteDetail();
});
</script>

<template>
  <div>
    <Navbar />

    <div class="page-container">
      <button @click="router.push('/notes')" style="margin-bottom: 16px;">
        返回列表
      </button>

      <p v-if="loading">載入中...</p>
      <p v-else-if="errorMessage">{{ errorMessage }}</p>

      <div v-else-if="note" class="card">
        <h1 class="page-title" style="margin-bottom: 16px;">
          {{ note.title }}
        </h1>

        <p class="card-text">{{ note.description }}</p>
        <p class="card-text">課程：{{ note.course }}</p>
        <p class="card-text">作者：{{ note.author?.name }}</p>

        <p class="card-text">
          <a :href="note.fileUrl" target="_blank">查看檔案</a>
        </p>

        <div v-if="note.tags && note.tags.length > 0" style="margin-top: 20px;">
          <h3 style="margin-bottom: 12px;">標籤</h3>

          <div class="row">
            <span
              v-for="tag in note.tags"
              :key="tag.id"
              style="
                display: inline-block;
                padding: 6px 12px;
                border: 1px solid #ccc;
                border-radius: 999px;
                background: #fafafa;
              "
            >
              {{ tag.name }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>