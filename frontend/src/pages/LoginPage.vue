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
.login-stage { min-height: 100vh; display: grid; grid-template-columns: 1.06fr 0.94fr; color: white; background: radial-gradient(circle at 20% 10%, rgba(34,211,238,.3), transparent 26%), radial-gradient(circle at 82% 18%, rgba(236,72,153,.28), transparent 28%), linear-gradient(135deg, #050816, #0f172a 54%, #2e1065); overflow: hidden; }
.visual-panel { position: relative; min-height: 100vh; padding: 40px; display: grid; align-content: center; }
.visual-panel::after { content:""; position:absolute; inset:0; opacity:.14; background-image: linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px); background-size: 42px 42px; }
.floating-logo { position: absolute; z-index: 2; top: 36px; left: 40px; display: inline-flex; align-items: center; gap: 10px; color: white; text-decoration: none; font-weight: 1000; }
.floating-logo b { display:grid; place-items:center; width:42px; height:42px; border-radius:15px; color:#07111f; background: linear-gradient(135deg, #a3e635, #22d3ee); }
.scan-card { position: relative; z-index: 1; width: min(620px, 100%); padding: 34px; border: 1px solid rgba(255,255,255,.16); border-radius: 42px; background: rgba(255,255,255,.1); box-shadow: 0 40px 120px rgba(0,0,0,.38); backdrop-filter: blur(20px); }
.scan-top { display:flex; gap:8px; margin-bottom:24px; }
.scan-top span { width:12px; height:12px; border-radius:50%; background: rgba(255,255,255,.38); }
.scan-label { margin:0 0 12px; color:#a3e635; font-size:12px; font-weight:1000; letter-spacing:.16em; text-transform:uppercase; }
h1 { margin:0; font-size: clamp(52px, 7vw, 88px); line-height:.92; letter-spacing:-.09em; }
.ranking-stack { display:grid; gap:12px; margin-top:34px; }
.rank-item { display:grid; grid-template-columns: 76px 1fr auto; align-items:center; gap:14px; padding:16px; border:1px solid rgba(255,255,255,.14); border-radius:24px; background:rgba(255,255,255,.09); }
.rank-item.first { background: rgba(163,230,53,.16); border-color: rgba(163,230,53,.38); }
.rank-item strong { color:#a3e635; font-size:28px; }
.rank-item span { font-weight:1000; }
.rank-item em { color:#cbd5e1; font-size:12px; font-style:normal; }
.floating-note { position:absolute; z-index:2; padding:13px 16px; border-radius:999px; color:#07111f; background:#a3e635; font-weight:1000; box-shadow:0 20px 46px rgba(163,230,53,.24); }
.note-a { right:12%; top:22%; transform: rotate(8deg); }
.note-b { left:12%; bottom:18%; background:#22d3ee; transform: rotate(-7deg); }
.form-zone { display:grid; place-items:center; padding:32px; background:rgba(255,255,255,.06); }
.auth-card { width:min(470px,100%); padding:36px; border-radius:38px; color:#111827; background:rgba(255,255,255,.92); box-shadow:0 34px 100px rgba(0,0,0,.24); }
h2 { margin:0; font-size:42px; letter-spacing:-.075em; }
.subtitle { margin:12px 0 0; color:#64748b; line-height:1.7; }
.demo-ticket { width:100%; margin:26px 0; padding:16px; display:flex; justify-content:space-between; align-items:center; border:1px solid rgba(56,103,255,.2); border-radius:22px; background:linear-gradient(135deg,#eff6ff,#fdf2f8); text-align:left; }
.demo-ticket b, .demo-ticket small { display:block; } .demo-ticket small { margin-top:4px; color:#64748b; } .demo-ticket em { padding:9px 12px; border-radius:999px; color:white; background:#111827; font-style:normal; font-weight:1000; }
.auth-form { display:grid; gap:16px; } label { display:grid; gap:8px; font-weight:950; color:#334155; } small { color:#dc2626; font-weight:850; }
.password-box { position:relative; } .password-box input { padding-right:76px; } .password-box button { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:0; border-radius:12px; padding:8px 10px; color:#3867ff; background:#eff6ff; font-weight:950; }
.message-error { margin:0; padding:13px 14px; border-radius:16px; color:#b91c1c; background:#fff1f2; font-weight:850; }
.submit { position:relative; height:52px; border:0; border-radius:18px; color:white; background:linear-gradient(135deg,#3867ff,#ec4899); font-size:16px; font-weight:1000; overflow:hidden; }
.submit::before { content:""; position:absolute; inset:0; transform:translateX(-100%); background:linear-gradient(90deg,transparent,rgba(255,255,255,.36),transparent); transition:.55s; } .submit:hover:not(:disabled)::before { transform:translateX(100%); } .submit span { position:relative; z-index:1; }
.switch-text { margin:24px 0 0; color:#64748b; text-align:center; } .switch-text a { color:#3867ff; font-weight:1000; text-decoration:none; }
@media (max-width: 940px) { .login-stage { grid-template-columns:1fr; } .visual-panel { min-height: 620px; } }
@media (max-width: 560px) { .visual-panel, .form-zone { padding:20px; } .rank-item { grid-template-columns:1fr; } h1 { font-size:54px; } }
</style>
