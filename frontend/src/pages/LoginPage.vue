<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const email = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);

async function handleLogin() {
  errorMessage.value = "";
  loading.value = true;

  try {
    const res = await api.post("/auth/login", {
      email: email.value,
      password: password.value,
    });

    localStorage.setItem("token", res.data.token);
    router.push("/notes");
  } catch (error) {
    console.error(error);
    errorMessage.value = "登入失敗，請檢查帳號密碼";
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
  <div class="page-container" style="max-width: 480px; padding-top: 80px;">
    <div class="card">
      <h1 class="page-title" style="font-size: 32px; margin-bottom: 12px;">
        登入 uniNote
      </h1>

      <p style="margin-bottom: 20px; color: #666;">
        登入後即可查看與收藏筆記
      </p>

      <div class="row" style="flex-direction: column;">
        <input
          v-model="email"
          type="email"
          placeholder="請輸入 Email"
          @keyup.enter="handleLogin"
        />

        <input
          v-model="password"
          type="password"
          placeholder="請輸入密碼"
          @keyup.enter="handleLogin"
        />

        <button @click="handleLogin" :disabled="loading">
          {{ loading ? "登入中..." : "登入" }}
        </button>
      </div>

      <p v-if="errorMessage" style="margin-top: 16px; color: #c0392b;">
        {{ errorMessage }}
      </p>

      <p style="margin-top: 20px;">
        還沒有帳號？
        <router-link to="/register">前往註冊</router-link>
      </p>
    </div>
  </div>
</template>