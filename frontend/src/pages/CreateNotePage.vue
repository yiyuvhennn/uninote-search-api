<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import Navbar from "../components/Navbar.vue";

const router = useRouter();

const title = ref("");
const description = ref("");
const content = ref("");
const fileUrl = ref("");
const course = ref("");
const category = ref("");
const views = ref(0);
const likes = ref(0);

const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

onMounted(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    router.push("/login");
  }
});

async function handleSubmit() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!title.value.trim()) {
    errorMessage.value = "請輸入筆記標題";
    return;
  }

  if (!fileUrl.value.trim()) {
    errorMessage.value = "請輸入檔案連結";
    return;
  }

  if (!course.value.trim()) {
    errorMessage.value = "請輸入課程名稱";
    return;
  }

  if (description.value.trim() && description.value.trim().length < 5) {
    errorMessage.value = "筆記描述至少要 5 個字";
    return;
  }

  loading.value = true;

  try {
    await api.post("/notes", {
      title: title.value.trim(),
      description: description.value.trim(),
      content: content.value.trim(),
      fileUrl: fileUrl.value.trim(),
      course: course.value.trim(),
      category: category.value.trim(),
      views: Number(views.value) || 0,
      likes: Number(likes.value) || 0,
    });

    successMessage.value = "新增成功，即將前往搜尋系統";

    setTimeout(() => {
      router.push("/search");
    }, 800);
  } catch (error) {
    console.error(error);
    errorMessage.value = "新增失敗，請確認資料是否正確";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div>
    <Navbar />

    <div class="page-container create-page">
      <p class="eyebrow">Create Note</p>
      <h1 class="page-title">新增可搜尋筆記</h1>
      <p class="hero-description">
        這裡新增的 content、category、views、likes 會被 Search API 用於搜尋、篩選與 Ranking score 計算。
      </p>

      <div class="card form-card">
        <div class="form-grid">
          <label>
            筆記標題 *
            <input v-model="title" type="text" placeholder="例如：微積分期中考重點整理" />
          </label>

          <label>
            課程名稱 *
            <input v-model="course" type="text" placeholder="例如：微積分" />
          </label>

          <label>
            分類
            <input v-model="category" type="text" placeholder="例如：考試整理" />
          </label>

          <label>
            檔案連結 *
            <input v-model="fileUrl" type="text" placeholder="https://example.com/note.pdf" />
          </label>

          <label>
            初始觀看數
            <input v-model="views" type="number" min="0" />
          </label>

          <label>
            初始按讚數
            <input v-model="likes" type="number" min="0" />
          </label>
        </div>

        <label class="full-field">
          筆記描述
          <input v-model="description" type="text" placeholder="簡短描述這份筆記" />
        </label>

        <label class="full-field">
          可搜尋內容 Content
          <textarea v-model="content" rows="7" placeholder="輸入筆記重點內容，Search API 會搜尋這個欄位並計算內容命中分數。"></textarea>
        </label>

        <button class="primary-btn" @click="handleSubmit" :disabled="loading">
          {{ loading ? "送出中..." : "新增筆記" }}
        </button>

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
        <p v-if="successMessage" class="success-text">{{ successMessage }}</p>
      </div>
    </div>
  </div>
</template>
