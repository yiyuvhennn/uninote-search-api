<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import api from "../services/api";

const route = useRoute();
const token = computed(() => String(route.query.token || ""));
const newPassword = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const message = ref("");
const errorMessage = ref("");

async function submit() {
  loading.value = true;
  message.value = "";
  errorMessage.value = "";
  try {
    const response = await api.post("/auth/reset-password", {
      token: token.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    });
    message.value = response.data.message;
  } catch (error: any) {
    errorMessage.value = error?.response?.data?.message || "密碼重設失敗";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <main class="reset-stage"><section class="reset-card">
    <p class="page-kicker">帳號協助</p><h1>設定新密碼</h1>
    <form v-if="token" @submit.prevent="submit">
      <label><span>新密碼</span><input v-model="newPassword" type="password" minlength="6" required /></label>
      <label><span>再次輸入</span><input v-model="confirmPassword" type="password" minlength="6" required /></label>
      <p v-if="message" class="success">{{ message }}</p><p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <button :disabled="loading">{{ loading ? "更新中..." : "更新密碼" }}</button>
    </form>
    <p v-else class="error">重設連結缺少 token，請重新申請。</p>
    <router-link to="/login">返回登入</router-link>
  </section></main>
</template>

<style scoped>
.reset-stage{min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--bg)}.reset-card{width:min(520px,100%);padding:34px;border:1px solid var(--line-strong);background:#fffaf0;box-shadow:var(--shadow-hard)}h1{margin:0 0 24px;font-size:42px}form,label{display:grid;gap:10px}form{gap:16px;margin:24px 0}label span{font-weight:800}button{padding:14px;border:0;border-radius:4px;color:white;background:var(--wine);font-weight:800}.success{color:#166534}.error{color:#b91c1c}
</style>
