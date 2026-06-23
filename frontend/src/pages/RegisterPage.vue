<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const loading = ref(false);
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const agreeToDemo = ref(false);

const nameError = computed(() => {
  if (!name.value.trim()) return "";
  return name.value.trim().length >= 2 ? "" : "名稱至少需要 2 個字";
});

const emailError = computed(() => {
  if (!email.value.trim()) return "";
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.value) ? "" : "Email 格式不正確";
});

const passwordError = computed(() => {
  if (!password.value) return "";
  return password.value.length >= 6 ? "" : "密碼至少需要 6 個字元";
});

const confirmPasswordError = computed(() => {
  if (!confirmPassword.value) return "";
  return password.value === confirmPassword.value ? "" : "兩次輸入的密碼不一致";
});

const passwordStrength = computed(() => {
  if (!password.value) return 0;

  let score = 0;

  if (password.value.length >= 6) score += 1;
  if (password.value.length >= 10) score += 1;
  if (/[A-Z]/.test(password.value)) score += 1;
  if (/[0-9]/.test(password.value)) score += 1;
  if (/[^A-Za-z0-9]/.test(password.value)) score += 1;

  return score;
});

const passwordStrengthText = computed(() => {
  if (!password.value) return "尚未輸入";
  if (passwordStrength.value <= 1) return "偏弱";
  if (passwordStrength.value <= 3) return "普通";
  return "良好";
});

const canSubmit = computed(() => {
  return (
    name.value.trim() &&
    email.value.trim() &&
    password.value &&
    confirmPassword.value &&
    agreeToDemo.value &&
    !nameError.value &&
    !emailError.value &&
    !passwordError.value &&
    !confirmPasswordError.value &&
    !loading.value
  );
});

async function handleRegister() {
  errorMessage.value = "";
  successMessage.value = "";

  if (!canSubmit.value) {
    errorMessage.value = "請先確認註冊資料是否完整";
    return;
  }

  loading.value = true;

  try {
    await api.post("/auth/register", {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });

    successMessage.value = "註冊成功，正在前往登入頁";

    setTimeout(() => {
      router.push("/login");
    }, 900);
  } catch (error: any) {
    console.error(error);
    errorMessage.value =
      error?.response?.data?.message || "註冊失敗，請檢查資料是否正確";
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
  <main class="register-page">
    <div class="bg-orb orb-one"></div>
    <div class="bg-orb orb-two"></div>
    <div class="bg-grid"></div>

    <section class="register-shell">
      <div class="brand-panel">
        <nav class="brand-nav">
          <router-link class="brand-logo" to="/">
            <span>uN</span>
            uniNote
          </router-link>
          <router-link class="brand-link" to="/login">返回登入</router-link>
        </nav>

        <div class="hero-copy">
          <p class="eyebrow">Create your search workspace</p>
          <h1>
            建立帳號，<br />
            開始整理你的學習資料。
          </h1>
          <p class="hero-desc">
            註冊後可以進入筆記系統，測試建立筆記、搜尋資料、
            Ranking Score、篩選條件與快取狀態。
          </p>
        </div>

        <div class="process-card">
          <div class="process-step active">
            <span>01</span>
            <div>
              <strong>建立帳號</strong>
              <p>輸入名稱、Email 與密碼</p>
            </div>
          </div>

          <div class="process-step">
            <span>02</span>
            <div>
              <strong>進入筆記系統</strong>
              <p>瀏覽與建立學習筆記</p>
            </div>
          </div>

          <div class="process-step">
            <span>03</span>
            <div>
              <strong>測試搜尋排序</strong>
              <p>觀察 Search API 與 Ranking Score</p>
            </div>
          </div>
        </div>
      </div>

      <div class="form-panel">
        <div class="auth-card">
          <div class="auth-title">
            <p>GET STARTED</p>
            <h2>註冊 uniNote</h2>
            <span>建立測試帳號後，即可進入 Search API MVP 展示環境。</span>
          </div>

          <form class="auth-form" @submit.prevent="handleRegister">
            <label>
              <span>名稱</span>
              <input
                v-model="name"
                type="text"
                autocomplete="name"
                placeholder="例如：陳翊猷"
              />
              <small v-if="nameError">{{ nameError }}</small>
            </label>

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
                  autocomplete="new-password"
                  placeholder="至少 6 個字元"
                />
                <button type="button" @click="showPassword = !showPassword">
                  {{ showPassword ? "隱藏" : "顯示" }}
                </button>
              </div>

              <div class="strength-row">
                <div class="strength-bar">
                  <i
                    v-for="item in 5"
                    :key="item"
                    :class="{ active: item <= passwordStrength }"
                  ></i>
                </div>
                <b>{{ passwordStrengthText }}</b>
              </div>

              <small v-if="passwordError">{{ passwordError }}</small>
            </label>

            <label>
              <span>確認密碼</span>
              <div class="password-input">
                <input
                  v-model="confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  autocomplete="new-password"
                  placeholder="再次輸入密碼"
                />
                <button
                  type="button"
                  @click="showConfirmPassword = !showConfirmPassword"
                >
                  {{ showConfirmPassword ? "隱藏" : "顯示" }}
                </button>
              </div>
              <small v-if="confirmPasswordError">
                {{ confirmPasswordError }}
              </small>
            </label>

            <label class="check-row">
              <input v-model="agreeToDemo" type="checkbox" />
              <span>
                我了解這是 Search API MVP 測試帳號，註冊後會進入專案展示流程。
              </span>
            </label>

            <p v-if="errorMessage" class="message error-message">
              {{ errorMessage }}
            </p>

            <p v-if="successMessage" class="message success-message">
              {{ successMessage }}
            </p>

            <button class="submit-btn" type="submit" :disabled="!canSubmit">
              <span>{{ loading ? "註冊中..." : "建立帳號" }}</span>
            </button>
          </form>

          <p class="auth-footer">
            已經有帳號？
            <router-link to="/login">前往登入</router-link>
          </p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.register-page {
  position: relative;
  min-height: 100vh;
  padding: 32px;
  display: grid;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 12%, rgba(34, 211, 238, 0.24), transparent 30%),
    radial-gradient(circle at 82% 18%, rgba(168, 85, 247, 0.3), transparent 28%),
    linear-gradient(135deg, #06111f 0%, #111827 46%, #312e81 100%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  opacity: 0.17;
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
  width: 380px;
  height: 380px;
  top: -130px;
  right: 10%;
  background: rgba(34, 211, 238, 0.22);
}

.orb-two {
  width: 460px;
  height: 460px;
  bottom: -190px;
  left: 6%;
  background: rgba(168, 85, 247, 0.22);
}

.register-shell {
  position: relative;
  z-index: 1;
  width: min(1180px, 100%);
  min-height: 740px;
  display: grid;
  grid-template-columns: 1.02fr 0.98fr;
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
    linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.72)),
    radial-gradient(circle at 75% 70%, rgba(34, 211, 238, 0.24), transparent 35%);
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

.brand-link {
  padding: 9px 13px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: #dbeafe;
  background: rgba(255, 255, 255, 0.08);
  text-decoration: none;
  font-size: 13px;
  font-weight: 900;
}

.hero-copy {
  position: relative;
  z-index: 1;
  margin-top: 64px;
}

.eyebrow {
  margin: 0 0 12px;
  color: #67e8f9;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.hero-copy h1 {
  margin: 0;
  max-width: 560px;
  font-size: clamp(42px, 5vw, 66px);
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

.process-card {
  position: relative;
  z-index: 1;
  display: grid;
  gap: 12px;
  margin-top: 38px;
  padding: 18px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 26px;
  background: rgba(15, 23, 42, 0.58);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
}

.process-step {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.07);
}

.process-step.active {
  border: 1px solid rgba(103, 232, 249, 0.45);
  background: rgba(8, 145, 178, 0.2);
}

.process-step span {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 15px;
  color: #082f49;
  background: #a5f3fc;
  font-size: 13px;
  font-weight: 950;
}

.process-step strong {
  display: block;
  margin-bottom: 4px;
  color: white;
  font-size: 15px;
}

.process-step p {
  margin: 0;
  color: #cbd5e1;
  font-size: 13px;
}

.form-panel {
  display: grid;
  place-items: center;
  padding: 42px;
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(240, 249, 255, 0.98));
}

.auth-card {
  width: min(455px, 100%);
  padding: 34px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.16);
}

.auth-title p {
  margin: 0 0 10px;
  color: #0891b2;
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

.auth-form {
  display: grid;
  gap: 15px;
  margin-top: 26px;
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
  color: #0891b2;
  background: #ecfeff;
  font-weight: 900;
  cursor: pointer;
}

.auth-form small {
  color: #dc2626;
  font-size: 12px;
  font-weight: 800;
}

.strength-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.strength-bar {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 5px;
}

.strength-bar i {
  height: 6px;
  border-radius: 999px;
  background: #e2e8f0;
}

.strength-bar i.active {
  background: linear-gradient(135deg, #0891b2, #7c3aed);
}

.strength-row b {
  color: #64748b;
  font-size: 12px;
}

.check-row {
  display: grid !important;
  grid-template-columns: 18px 1fr;
  gap: 10px;
  align-items: flex-start;
  padding: 13px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #f8fafc;
}

.check-row input {
  width: 16px;
  height: 16px;
  min-height: auto;
  margin-top: 2px;
  accent-color: #0891b2;
}

.check-row span {
  color: #64748b !important;
  font-size: 13px !important;
  font-weight: 700 !important;
  line-height: 1.6;
}

.message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 800;
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

.submit-btn {
  position: relative;
  width: 100%;
  height: 50px;
  border: 0;
  border-radius: 17px;
  color: white;
  background: linear-gradient(135deg, #0891b2, #7c3aed);
  font-size: 16px;
  font-weight: 950;
  cursor: pointer;
  box-shadow: 0 18px 34px rgba(8, 145, 178, 0.24);
}

.submit-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.auth-footer {
  margin: 24px 0 0;
  color: #64748b;
  text-align: center;
}

.auth-footer a {
  color: #0891b2;
  font-weight: 950;
  text-decoration: none;
}

@media (max-width: 980px) {
  .register-page {
    padding: 18px;
  }

  .register-shell {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 560px;
  }
}

@media (max-width: 560px) {
  .register-page {
    padding: 0;
  }

  .register-shell {
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

  .process-card {
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
