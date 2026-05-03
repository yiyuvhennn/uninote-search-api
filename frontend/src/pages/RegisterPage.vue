<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();

const name = ref("");
const email = ref("");
const password = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const loading = ref(false);

async function handleRegister() {
  errorMessage.value = "";
  successMessage.value = "";
  loading.value = true;

  try {
    await api.post("/auth/register", {
      name: name.value,
      email: email.value,
      password: password.value,
    });

    successMessage.value = "註冊成功，請前往登入";
    name.value = "";
    email.value = "";
    password.value = "";

    setTimeout(() => {
      router.push("/login");
    }, 1000);
  } catch (error) {
    console.error(error);
    errorMessage.value = "註冊失敗，請檢查資料是否正確";
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
        註冊 uniNote
      </h1>

      <p style="margin-bottom: 20px; color: #666;">
        建立帳號後即可上傳、搜尋與收藏筆記
      </p>

      <div class="row" style="flex-direction: column;">
        <input
          v-model="name"
          type="text"
          placeholder="請輸入名稱"
          @keyup.enter="handleRegister"
        />

        <input
          v-model="email"
          type="email"
          placeholder="請輸入 Email"
          @keyup.enter="handleRegister"
        />

        <input
          v-model="password"
          type="password"
          placeholder="請輸入密碼"
          @keyup.enter="handleRegister"
        />

        <button @click="handleRegister" :disabled="loading">
          {{ loading ? "註冊中..." : "註冊" }}
        </button>
      </div>

      <p v-if="errorMessage" style="margin-top: 16px; color: #c0392b;">
        {{ errorMessage }}
      </p>

      <p v-if="successMessage" style="margin-top: 16px; color: #27ae60;">
        {{ successMessage }}
      </p>

      <p style="margin-top: 20px;">
        已經有帳號？
        <router-link to="/login">前往登入</router-link>
      </p>
    </div>
  </div>
</template>