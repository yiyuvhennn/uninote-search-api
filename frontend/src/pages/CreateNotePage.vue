<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

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

const completionItems = computed(() => [
  {
    label: "標題",
    done: Boolean(title.value.trim()),
  },
  {
    label: "課程",
    done: Boolean(course.value.trim()),
  },
  {
    label: "檔案連結",
    done: Boolean(fileUrl.value.trim()),
  },
  {
    label: "可搜尋內容",
    done: Boolean(content.value.trim()),
  },
]);

const completionRate = computed(() => {
  const done = completionItems.value.filter((item) => item.done).length;
  return Math.round((done / completionItems.value.length) * 100);
});

const formValid = computed(() => {
  return Boolean(title.value.trim() && fileUrl.value.trim() && course.value.trim());
});

function fillExample() {
  title.value = "工程數學傅立葉級數重點整理";
  course.value = "工程數學";
  category.value = "考試整理";
  description.value = "整理傅立葉級數、半範圍展開與常見邊界條件題型。";
  content.value =
    "本筆記包含 Fourier series、half-range sine series、half-range cosine series、wave equation 與 heat equation 的考試重點。";
  fileUrl.value = "https://example.com/fourier-note.pdf";
  views.value = 120;
  likes.value = 18;
}

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

onMounted(() => {
  errorMessage.value = "";
});
</script>

<template>
  <section class="create-page page-shell">
    <div class="page-hero">
      <div>
        <p class="page-eyebrow">Create searchable note</p>
        <h1>新增可搜尋筆記</h1>
        <p>
          這裡新增的 title、description、content、course、category、views 與 likes
          會被 Search API 用於搜尋、篩選與 Ranking Score 計算。
        </p>
      </div>

      <div class="hero-actions">
        <button type="button" class="secondary-action" @click="fillExample">
          填入範例
        </button>

        <router-link to="/notes" class="secondary-action">
          返回列表
        </router-link>
      </div>
    </div>

    <div class="create-layout">
      <aside class="progress-card">
        <p class="page-eyebrow">Form readiness</p>
        <strong>{{ completionRate }}%</strong>
        <span>資料完整度</span>

        <div class="progress-track">
          <i :style="{ width: `${completionRate}%` }"></i>
        </div>

        <ul>
          <li
            v-for="item in completionItems"
            :key="item.label"
            :class="{ done: item.done }"
          >
            <span></span>
            {{ item.label }}
          </li>
        </ul>
      </aside>

      <form class="form-card" @submit.prevent="handleSubmit">
        <div class="form-section">
          <div>
            <h2>基本資訊</h2>
            <p>先建立筆記的主要辨識欄位，讓搜尋結果有清楚的上下文。</p>
          </div>

          <div class="form-grid">
            <label>
              <span>筆記標題 *</span>
              <input v-model="title" type="text" placeholder="例如：微積分期中考重點整理" />
            </label>

            <label>
              <span>課程名稱 *</span>
              <input v-model="course" type="text" placeholder="例如：工程數學" />
            </label>

            <label>
              <span>分類</span>
              <input v-model="category" type="text" placeholder="例如：考試整理" />
            </label>

            <label>
              <span>檔案連結 *</span>
              <input v-model="fileUrl" type="text" placeholder="https://example.com/note.pdf" />
            </label>
          </div>
        </div>

        <div class="form-section">
          <div>
            <h2>搜尋內容</h2>
            <p>content 欄位會影響內容命中分數，是 Search API 的核心資料來源之一。</p>
          </div>

          <label>
            <span>筆記描述</span>
            <input v-model="description" type="text" placeholder="簡短描述這份筆記" />
          </label>

          <label>
            <span>可搜尋內容 Content</span>
            <textarea
              v-model="content"
              rows="8"
              placeholder="輸入筆記重點內容，Search API 會搜尋這個欄位並計算內容命中分數。"
            ></textarea>
          </label>
        </div>

        <div class="form-section">
          <div>
            <h2>Ranking 參數</h2>
            <p>views 與 likes 會影響 popularity，方便你展示熱門度排序。</p>
          </div>

          <div class="form-grid compact">
            <label>
              <span>初始觀看數</span>
              <input v-model="views" type="number" min="0" />
            </label>

            <label>
              <span>初始按讚數</span>
              <input v-model="likes" type="number" min="0" />
            </label>
          </div>
        </div>

        <div v-if="errorMessage" class="message error-message">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="message success-message">
          {{ successMessage }}
        </div>

        <div class="form-actions">
          <button class="primary-action" type="submit" :disabled="loading || !formValid">
            {{ loading ? "送出中..." : "新增筆記" }}
          </button>

          <router-link to="/search" class="secondary-action">
            前往搜尋系統
          </router-link>
        </div>
      </form>
    </div>
  </section>
</template>

<style scoped>
.create-page {
  margin: 0 auto;
}

.page-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: end;
  margin-bottom: 22px;
  padding: 30px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 30px;
  background:
    radial-gradient(circle at top right, rgba(8, 145, 178, 0.15), transparent 32%),
    rgba(255, 255, 255, 0.84);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.07);
}

.page-hero h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(38px, 5vw, 58px);
  line-height: 1.05;
  letter-spacing: -0.07em;
}

.page-hero p {
  max-width: 800px;
  margin: 16px 0 0;
  color: #64748b;
  line-height: 1.8;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.create-layout {
  display: grid;
  grid-template-columns: 290px 1fr;
  gap: 22px;
  align-items: start;
}

.progress-card,
.form-card {
  border: 1px solid #e2e8f0;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
}

.progress-card {
  position: sticky;
  top: 100px;
  padding: 24px;
}

.progress-card strong {
  display: block;
  color: #111827;
  font-size: 52px;
  line-height: 1;
  letter-spacing: -0.08em;
}

.progress-card > span {
  display: block;
  margin-top: 7px;
  color: #64748b;
  font-weight: 850;
}

.progress-track {
  height: 10px;
  margin: 22px 0;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.progress-track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(135deg, #0891b2, #7c3aed);
}

.progress-card ul {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.progress-card li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #64748b;
  font-size: 14px;
  font-weight: 850;
}

.progress-card li span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #cbd5e1;
}

.progress-card li.done {
  color: #0f766e;
}

.progress-card li.done span {
  background: #14b8a6;
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
}

.form-card {
  padding: 26px;
}

.form-section {
  padding: 22px 0;
  border-bottom: 1px solid #e2e8f0;
}

.form-section:first-child {
  padding-top: 0;
}

.form-section h2 {
  margin: 0;
  color: #111827;
  font-size: 24px;
  letter-spacing: -0.05em;
}

.form-section p {
  margin: 8px 0 18px;
  color: #64748b;
  line-height: 1.75;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.form-grid.compact {
  max-width: 520px;
}

label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.message {
  margin-top: 18px;
  padding: 13px 15px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 850;
}

.error-message {
  border: 1px solid #fecaca;
  color: #b91c1c;
  background: #fef2f2;
}

.success-message {
  border: 1px solid #bbf7d0;
  color: #15803d;
  background: #f0fdf4;
}

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 22px;
}

@media (max-width: 980px) {
  .page-hero,
  .create-layout,
  .form-grid {
    grid-template-columns: 1fr;
  }

  .progress-card {
    position: static;
  }

  .hero-actions {
    justify-content: flex-start;
  }
}
</style>
