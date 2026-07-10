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
      <router-link to="/" class="floating-logo"><b>uN</b><span>uniNote</span></router-link>
      <div class="scan-card">
        <div class="scan-top"><span></span><span></span><span></span></div>
        <p class="scan-label">live ranking preview</p>
        <h1>登入你的<br />知識雷達。</h1>
        <div class="ranking-stack">
          <div class="rank-item first"><strong>9.8</strong><span>傅立葉級數整理</span><em>title + content</em></div>
          <div class="rank-item"><strong>8.1</strong><span>偏微分方程筆記</span><em>recency boost</em></div>
          <div class="rank-item"><strong>6.7</strong><span>工程數學考前題</span><em>popular sort</em></div>
        </div>
      </div>
      <div class="floating-note note-a">Cache hit</div>
      <div class="floating-note note-b">Score detail</div>
    </section>

    <section class="form-zone">
      <div class="auth-card">
        <p class="page-kicker">Welcome back</p>
        <h2>登入 uniNote</h2>
        <p class="subtitle">進入 Search API MVP，測試搜尋、Ranking、Filter 與 Cache。</p>

        <button type="button" class="demo-ticket" @click="fillDemoAccount">
          <span><b>Demo account</b><small>test@uninotes.com / 123456</small></span>
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
          <button class="submit" :disabled="!canSubmit"><span>{{ loading ? "登入中..." : "登入系統" }}</span></button>
        </form>

        <p class="switch-text">還沒有帳號？<router-link to="/register">建立新帳號</router-link></p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-stage { min-height: 100vh; display: grid; grid-template-columns: 1.02fr 0.98fr; color: var(--ink); background: var(--bg); overflow: hidden; }
.visual-panel { position: relative; min-height: 100vh; padding: 40px; display: grid; align-content: center; background: #18212f; color: white; }
.visual-panel::after { content:""; position:absolute; inset:0; opacity:.12; background-image: linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px); background-size: 42px 42px; }
.floating-logo { position: absolute; z-index: 2; top: 36px; left: 40px; display: inline-flex; align-items: center; gap: 10px; color: white; text-decoration: none; font-weight: 850; }
.floating-logo b { display:grid; place-items:center; width:42px; height:42px; border-radius:8px; color:#ffffff; background:#2f6fed; }
.scan-card { position: relative; z-index: 1; width: min(620px, 100%); padding: 32px; border: 1px solid rgba(255,255,255,.16); border-radius: 14px; background: rgba(255,255,255,.08); box-shadow: 0 30px 80px rgba(0,0,0,.28); }
.scan-top { display:flex; gap:8px; margin-bottom:24px; }
.scan-top span { width:12px; height:12px; border-radius:50%; background: rgba(255,255,255,.38); }
.scan-label { margin:0 0 12px; color:#93c5fd; font-size:12px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
h1 { margin:0; font-size: clamp(44px, 6vw, 76px); line-height:1.04; letter-spacing:0; }
.ranking-stack { display:grid; gap:12px; margin-top:34px; }
.rank-item { display:grid; grid-template-columns: 76px 1fr auto; align-items:center; gap:14px; padding:15px; border:1px solid rgba(255,255,255,.14); border-radius:10px; background:rgba(255,255,255,.08); }
.rank-item.first { background: rgba(47,111,237,.22); border-color: rgba(147,197,253,.5); }
.rank-item strong { color:#93c5fd; font-size:28px; }
.rank-item span { font-weight:850; }
.rank-item em { color:#cbd5e1; font-size:12px; font-style:normal; }
.floating-note { position:absolute; z-index:2; padding:12px 14px; border-radius:8px; color:#1d4ed8; background:#dbeafe; font-weight:800; box-shadow:0 18px 40px rgba(15,23,42,.18); }
.note-a { right:12%; top:22%; }
.note-b { left:12%; bottom:18%; background:#ecfdf3; color:#047857; }
.form-zone { display:grid; place-items:center; padding:32px; background:var(--bg); }
.auth-card { width:min(470px,100%); padding:34px; border:1px solid var(--line); border-radius:14px; color:#111827; background:#ffffff; box-shadow:var(--shadow-hard); }
h2 { margin:0; font-size:40px; letter-spacing:0; }
.subtitle { margin:12px 0 0; color:#64748b; line-height:1.7; }
.demo-ticket { width:100%; margin:26px 0; padding:15px; display:flex; justify-content:space-between; align-items:center; border:1px solid #bfdbfe; border-radius:10px; background:#eff6ff; text-align:left; }
.demo-ticket b, .demo-ticket small { display:block; } .demo-ticket small { margin-top:4px; color:#64748b; } .demo-ticket em { padding:8px 11px; border-radius:8px; color:white; background:#111827; font-style:normal; font-weight:800; }
.auth-form { display:grid; gap:16px; } label { display:grid; gap:8px; font-weight:800; color:#334155; } small { color:#dc2626; font-weight:750; }
.password-box { position:relative; } .password-box input { padding-right:76px; } .password-box button { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:0; border-radius:8px; padding:8px 10px; color:#3867ff; background:#eff6ff; font-weight:800; }
.message-error { margin:0; padding:13px 14px; border-radius:10px; color:#b91c1c; background:#fff1f2; font-weight:800; }
.submit { position:relative; height:52px; border:0; border-radius:8px; color:white; background:var(--blue); font-size:16px; font-weight:800; overflow:hidden; }
.submit span { position:relative; z-index:1; }
.switch-text { margin:24px 0 0; color:#64748b; text-align:center; } .switch-text a { color:#3867ff; font-weight:800; text-decoration:none; }
@media (max-width: 940px) { .login-stage { grid-template-columns:1fr; } .visual-panel { min-height: 620px; } }
@media (max-width: 560px) { .visual-panel, .form-zone { padding:20px; } .rank-item { grid-template-columns:1fr; } h1 { font-size:54px; } }
</style>
