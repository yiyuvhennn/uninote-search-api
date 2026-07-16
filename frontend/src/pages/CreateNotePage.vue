<script setup lang="ts">
import { computed, ref } from "vue";
import api from "../services/api";

type CreateMode = "pdf" | "manual";

const activeMode = ref<CreateMode>("pdf");

const title = ref("");
const description = ref("");
const content = ref("");
const fileUrl = ref("");
const course = ref("");
const category = ref("");
const tags = ref("");
const visibility = ref<"PUBLIC" | "PRIVATE">("PUBLIC");
const views = ref(0);
const likes = ref(0);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const pdfInputRef = ref<HTMLInputElement | null>(null);
const pdfFile = ref<File | null>(null);
const pdfTitle = ref("");
const pdfCourse = ref("");
const pdfCategory = ref("");
const pdfTags = ref("");
const pdfVisibility = ref<"PUBLIC" | "PRIVATE">("PUBLIC");
const pdfLoading = ref(false);
const pdfErrorMessage = ref("");
const pdfSuccessMessage = ref("");

const selectedPdfName = computed(() => pdfFile.value?.name || "");
const selectedPdfSize = computed(() => {
  if (!pdfFile.value) return "";
  return `${(pdfFile.value.size / 1024 / 1024).toFixed(2)} MB`;
});

const manualPreviewTitle = computed(() => title.value.trim() || "尚未輸入標題");
const manualPreviewDescription = computed(() => description.value.trim() || "新增描述後，其他使用者能更快判斷這篇筆記是否適合閱讀。");

function switchMode(mode: CreateMode) {
  activeMode.value = mode;
}

function openPdfPicker() {
  pdfInputRef.value?.click();
}

function fillExample() {
  activeMode.value = "manual";
  title.value = "傅立葉級數考前重點";
  course.value = "工程數學";
  category.value = "考試整理";
  tags.value = "傅立葉,期中考,公式整理";
  fileUrl.value = "https://example.com/fourier-note.pdf";
  description.value = "整理傅立葉級數的基本公式、奇偶函數判斷與常見題型。";
  content.value = "傅立葉級數可將週期函數表示成 sin 與 cos 的組合。考試重點包含 a0、an、bn 計算、半區間展開、奇偶函數判斷與波動方程應用。";
  views.value = 0;
  likes.value = 0;
  visibility.value = "PUBLIC";
}

async function handleSubmit() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!title.value.trim()) return (errorMessage.value = "請輸入筆記標題");
  if (!course.value.trim()) return (errorMessage.value = "請輸入課程名稱");
  if (!content.value.trim()) return (errorMessage.value = "請輸入筆記內容");
  if (description.value.trim() && description.value.trim().length < 5) return (errorMessage.value = "筆記描述至少要 5 個字");

  loading.value = true;

  try {
    await api.post("/notes", {
      title: title.value.trim(),
      description: description.value.trim(),
      content: content.value.trim(),
      fileUrl: fileUrl.value.trim() || null,
      course: course.value.trim(),
      category: category.value.trim(),
      tags: tags.value.trim(),
      visibility: visibility.value,
      views: Number(views.value) || 0,
      likes: Number(likes.value) || 0,
    });

    successMessage.value = "筆記已建立。你可以到筆記庫查看，或直接前往搜尋。";
  } catch (error) {
    console.error(error);
    errorMessage.value = "新增失敗，請確認資料是否正確";
  } finally {
    loading.value = false;
  }
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

    pdfSuccessMessage.value = "PDF 已匯入並建立筆記。你可以到筆記庫查看，或直接前往搜尋。";
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
  <section class="create-page page-frame">
    <header class="create-hero">
      <div>
        <p class="page-kicker">新增內容</p>
        <h1>新增筆記</h1>
        <p>選擇上傳 PDF 或手動建立筆記。公開筆記可被其他登入使用者搜尋與收藏，私人筆記只有你能查看。</p>
      </div>

      <button class="secondary-action" type="button" @click="fillExample">填入手動範例</button>
    </header>

    <div class="mode-tabs" role="tablist" aria-label="新增筆記方式">
      <button
        type="button"
        role="tab"
        :aria-selected="activeMode === 'pdf'"
        :class="{ active: activeMode === 'pdf' }"
        @click="switchMode('pdf')"
      >
        <strong>上傳 PDF</strong>
        <span>從文字型 PDF 建立筆記</span>
      </button>

      <button
        type="button"
        role="tab"
        :aria-selected="activeMode === 'manual'"
        :class="{ active: activeMode === 'manual' }"
        @click="switchMode('manual')"
      >
        <strong>手動新增</strong>
        <span>直接輸入筆記內容</span>
      </button>
    </div>

    <section v-if="activeMode === 'pdf'" class="content-panel">
      <div class="panel-intro">
        <p class="page-kicker">PDF 匯入</p>
        <h2>上傳文字型 PDF</h2>
        <p>適合上傳講義、整理好的課堂筆記或考前重點。系統會擷取 PDF 文字並建立可搜尋筆記。</p>
      </div>

      <form class="create-form" @submit.prevent="handlePdfUpload">
        <input
          ref="pdfInputRef"
          class="visually-hidden"
          type="file"
          accept="application/pdf,.pdf"
          @change="handlePdfFileChange"
        />

        <button type="button" class="upload-dropzone" @click="openPdfPicker">
          <span class="upload-icon">PDF</span>
          <strong>{{ selectedPdfName || "選擇 PDF 檔案" }}</strong>
          <small v-if="selectedPdfName">{{ selectedPdfSize }}</small>
          <small v-else>點擊選擇檔案，僅支援文字型 PDF，最大 10MB。</small>
        </button>

        <div class="notice-list">
          <span>僅支援可選取文字的 PDF</span>
          <span>掃描型 PDF 目前尚未支援</span>
          <span>標籤請用逗號分隔，例如：期中考,傅立葉,PDF</span>
        </div>

        <div class="form-section">
          <div class="section-title">
            <h3>筆記資訊</h3>
            <p>標題可留空，系統會使用 PDF 檔名。</p>
          </div>

          <div class="form-grid">
            <label><span>標題</span><input v-model="pdfTitle" placeholder="不填則使用 PDF 檔名" /></label>
            <label><span>課程</span><input v-model="pdfCourse" placeholder="例如：工程數學" /></label>
            <label><span>分類</span><input v-model="pdfCategory" placeholder="例如：考試整理" /></label>
            <label><span>標籤</span><input v-model="pdfTags" placeholder="例如：期中考,傅立葉,PDF" /></label>
          </div>
        </div>

        <div class="form-section">
          <div class="section-title">
            <h3>可見性</h3>
            <p>決定誰可以搜尋、查看與收藏這篇筆記。</p>
          </div>

          <div class="visibility-options">
            <label :class="{ active: pdfVisibility === 'PUBLIC' }">
              <input v-model="pdfVisibility" type="radio" value="PUBLIC" />
              <span>
                <strong>公開</strong>
                <small>所有登入使用者可搜尋與收藏</small>
              </span>
            </label>

            <label :class="{ active: pdfVisibility === 'PRIVATE' }">
              <input v-model="pdfVisibility" type="radio" value="PRIVATE" />
              <span>
                <strong>私人</strong>
                <small>只有你可以搜尋與查看</small>
              </span>
            </label>
          </div>
        </div>

        <p v-if="pdfErrorMessage" class="message error">{{ pdfErrorMessage }}</p>
        <div v-if="pdfSuccessMessage" class="message success action-message">
          <span>{{ pdfSuccessMessage }}</span>
          <div>
            <router-link to="/notes">查看筆記庫</router-link>
            <router-link to="/search">前往搜尋</router-link>
          </div>
        </div>

        <button class="submit-button" :disabled="pdfLoading || !pdfFile">
          {{ pdfLoading ? "匯入中..." : "匯入 PDF 並建立筆記" }}
        </button>
      </form>
    </section>

    <section v-else class="content-panel">
      <div class="panel-intro">
        <p class="page-kicker">手動新增</p>
        <h2>建立一篇筆記</h2>
        <p>適合輸入課堂重點、公式整理、考前提醒或讀書摘要。</p>
      </div>

      <div class="manual-layout">
        <form class="create-form" @submit.prevent="handleSubmit">
          <div class="form-section">
            <div class="section-title">
              <h3>基本資訊</h3>
              <p>標題與課程是必填，方便之後搜尋與管理。</p>
            </div>

            <div class="form-grid">
              <label><span>筆記標題 *</span><input v-model="title" placeholder="例如：微積分期中考重點整理" /></label>
              <label><span>課程名稱 *</span><input v-model="course" placeholder="例如：微積分" /></label>
              <label><span>分類</span><input v-model="category" placeholder="例如：考試整理" /></label>
              <label><span>標籤</span><input v-model="tags" placeholder="例如：微積分,期中考,傅立葉" /></label>
              <label><span>參考連結</span><input v-model="fileUrl" placeholder="選填，例如：https://example.com/note.pdf" /></label>
            </div>
          </div>

          <div class="form-section">
            <div class="section-title">
              <h3>筆記內容</h3>
              <p>內容是搜尋的重要依據，建議放入重點、公式、摘要或常見題型。</p>
            </div>

            <label><span>簡短描述</span><input v-model="description" placeholder="簡短描述這份筆記" /></label>
            <label><span>內容 *</span><textarea v-model="content" rows="9" placeholder="輸入重點整理、公式、摘要或考前提醒。"></textarea></label>
          </div>

          <div class="form-section">
            <div class="section-title">
              <h3>可見性</h3>
              <p>公開筆記會加入共享筆記庫；私人筆記只有你能搜尋與查看。</p>
            </div>

            <div class="visibility-options">
              <label :class="{ active: visibility === 'PUBLIC' }">
                <input v-model="visibility" type="radio" value="PUBLIC" />
                <span>
                  <strong>公開</strong>
                  <small>所有登入使用者可搜尋與收藏</small>
                </span>
              </label>

              <label :class="{ active: visibility === 'PRIVATE' }">
                <input v-model="visibility" type="radio" value="PRIVATE" />
                <span>
                  <strong>私人</strong>
                  <small>只有你可以搜尋與查看</small>
                </span>
              </label>
            </div>
          </div>

          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
          <div v-if="successMessage" class="message success action-message">
            <span>{{ successMessage }}</span>
            <div>
              <router-link to="/notes">查看筆記庫</router-link>
              <router-link to="/search">前往搜尋</router-link>
            </div>
          </div>

          <button class="submit-button" :disabled="loading">
            {{ loading ? "建立中..." : "建立筆記" }}
          </button>
        </form>

        <aside class="preview-card">
          <span>預覽</span>
          <h3>{{ manualPreviewTitle }}</h3>
          <p>{{ manualPreviewDescription }}</p>
          <dl>
            <div>
              <dt>課程</dt>
              <dd>{{ course || "尚未填寫" }}</dd>
            </div>
            <div>
              <dt>分類</dt>
              <dd>{{ category || "未分類" }}</dd>
            </div>
            <div>
              <dt>可見性</dt>
              <dd>{{ visibility === "PUBLIC" ? "公開" : "私人" }}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  </section>
</template>

<style scoped>
.create-page {
  padding: 22px 0 60px;
}

.create-hero,
.content-panel {
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

.create-hero {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 20px;
  padding: 24px;
  color: var(--ink);
}

h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 54px);
  line-height: 1.08;
  letter-spacing: 0;
}

.create-hero p:not(.page-kicker),
.panel-intro p,
.section-title p,
.preview-card p {
  color: var(--muted);
  line-height: 1.7;
}

.create-hero p:not(.page-kicker) {
  max-width: 760px;
}

.mode-tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
  padding: 8px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
}

.mode-tabs button {
  min-height: 74px;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 14px 16px;
  color: #475467;
  background: transparent;
  text-align: left;
}

.mode-tabs button strong,
.mode-tabs button span {
  display: block;
}

.mode-tabs button strong {
  color: var(--ink);
  font-size: 18px;
  font-weight: 850;
}

.mode-tabs button span {
  margin-top: 5px;
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
}

.mode-tabs button.active {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.mode-tabs button.active strong {
  color: var(--blue);
}

.content-panel {
  padding: 24px;
}

.panel-intro {
  max-width: 760px;
  margin-bottom: 22px;
}

.panel-intro h2,
.section-title h3,
.preview-card h3 {
  margin: 0;
  color: var(--ink);
  letter-spacing: 0;
}

.panel-intro h2 {
  font-size: 32px;
}

.create-form {
  display: grid;
  gap: 18px;
}

.form-section {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f9fafb;
}

.section-title h3 {
  font-size: 20px;
}

.section-title p {
  margin: 6px 0 0;
  font-size: 14px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
}

label span,
.preview-card > span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.upload-dropzone {
  min-height: 190px;
  padding: 24px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  border: 1px dashed #93c5fd;
  border-radius: 14px;
  color: var(--ink);
  background: #eff6ff;
  text-align: center;
}

.upload-dropzone:hover {
  border-color: var(--blue);
  background: #eaf2ff;
}

.upload-icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  border-radius: 14px;
  color: white;
  background: var(--blue);
  font-size: 15px;
  font-weight: 850;
}

.upload-dropzone strong {
  max-width: 100%;
  color: var(--ink);
  font-size: 20px;
  overflow-wrap: anywhere;
}

.upload-dropzone small {
  max-width: 520px;
  color: var(--muted);
  line-height: 1.6;
}

.notice-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.notice-list span {
  padding: 8px 10px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  color: #1d4ed8;
  background: #ffffff;
  font-size: 13px;
  font-weight: 750;
}

.visibility-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.visibility-options label {
  grid-template-columns: auto 1fr;
  align-items: start;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #ffffff;
}

.visibility-options label.active {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.visibility-options input {
  width: auto;
  margin-top: 4px;
  accent-color: var(--blue);
}

.visibility-options strong,
.visibility-options small {
  display: block;
}

.visibility-options strong {
  color: var(--ink);
  font-size: 15px;
}

.visibility-options small {
  margin-top: 4px;
  color: var(--muted);
  line-height: 1.45;
}

.manual-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;
}

.preview-card {
  position: sticky;
  top: 110px;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

.preview-card h3 {
  margin-top: 12px;
  font-size: 24px;
  line-height: 1.2;
}

.preview-card dl {
  display: grid;
  gap: 10px;
  margin: 18px 0 0;
}

.preview-card dl div {
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: #f9fafb;
}

.preview-card dt {
  color: var(--subtle);
  font-size: 11px;
  font-weight: 800;
}

.preview-card dd {
  margin: 5px 0 0;
  color: var(--ink);
  font-weight: 800;
}

.message {
  margin: 0;
  padding: 13px 14px;
  border-radius: 10px;
  font-weight: 800;
}

.error {
  color: #b91c1c;
  background: #fff1f2;
}

.success {
  color: #166534;
  background: #f0fdf4;
}

.action-message {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  flex-wrap: wrap;
}

.action-message div {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-message a {
  color: #166534;
  text-decoration: none;
  font-weight: 850;
}

.submit-button {
  min-height: 52px;
  border: 0;
  border-radius: 8px;
  color: white;
  background: var(--blue);
  font-size: 16px;
  font-weight: 800;
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

@media (max-width: 980px) {
  .create-hero,
  .manual-layout,
  .form-grid,
  .visibility-options {
    grid-template-columns: 1fr;
  }

  .create-hero {
    display: grid;
  }

  .preview-card {
    position: static;
  }
}

@media (max-width: 620px) {
  .create-page {
    padding-top: 14px;
  }

  .create-hero,
  .content-panel {
    padding: 18px;
  }

  .mode-tabs {
    grid-template-columns: 1fr;
  }
}
</style>
