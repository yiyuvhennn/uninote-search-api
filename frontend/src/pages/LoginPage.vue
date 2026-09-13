<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();
const route = useRoute();
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);
const showPassword = ref(false);

const emailError = computed(() => {
  if (!email.value.trim()) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? "" : "Email 格式不正確";
});
const passwordError = computed(() => (!password.value || password.value.length >= 6 ? "" : "密碼至少需要 6 個字元"));
const canSubmit = computed(() => Boolean(email.value.trim() && password.value && !emailError.value && !passwordError.value && !loading.value));
const sessionExpired = computed(() => route.query.reason === "session-expired");

function fillDemoAccount() {
  email.value = "test@uninotes.com";
  password.value = "123456";
  errorMessage.value = "";
}

async function handleLogin() {
  errorMessage.value = "";
  if (!canSubmit.value) {
    errorMessage.value = "請先確認 Email 與密碼格式是否正確";
    return;
  }
  loading.value = true;
  try {
    const res = await api.post("/auth/login", { email: email.value.trim(), password: password.value });
    localStorage.setItem("token", res.data.token);
    router.push((route.query.redirect as string) || "/search");
  } catch (error) {
    console.error(error);
    errorMessage.value = "登入失敗，請檢查帳號或密碼是否正確";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (localStorage.getItem("token")) router.push("/search");
});
</script>

<template>
  <main class="login-stage">
    <section class="visual-panel">
      <router-link to="/" class="auth-brand">uN <span>uniNote</span></router-link>
      <div class="story-copy">
        <p>歡迎回來</p>
        <h1>回到你的<br />學習資料庫。</h1>
      </div>
      <div class="journey-card">
        <div class="step active"><b>01</b><span>搜尋筆記</span></div>
        <div class="step"><b>02</b><span>整理收藏</span></div>
        <div class="step"><b>03</b><span>匯入 PDF</span></div>
      </div>
    </section>

    <section class="form-zone">
      <div class="auth-card">
        <p class="page-kicker">歡迎回來</p>
        <h2>登入 uniNote</h2>
        <p class="subtitle">搜尋共享筆記、管理自己的學習資料，快速找到需要的課堂重點。</p>
        <p v-if="sessionExpired" class="message-error session-message">登入已失效，請重新登入以繼續操作。</p>

        <button type="button" class="demo-ticket" @click="fillDemoAccount">
          <span><b>示範帳號</b><small>test@uninotes.com / 123456</small></span>
          <em>填入</em>
        </button>

        <form @submit.prevent="handleLogin" class="auth-form">
          <label>
            <span>Email</span>
            <input v-model="email" type="email" autocomplete="email" placeholder="輸入 Email" />
            <small v-if="emailError">{{ emailError }}</small>
          </label>

          <label>
            <span>密碼</span>
            <div class="password-box">
              <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="輸入密碼" />
              <button type="button" @click="showPassword = !showPassword">{{ showPassword ? "隱藏" : "顯示" }}</button>
            </div>
            <small v-if="passwordError">{{ passwordError }}</small>
          </label>

          <p v-if="errorMessage" class="message-error">{{ errorMessage }}</p>
          <button class="submit" :disabled="!canSubmit"><span>{{ loading ? "登入中..." : "登入" }}</span></button>
        </form>

        <p class="forgot-link"><router-link to="/forgot-password">忘記密碼？</router-link></p>

        <p class="switch-text">還沒有帳號？<router-link to="/register">建立新帳號</router-link></p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-stage { min-height: 100vh; display: grid; grid-template-columns: .92fr 1.08fr; color: var(--ink); background: var(--bg); overflow: hidden; }
.visual-panel { position: relative; min-height: 100vh; padding: 44px; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; background: linear-gradient(135deg, #171c28, #40202a 58%, #8a5b18); color: white; }
.visual-panel::after { content:""; position:absolute; inset:0; opacity:.15; background-image: linear-gradient(rgba(255,250,240,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,250,240,.12) 1px, transparent 1px); background-size: 42px 42px; }
.auth-brand { position:relative; z-index:1; width:fit-content; padding:11px 13px; border-radius:4px; color:white; background:#172235; text-decoration:none; font-weight:850; } .auth-brand span { margin-left:8px; }
.story-copy { position:relative; z-index:1; } .story-copy p { margin:0 0 12px; color:#f3d37a; font-size:13px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
.story-copy h1 { margin:0; font-size:clamp(42px,5.4vw,66px); line-height:1.02; letter-spacing:0; text-wrap: balance; }
.journey-card { position:relative; z-index:1; display:grid; gap:12px; padding:18px; border:1px solid rgba(255,250,240,.18); border-radius:5px; background:rgba(255,250,240,.07); }
.step { display:flex; align-items:center; gap:14px; padding:15px; border-radius:4px; color:#f4ead5; background:rgba(255,250,240,.06); } .step.active { color:white; background:rgba(199,151,56,.18); border:1px solid rgba(255,224,156,.42); } .step b { display:grid; place-items:center; width:42px; height:42px; border-radius:4px; color:white; background:#8f5d16; }
.form-zone { display:grid; place-items:center; padding:32px; background:var(--bg); }
.auth-card { position:relative; width:min(520px,100%); padding:34px; border:1px solid var(--line-strong); border-radius:5px; color:var(--ink); background:rgba(255,250,240,.92); box-shadow:var(--shadow-hard); }
.auth-card::before { content:""; position:absolute; inset:11px; border:1px solid rgba(183,121,34,.16); pointer-events:none; }
h2 { margin:0; font-size:38px; letter-spacing:0; }
.subtitle { margin:12px 0 0; color:#64748b; line-height:1.7; }
.demo-ticket { width:100%; margin:26px 0; padding:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #d9ad55; border-radius:4px; background:#fff4df; text-align:left; }
.demo-ticket b, .demo-ticket small { display:block; } .demo-ticket small { margin-top:4px; color:#64748b; } .demo-ticket em { padding:8px 11px; border-radius:8px; color:white; background:#111827; font-style:normal; font-weight:800; }
.auth-form { display:grid; gap:16px; } label { display:grid; gap:8px; font-weight:800; color:#334155; } small { color:#dc2626; font-weight:750; }
.password-box { position:relative; } .password-box input { padding-right:76px; } .password-box button { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:0; border-radius:4px; padding:8px 10px; color:var(--blue); background:#edf4ff; font-weight:800; }
.message-error { margin:0; padding:13px 14px; border-radius:10px; color:#b91c1c; background:#fff1f2; font-weight:800; }
.session-message { margin-top:18px; }
.submit { position:relative; height:52px; border:0; border-radius:4px; color:white; background:linear-gradient(180deg,#c99637,#8f5d16); font-size:16px; font-weight:800; overflow:hidden; }
.submit span { position:relative; z-index:1; }
.switch-text { margin:24px 0 0; color:#64748b; text-align:center; } .switch-text a { color:#3867ff; font-weight:800; text-decoration:none; }
.forgot-link { margin:14px 0 0; text-align:right; }.forgot-link a { color:#6f2430; font-weight:800; text-decoration:none; }
@media (max-width: 940px) { .login-stage { grid-template-columns:1fr; } .visual-panel { min-height: 520px; } }
@media (max-width: 560px) { .visual-panel, .form-zone { padding:20px; } .story-copy h1 { font-size:44px; } }
</style>
