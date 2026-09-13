<script setup lang="ts">
import { ref } from "vue";
import api from "../services/api";

const email = ref("");
const loading = ref(false);
const message = ref("");
const errorMessage = ref("");
const resetUrl = ref("");

async function submit() {
  loading.value = true;
  message.value = "";
  errorMessage.value = "";
  resetUrl.value = "";
  try {
    const response = await api.post("/auth/forgot-password", { email: email.value.trim() });
    message.value = response.data.message;
    resetUrl.value = response.data.resetUrl || "";
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || "目前無法申請重設密碼";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="reset-stage">
    <section class="reset-card">
      <p class="page-kicker">帳號協助</p>
      <h1>忘記密碼</h1>
      <p>輸入註冊 Email。正式環境會寄出有效 30 分鐘的重設連結。</p>
      <form @submit.prevent="submit">
        <label><span>Email</span><input v-model="email" type="email" required autocomplete="email" /></label>
        <p v-if="message" class="success">{{ message }}</p>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <a v-if="resetUrl" :href="resetUrl" class="dev-link">本機測試：開啟密碼重設頁</a>
        <button :disabled="loading">{{ loading ? "申請中..." : "取得重設連結" }}</button>
      </form>
      <router-link to="/login">返回登入</router-link>
    </section>
  </main>
</template>

<style scoped>
.reset-stage{min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--bg)}.reset-card{width:min(520px,100%);padding:34px;border:1px solid var(--line-strong);background:#fffaf0;box-shadow:var(--shadow-hard)}h1{margin:0;font-size:42px}.reset-card>p{color:var(--muted);line-height:1.7}form,label{display:grid;gap:10px}form{gap:16px;margin:24px 0}label span{font-weight:800}button,.dev-link{padding:14px;border:0;border-radius:4px;color:white;background:var(--wine);font-weight:800;text-align:center;text-decoration:none}.dev-link{background:#1f6f55}.success{color:#166534}.error{color:#b91c1c}
</style>
