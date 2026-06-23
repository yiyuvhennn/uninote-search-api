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
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.value) ? "" : "Email 格式不正確";
});

const passwordError = computed(() => {
  if (!password.value) return "";
  return password.value.length >= 6 ? "" : "密碼至少需要 6 個字元";
});

const canSubmit = computed(() => {
  return (
    email.value.trim() &&
    password.value &&
    !emailError.value &&
    !passwordError.value &&
    !loading.value
  );
});

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
    const res = await api.post("/auth/login", {
      email: email.value.trim(),
      password: password.value,
    });

    localStorage.setItem("token", res.data.token);

    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/notes";
    router.push(redirect);
  } catch (error) {
    console.error(error);
    errorMessage.value = "登入失敗，請檢查帳號或密碼是否正確";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const token = localStorage.getItem("token");

  if (token) {
    router.push("/notes");
  }
});
</script>

<template>
  <main class="login-page">
    <div class="bg-orb orb-one"></div>
    <div class="bg-orb orb-two"></div>
    <div class="bg-grid"></div>

    <section class="login-shell">
      <div class="brand-panel">
        <nav class="brand-nav">
          <router-link class="brand-logo" to="/">
            <span>uN</span>
            uniNote
          </router-link>
          <span class="brand-pill">Search API MVP</span>
        </nav>

        <div class="hero-copy">
          <p class="eyebrow">AI-ready notes search system</p>
          <h1>
            找到筆記，<br />
            也看懂排序邏輯。
          </h1>
          <p class="hero-desc">
            這不是單純的筆記列表，而是一個可以展示搜尋、篩選、
            Ranking Score 與 Cache 狀態的學習筆記搜尋原型。
          </p>
        </div>

        <div class="preview-card">
          <div class="preview-header">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div class="search-preview">
            <div class="search-line">
              <span class="search-icon">⌘</span>
              <span>搜尋：工程數學 傅立葉</span>
              <strong>Score</strong>
            </div>

            <div class="result-row active">
              <div>
                <strong>傅立葉級數重點整理</strong>
                <p>titleMatch + contentMatch + recency</p>
              </div>
              <b>9.4</b>
            </div>

            <div class="result-row">
              <div>
                <strong>偏微分方程考前筆記</strong>
                <p>contentMatch + popularity</p>
              </div>
              <b>7.8</b>
            </div>

            <div class="result-row">
              <div>
                <strong>工程數學期中考範圍</strong>
                <p>course filter + latest sort</p>
              </div>
              <b>6.9</b>
            </div>
          </div>
        </div>
      </div>

      <div class="form-panel">
        <div class="auth-card">
          <div class="auth-title">
            <p>WELCOME BACK</p>
            <h2>登入 uniNote</h2>
            <span>進入筆記搜尋系統，測試 Search API 與 Ranking 結果。</span>
          </div>

          <button type="button" class="demo-account" @click="fillDemoAccount">
            <div>
              <strong>測試帳號</strong>
              <span>test@uninotes.com / 123456</span>
            </div>
            <em>自動填入</em>
          </button>

          <form class="auth-form" @submit.prevent="handleLogin">
            <label>
              <span>Email</span>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="請輸入 Email"
              />
              <small v-if="emailError">{{ emailError }}</small>
            </label>

            <label>
              <span>密碼</span>
              <div class="password-input">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="請輸入密碼"
                />
                <button type="button" @click="showPassword = !showPassword">
                  {{ showPassword ? "隱藏" : "顯示" }}
                </button>
              </div>
              <small v-if="passwordError">{{ passwordError }}</small>
            </label>

            <p v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </p>

            <button class="submit-btn" type="submit" :disabled="!canSubmit">
              <span>{{ loading ? "登入中..." : "登入" }}</span>
            </button>
          </form>

          <p class="auth-footer">
            還沒有帳號？
            <router-link to="/register">建立新帳號</router-link>
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  padding: 32px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 15% 10%, rgba(88, 166, 255, 0.28), transparent 30%),
    radial-gradient(circle at 85% 20%, rgba(129, 140, 248, 0.35), transparent 28%),
    linear-gradient(135deg, #07111f 0%, #111827 48%, #172554 100%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  opacity: 0.18;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.12) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.12) 1px, transparent 1px);
  background-size: 48px 48px;
}

.bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(12px);
}

.orb-one {
  width: 360px;
  height: 360px;
  top: -120px;
  right: 12%;
  background: rgba(96, 165, 250, 0.28);
}

.orb-two {
  width: 440px;
  height: 440px;
  bottom: -180px;
  left: 8%;
  background: rgba(99, 102, 241, 0.24);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  min-height: 720px;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 36px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(22px);
}

.brand-panel {
  position: relative;
  padding: 42px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  color: white;
  background:
    linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.72)),
    radial-gradient(circle at 70% 70%, rgba(129, 140, 248, 0.35), transparent 34%);
}

.brand-nav {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: white;
  text-decoration: none;
  font-size: 24px;
  font-weight: 950;
  letter-spacing: -0.06em;
}

.brand-logo span {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 14px;
  color: #172554;
  background: white;
  font-size: 15px;
}

.brand-pill {
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: #dbeafe;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
  font-weight: 800;
}

.hero-copy {
  position: relative;
  z-index: 1;
  margin-top: 70px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #93c5fd;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  max-width: 560px;
  font-size: clamp(44px, 5vw, 68px);
  line-height: 1.04;
  letter-spacing: -0.08em;
}

.hero-desc {
  max-width: 560px;
  margin: 22px 0 0;
  color: #cbd5e1;
  font-size: 16px;
  line-height: 1.9;
}

.preview-card {
  position: relative;
  z-index: 1;
  margin-top: 38px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 26px;
  background: rgba(15, 23, 42, 0.56);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
}

.preview-header {
  display: flex;
  gap: 7px;
  margin-bottom: 14px;
}

.preview-header span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.36);
}

.search-preview {
  display: grid;
  gap: 10px;
}

.search-line,
.result-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.search-line {
  padding: 13px 14px;
  border-radius: 18px;
  color: #dbeafe;
  background: rgba(255, 255, 255, 0.08);
  font-size: 14px;
}

.search-icon {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-right: 8px;
  border-radius: 10px;
  color: #172554;
  background: #bfdbfe;
  font-weight: 900;
}

.search-line strong {
  margin-left: auto;
  color: #93c5fd;
}

.result-row {
  padding: 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.07);
}

.result-row.active {
  border: 1px solid rgba(147, 197, 253, 0.5);
  background: rgba(59, 130, 246, 0.18);
}

.result-row strong {
  display: block;
  margin-bottom: 4px;
  color: white;
  font-size: 14px;
}

.result-row p {
  margin: 0;
  color: #cbd5e1;
  font-size: 12px;
}

.result-row b {
  color: #bfdbfe;
  font-size: 20px;
}

.form-panel {
  display: grid;
  place-items: center;
  padding: 42px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(238, 242, 255, 0.98));
}

.auth-card {
  width: min(440px, 100%);
  padding: 34px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.16);
}

.auth-title p {
  margin: 0 0 10px;
  color: #4263eb;
  font-size: 12px;
  font-weight: 950;
  letter-spacing: 0.16em;
}

.auth-title h2 {
  margin: 0;
  color: #111827;
  font-size: 38px;
  line-height: 1.1;
  letter-spacing: -0.07em;
}

.auth-title span {
  display: block;
  margin-top: 12px;
  color: #64748b;
  line-height: 1.7;
}

.demo-account {
  width: 100%;
  margin: 26px 0;
  padding: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid #c7d2fe;
  border-radius: 20px;
  text-align: left;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  cursor: pointer;
}

.demo-account strong,
.demo-account span {
  display: block;
}

.demo-account strong {
  color: #1f2937;
  font-size: 14px;
}

.demo-account span {
  margin-top: 4px;
  color: #64748b;
  font-size: 13px;
}

.demo-account em {
  flex: 0 0 auto;
  padding: 9px 12px;
  border-radius: 999px;
  color: white;
  background: #4263eb;
  font-style: normal;
  font-size: 13px;
  font-weight: 900;
}

.auth-form {
  display: grid;
  gap: 17px;
}

.auth-form label {
  display: grid;
  gap: 8px;
}

.auth-form label > span {
  color: #334155;
  font-size: 14px;
  font-weight: 900;
}

.password-input {
  position: relative;
}

.password-input input {
  padding-right: 72px;
}

.password-input button {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  border: 0;
  border-radius: 12px;
  padding: 7px 9px;
  color: #4263eb;
  background: #eef2ff;
  font-weight: 900;
}

.auth-form small {
  color: #dc2626;
  font-size: 12px;
  font-weight: 800;
}

.error-message {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #fecaca;
  border-radius: 16px;
  color: #b91c1c;
  background: #fef2f2;
  font-size: 14px;
  font-weight: 800;
}

.submit-btn {
  position: relative;
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: 17px;
  color: white;
  background: linear-gradient(135deg, #4263eb, #7c3aed);
  font-size: 16px;
  font-weight: 950;
  cursor: pointer;
  box-shadow: 0 18px 34px rgba(66, 99, 235, 0.28);
  overflow: hidden;
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.submit-btn span {
  position: relative;
  z-index: 1;
}

.auth-footer {
  margin: 24px 0 0;
  color: #64748b;
  text-align: center;
}

.auth-footer a {
  color: #4263eb;
  font-weight: 950;
  text-decoration: none;
}

.auth-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 980px) {
  .login-page {
    padding: 18px;
  }

  .login-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 560px;
  }
}

@media (max-width: 560px) {
  .login-page {
    padding: 0;
  }

  .login-shell {
    min-height: 100vh;
    border-radius: 0;
  }

  .brand-panel,
  .form-panel {
    padding: 26px;
  }

  .brand-nav {
    align-items: flex-start;
    gap: 14px;
    flex-direction: column;
  }

  .hero-copy {
    margin-top: 42px;
  }

  .preview-card {
    display: none;
  }

  .auth-card {
    padding: 26px;
    border-radius: 26px;
  }

  .auth-title h2 {
    font-size: 32px;
  }
}
</style>
