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
const views = ref(0);
const likes = ref(0);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

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
    await api.post("/notes", { title: title.value.trim(), description: description.value.trim(), content: content.value.trim(), fileUrl: fileUrl.value.trim(), course: course.value.trim(), category: category.value.trim(), views: Number(views.value) || 0, likes: Number(likes.value) || 0 });
    successMessage.value = "新增成功，即將前往搜尋艙";
    setTimeout(() => router.push("/search"), 900);
  } catch (error) {
    console.error(error);
    errorMessage.value = "新增失敗，請確認資料是否正確";
  } finally { loading.value = false; }
}
</script>

<template>
  <section class="create-studio page-frame">
    <div class="studio-hero">
      <div><p class="page-kicker">Create studio</p><h1>新增筆記</h1><p>這裡不是只新增資料，而是在建立 Search API 可以搜尋、排序、驗證的素材。</p></div>
      <button class="secondary-action" @click="fillExample">填入範例</button>
    </div>

    <div class="studio-layout">
      <form class="studio-form" @submit.prevent="handleSubmit">
        <div class="form-grid">
          <label><span>筆記標題 *</span><input v-model="title" placeholder="例如：微積分期中考重點整理" /></label>
          <label><span>課程名稱 *</span><input v-model="course" placeholder="例如：微積分" /></label>
          <label><span>分類</span><input v-model="category" placeholder="例如：考試整理" /></label>
          <label><span>檔案連結 *</span><input v-model="fileUrl" placeholder="https://example.com/note.pdf" /></label>
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
.create-studio { padding:28px 0 60px; }.studio-hero { display:flex; justify-content:space-between; align-items:end; gap:20px; padding:34px; border-radius:40px; color:white; background:radial-gradient(circle at 80% 12%, rgba(251,146,60,.34), transparent 30%), linear-gradient(135deg,#431407,#9a3412 55%,#111827); box-shadow:var(--shadow-hard); }
h1 { margin:0; font-size:clamp(48px,7vw,86px); line-height:.95; letter-spacing:-.09em; }.studio-hero p:not(.page-kicker) { max-width:680px; color:#ffedd5; line-height:1.8; }
.studio-layout { display:grid; grid-template-columns:1fr 360px; gap:20px; margin-top:22px; align-items:start; }.studio-form,.preview-panel { border:1px solid var(--line); border-radius:34px; background:rgba(255,255,255,.86); box-shadow:var(--shadow-soft); }
.studio-form { padding:24px; display:grid; gap:16px; }.form-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; } label { display:grid; gap:8px; } label span { color:#64748b; font-size:12px; font-weight:1000; letter-spacing:.1em; text-transform:uppercase; }
.preview-panel { position:sticky; top:110px; padding:26px; background:linear-gradient(145deg,#0f172a,#312e81); color:white; }.preview-kicker { color:#fed7aa; font-size:12px; font-weight:1000; letter-spacing:.12em; text-transform:uppercase; } .preview-panel h2 { margin:14px 0 10px; font-size:34px; line-height:1.1; letter-spacing:-.06em; }.preview-panel p { color:#cbd5e1; line-height:1.75; }
.progress-ring { width:150px; height:150px; margin:24px auto; display:grid; place-items:center; align-content:center; border-radius:50%; background:conic-gradient(#fb923c calc(var(--p, 0) * 1%), rgba(255,255,255,.12) 0); position:relative; } .progress-ring::before { content:""; position:absolute; inset:12px; border-radius:50%; background:#111827; } .progress-ring strong,.progress-ring span { position:relative; z-index:1; } .progress-ring strong { font-size:34px; } .progress-ring span { color:#cbd5e1; font-size:12px; font-weight:900; }
.progress-ring { --p: v-bind(completion); }
.signal-list { display:grid; gap:10px; }.signal-list div { padding:13px; border-radius:18px; background:rgba(255,255,255,.08); }.signal-list b,.signal-list span { display:block; }.signal-list span { margin-top:4px; color:#cbd5e1; font-size:13px; }
.message { margin:0; padding:13px 14px; border-radius:16px; font-weight:850; }.error { color:#b91c1c; background:#fff1f2; }.success { color:#166534; background:#f0fdf4; }.submit-note { height:52px; border:0; border-radius:18px; color:white; background:linear-gradient(135deg,#fb923c,#ec4899); font-size:16px; font-weight:1000; }
@media (max-width: 980px) { .studio-hero,.studio-layout,.form-grid { grid-template-columns:1fr; } .studio-hero { display:grid; } .preview-panel { position:static; } }
</style>
