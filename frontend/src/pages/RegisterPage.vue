<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const agree = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);

const nameError = computed(() => (!name.value.trim() || name.value.trim().length >= 2 ? "" : "名稱至少需要 2 個字"));
const emailError = computed(() => (!email.value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value) ? "" : "Email 格式不正確"));
const passwordError = computed(() => (!password.value || password.value.length >= 6 ? "" : "密碼至少需要 6 個字元"));
const confirmPasswordError = computed(() => (!confirmPassword.value || confirmPassword.value === password.value ? "" : "兩次輸入的密碼不一致"));
const strength = computed(() => {
  if (!password.value) return 0;
  let score = 0;
  if (password.value.length >= 6) score++;
  if (password.value.length >= 10) score++;
  if (/[A-Z]/.test(password.value)) score++;
  if (/[0-9]/.test(password.value)) score++;
  if (/[^A-Za-z0-9]/.test(password.value)) score++;
  return score;
});
const canSubmit = computed(() => Boolean(name.value.trim() && email.value.trim() && password.value && confirmPassword.value && agree.value && !nameError.value && !emailError.value && !passwordError.value && !confirmPasswordError.value && !loading.value));

async function handleRegister() {
  errorMessage.value = "";
  successMessage.value = "";
  if (!canSubmit.value) {
    errorMessage.value = "請先確認註冊資料是否完整";
    return;
  }
  loading.value = true;
  try {
    await api.post("/auth/register", { name: name.value.trim(), email: email.value.trim(), password: password.value });
    successMessage.value = "註冊成功，正在前往登入頁";
    setTimeout(() => router.push("/login"), 900);
  } catch (error: any) {
    console.error(error);
    errorMessage.value = error?.response?.data?.message || "註冊失敗，請檢查資料是否正確";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (localStorage.getItem("token")) router.push("/search");
});
</script>

<template>
  <main class="register-stage">
    <section class="story-panel">
      <router-link to="/" class="brand">uN <span>uniNote</span></router-link>
      <div class="story-copy">
        <p>create workspace</p>
        <h1>先建立帳號，<br />再建立你的筆記宇宙。</h1>
      </div>
      <div class="journey-card">
        <div class="step active"><b>01</b><span>建立帳號</span></div>
        <div class="step"><b>02</b><span>新增筆記</span></div>
        <div class="step"><b>03</b><span>測試 Ranking</span></div>
      </div>
    </section>

    <section class="register-form-zone">
      <div class="register-card">
        <p class="page-kicker">Get started</p>
        <h2>註冊 uniNote</h2>
        <p class="subtitle">用一組測試帳號進入 Search API MVP，完整體驗搜尋、篩選與排序流程。</p>

        <form class="register-form" @submit.prevent="handleRegister">
          <label><span>名稱</span><input v-model="name" type="text" placeholder="例如：陳翊猷" /><small v-if="nameError">{{ nameError }}</small></label>
          <label><span>Email</span><input v-model="email" type="email" placeholder="請輸入 Email" /><small v-if="emailError">{{ emailError }}</small></label>

          <label>
            <span>密碼</span>
            <div class="password-box"><input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="至少 6 個字元" /><button type="button" @click="showPassword = !showPassword">{{ showPassword ? '隱藏' : '顯示' }}</button></div>
            <div class="strength"><i v-for="item in 5" :key="item" :class="{ active: item <= strength }"></i></div>
            <small v-if="passwordError">{{ passwordError }}</small>
          </label>

          <label>
            <span>確認密碼</span>
            <div class="password-box"><input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="再次輸入密碼" /><button type="button" @click="showConfirmPassword = !showConfirmPassword">{{ showConfirmPassword ? '隱藏' : '顯示' }}</button></div>
            <small v-if="confirmPasswordError">{{ confirmPasswordError }}</small>
          </label>

          <label class="check"><input v-model="agree" type="checkbox" /><span>我了解這是 Search API MVP 測試環境，註冊後會進入展示流程。</span></label>
          <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
          <p v-if="successMessage" class="message success">{{ successMessage }}</p>
          <button class="submit" :disabled="!canSubmit">{{ loading ? "註冊中..." : "建立帳號" }}</button>
        </form>
        <p class="switch">已經有帳號？<router-link to="/login">前往登入</router-link></p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.register-stage { min-height:100vh; display:grid; grid-template-columns:.92fr 1.08fr; background:radial-gradient(circle at 15% 12%, rgba(163,230,53,.28), transparent 28%), radial-gradient(circle at 86% 20%, rgba(34,211,238,.24), transparent 28%), linear-gradient(135deg,#08111f,#0f172a 52%,#134e4a); color:white; }
.story-panel { position:relative; padding:44px; display:flex; flex-direction:column; justify-content:space-between; overflow:hidden; }
.story-panel::after { content:""; position:absolute; width:420px; height:420px; right:-180px; bottom:-150px; border-radius:50%; background:rgba(163,230,53,.18); }
.brand { position:relative; z-index:1; width:fit-content; padding:12px 14px; border-radius:18px; color:#08111f; background:#a3e635; text-decoration:none; font-weight:1000; } .brand span { margin-left:8px; }
.story-copy { position:relative; z-index:1; } .story-copy p { margin:0 0 12px; color:#67e8f9; font-size:13px; font-weight:1000; letter-spacing:.16em; text-transform:uppercase; }
.story-copy h1 { margin:0; font-size:clamp(48px,6vw,82px); line-height:.96; letter-spacing:-.09em; }
.journey-card { position:relative; z-index:1; display:grid; gap:12px; padding:18px; border:1px solid rgba(255,255,255,.16); border-radius:30px; background:rgba(255,255,255,.08); backdrop-filter:blur(18px); }
.step { display:flex; align-items:center; gap:14px; padding:15px; border-radius:22px; color:#cbd5e1; background:rgba(255,255,255,.06); } .step.active { color:white; background:rgba(163,230,53,.16); border:1px solid rgba(163,230,53,.36); } .step b { display:grid; place-items:center; width:42px; height:42px; border-radius:15px; color:#08111f; background:#a3e635; }
.register-form-zone { display:grid; place-items:center; padding:34px; }
.register-card { width:min(520px,100%); padding:34px; border-radius:38px; color:#111827; background:rgba(255,255,255,.94); box-shadow:0 34px 100px rgba(0,0,0,.24); }
h2 { margin:0; font-size:42px; letter-spacing:-.075em; } .subtitle { margin:12px 0 0; color:#64748b; line-height:1.7; }
.register-form { display:grid; gap:14px; margin-top:25px; } label { display:grid; gap:8px; color:#334155; font-weight:950; } small { color:#dc2626; font-weight:850; }
.password-box { position:relative; } .password-box input { padding-right:76px; } .password-box button { position:absolute; right:8px; top:50%; transform:translateY(-50%); border:0; border-radius:12px; padding:8px 10px; color:#0f766e; background:#ccfbf1; font-weight:950; }
.strength { display:grid; grid-template-columns:repeat(5,1fr); gap:6px; } .strength i { height:7px; border-radius:999px; background:#e2e8f0; } .strength i.active { background:linear-gradient(135deg,#a3e635,#22d3ee); }
.check { grid-template-columns:20px 1fr; align-items:flex-start; padding:13px; border-radius:18px; background:#f8fafc; border:1px solid #e2e8f0; } .check input { width:18px; height:18px; accent-color:#0f766e; } .check span { color:#64748b!important; font-size:13px!important; line-height:1.6; }
.message { margin:0; padding:12px 14px; border-radius:16px; font-weight:850; } .error { color:#b91c1c; background:#fff1f2; } .success { color:#166534; background:#f0fdf4; }
.submit { height:52px; border:0; border-radius:18px; color:#08111f; background:linear-gradient(135deg,#a3e635,#22d3ee); font-weight:1000; font-size:16px; box-shadow:0 18px 38px rgba(34,211,238,.2); }
.switch { margin:22px 0 0; text-align:center; color:#64748b; } .switch a { color:#0f766e; font-weight:1000; text-decoration:none; }
@media (max-width: 920px) { .register-stage { grid-template-columns:1fr; } .story-panel { min-height:520px; } }
@media (max-width: 560px) { .story-panel,.register-form-zone { padding:20px; } .story-copy h1 { font-size:50px; } }
</style>
