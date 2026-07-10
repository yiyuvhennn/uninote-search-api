<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();
const title = ref("");
const description = ref("");
const content = ref("");
const fileUrl = ref("");
const course = ref("");
const category = ref("");
const visibility = ref<"PUBLIC" | "PRIVATE">("PUBLIC");
const views = ref(0);
const likes = ref(0);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const pdfFile = ref<File | null>(null);
const pdfTitle = ref("");
const pdfCourse = ref("");
const pdfCategory = ref("");
const pdfTags = ref("");
const pdfVisibility = ref<"PUBLIC" | "PRIVATE">("PUBLIC");
const pdfLoading = ref(false);
const pdfErrorMessage = ref("");
const pdfSuccessMessage = ref("");

const completion = computed(() => {
  const fields = [title.value, description.value, content.value, fileUrl.value, course.value, category.value];
  return Math.round((fields.filter((item) => item.trim()).length / fields.length) * 100);
});

function fillExample() {
  title.value = "傅立葉級數考前重點";
  course.value = "工程數學";
  category.value = "考試整理";
  fileUrl.value = "https://example.com/fourier-note.pdf";
  description.value = "整理傅立葉級數的基本公式、奇偶函數判斷與常見題型。";
  content.value = "傅立葉級數可將週期函數表示成 sin 與 cos 的組合。考試重點包含 a0、an、bn 計算、半區間展開、奇偶函數判斷與波動方程應用。";
  views.value = 128;
  likes.value = 18;
  visibility.value = "PUBLIC";
}

async function handleSubmit() {
  errorMessage.value = "";
  successMessage.value = "";
  if (!title.value.trim()) return (errorMessage.value = "請輸入筆記標題");
  if (!course.value.trim()) return (errorMessage.value = "請輸入課程名稱");
  if (!fileUrl.value.trim()) return (errorMessage.value = "請輸入檔案連結");
  if (description.value.trim() && description.value.trim().length < 5) return (errorMessage.value = "筆記描述至少要 5 個字");

  loading.value = true;
  try {
    await api.post("/notes", { title: title.value.trim(), description: description.value.trim(), content: content.value.trim(), fileUrl: fileUrl.value.trim(), course: course.value.trim(), category: category.value.trim(), visibility: visibility.value, views: Number(views.value) || 0, likes: Number(likes.value) || 0 });
    successMessage.value = "新增成功，即將前往搜尋艙";
    setTimeout(() => router.push("/search"), 900);
  } catch (error) {
    console.error(error);
    errorMessage.value = "新增失敗，請確認資料是否正確";
  } finally { loading.value = false; }
}

function handlePdfFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  pdfFile.value = input.files?.[0] || null;
  pdfErrorMessage.value = "";
  pdfSuccessMessage.value = "";
}

async function handlePdfUpload() {
  pdfErrorMessage.value = "";
  pdfSuccessMessage.value = "";

  if (!pdfFile.value) {
    pdfErrorMessage.value = "請先選擇 PDF 檔案";
    return;
  }

  const formData = new FormData();
  formData.append("file", pdfFile.value);
  formData.append("title", pdfTitle.value.trim());
  formData.append("course", pdfCourse.value.trim());
  formData.append("category", pdfCategory.value.trim());
  formData.append("tags", pdfTags.value.trim());
  formData.append("visibility", pdfVisibility.value);

  pdfLoading.value = true;

  try {
    await api.post("/notes/upload-pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    pdfSuccessMessage.value = "PDF 匯入成功，即將前往搜尋艙";
    setTimeout(() => router.push("/search"), 900);
  } catch (error: any) {
    console.error(error);
    pdfErrorMessage.value =
      error?.response?.data?.message || "PDF 匯入失敗，請確認檔案是否為文字型 PDF";
  } finally {
    pdfLoading.value = false;
  }
}
</script>

<template>
  <section class="create-studio page-frame">
    <div class="studio-hero">
      <div><p class="page-kicker">Create studio</p><h1>新增筆記</h1><p>這裡不是只新增資料，而是在建立 Search API 可以搜尋、排序、驗證的素材。</p></div>
      <button class="secondary-action" @click="fillExample">填入範例</button>
    </div>

    <section class="pdf-import-panel">
      <div>
        <p class="page-kicker">PDF import</p>
        <h2>匯入文字型 PDF</h2>
        <p>
          上傳可選取文字的 PDF，後端會擷取文字並建立一筆可搜尋 Note。
          掃描型 PDF 目前不做 OCR。
        </p>
      </div>

      <form class="pdf-form" @submit.prevent="handlePdfUpload">
        <label>
          <span>PDF 檔案 *</span>
          <input type="file" accept="application/pdf,.pdf" @change="handlePdfFileChange" />
        </label>

        <div class="form-grid">
          <label><span>標題</span><input v-model="pdfTitle" placeholder="不填則使用 PDF 檔名" /></label>
          <label><span>課程</span><input v-model="pdfCourse" placeholder="例如：工程數學" /></label>
          <label><span>分類</span><input v-model="pdfCategory" placeholder="例如：PDF 匯入" /></label>
          <label><span>標籤</span><input v-model="pdfTags" placeholder="例如：期中考,傅立葉,PDF" /></label>
          <label>
            <span>可見性</span>
            <select v-model="pdfVisibility">
              <option value="PUBLIC">公開：所有登入使用者可搜尋</option>
              <option value="PRIVATE">私人：只有自己可搜尋</option>
            </select>
          </label>
        </div>

        <p v-if="pdfErrorMessage" class="message error">{{ pdfErrorMessage }}</p>
        <p v-if="pdfSuccessMessage" class="message success">{{ pdfSuccessMessage }}</p>

        <button class="submit-note pdf-submit" :disabled="pdfLoading">
          {{ pdfLoading ? "匯入中..." : "匯入 PDF 並建立筆記" }}
        </button>
      </form>
    </section>

    <div class="studio-layout">
      <form class="studio-form" @submit.prevent="handleSubmit">
        <div class="form-grid">
          <label><span>筆記標題 *</span><input v-model="title" placeholder="例如：微積分期中考重點整理" /></label>
          <label><span>課程名稱 *</span><input v-model="course" placeholder="例如：微積分" /></label>
          <label><span>分類</span><input v-model="category" placeholder="例如：考試整理" /></label>
          <label><span>檔案連結 *</span><input v-model="fileUrl" placeholder="https://example.com/note.pdf" /></label>
          <label>
            <span>可見性</span>
            <select v-model="visibility">
              <option value="PUBLIC">公開：所有登入使用者可搜尋</option>
              <option value="PRIVATE">私人：只有自己可搜尋</option>
            </select>
          </label>
          <label><span>初始觀看數</span><input v-model="views" type="number" min="0" /></label>
          <label><span>初始按讚數</span><input v-model="likes" type="number" min="0" /></label>
        </div>
        <label><span>筆記描述</span><input v-model="description" placeholder="簡短描述這份筆記" /></label>
        <label><span>可搜尋內容 Content</span><textarea v-model="content" rows="8" placeholder="輸入筆記重點內容，Search API 會搜尋這個欄位並計算內容命中分數。"></textarea></label>
        <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
        <p v-if="successMessage" class="message success">{{ successMessage }}</p>
        <button class="submit-note" :disabled="loading">{{ loading ? "送出中..." : "建立可搜尋筆記" }}</button>
      </form>

      <aside class="preview-panel">
        <span class="preview-kicker">Live preview</span>
        <h2>{{ title || "尚未輸入標題" }}</h2>
        <p>{{ description || "描述會出現在搜尋結果卡片中，幫助使用者判斷內容是否相關。" }}</p>
        <div class="progress-ring"><strong>{{ completion }}%</strong><span>資料完整度</span></div>
        <div class="signal-list"><div><b>Title Match</b><span>標題會被高權重計分</span></div><div><b>Content Match</b><span>內容會影響搜尋命中</span></div><div><b>Popularity</b><span>views / likes 影響熱門度</span></div></div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.create-studio { padding: 28px 0 60px; }

.studio-hero {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--ink);
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

h1 {
  margin: 0;
  font-size: clamp(42px, 6vw, 72px);
  line-height: 1.04;
  letter-spacing: 0;
}

.studio-hero p:not(.page-kicker) {
  max-width: 680px;
  color: var(--muted);
  line-height: 1.8;
}

.pdf-import-panel {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
  margin-top: 22px;
  padding: 24px;
  border: 1px solid #bfdbfe;
  border-radius: 14px;
  background: #eff6ff;
  box-shadow: var(--shadow-soft);
}

.pdf-import-panel h2 {
  margin: 0;
  color: var(--ink);
  font-size: 30px;
  letter-spacing: 0;
}

.pdf-import-panel p:not(.page-kicker) {
  color: var(--muted);
  line-height: 1.75;
}

.pdf-form { display: grid; gap: 14px; }
.pdf-submit { background: var(--blue); }

.studio-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  margin-top: 22px;
  align-items: start;
}

.studio-form,
.preview-panel {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255,255,255,.9);
  box-shadow: var(--shadow-soft);
}

.studio-form {
  padding: 24px;
  display: grid;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2,1fr);
  gap: 14px;
}

label { display: grid; gap: 8px; }

label span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.preview-panel {
  position: sticky;
  top: 110px;
  padding: 24px;
  color: var(--ink);
  background: #ffffff;
}

.preview-kicker {
  color: var(--blue);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.preview-panel h2 {
  margin: 14px 0 10px;
  font-size: 30px;
  line-height: 1.15;
  letter-spacing: 0;
}

.preview-panel p {
  color: var(--muted);
  line-height: 1.75;
}

.progress-ring {
  width: 144px;
  height: 144px;
  margin: 24px auto;
  display: grid;
  place-items: center;
  align-content: center;
  border-radius: 50%;
  background: conic-gradient(var(--blue) calc(var(--p, 0) * 1%), #e4e7ec 0);
  position: relative;
}

.progress-ring::before {
  content: "";
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background: #ffffff;
}

.progress-ring strong,
.progress-ring span {
  position: relative;
  z-index: 1;
}

.progress-ring strong { font-size: 32px; }

.progress-ring span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
}

.progress-ring { --p: v-bind(completion); }

.signal-list { display: grid; gap: 10px; }

.signal-list div {
  padding: 13px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f9fafb;
}

.signal-list b,
.signal-list span { display: block; }

.signal-list span {
  margin-top: 4px;
  color: var(--muted);
  font-size: 13px;
}

.message {
  margin: 0;
  padding: 13px 14px;
  border-radius: 10px;
  font-weight: 800;
}

.error { color: #b91c1c; background: #fff1f2; }
.success { color: #166534; background: #f0fdf4; }

.submit-note {
  height: 52px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: var(--blue);
  font-size: 16px;
  font-weight: 800;
}

@media (max-width: 980px) {
  .studio-hero,
  .studio-layout,
  .form-grid,
  .pdf-import-panel {
    grid-template-columns: 1fr;
  }

  .studio-hero { display: grid; }
  .preview-panel { position: static; }
}
</style>
