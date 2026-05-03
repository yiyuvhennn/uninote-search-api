<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

function handleLogout() {
  localStorage.removeItem("token");
  router.push("/login");
}
</script>

<template>
  <nav class="navbar">
    <router-link to="/search" class="navbar-brand">UniNote</router-link>
    <div class="navbar-links">
      <router-link to="/search" class="navbar-btn">搜尋系統</router-link>
      <router-link to="/notes" class="navbar-btn">筆記列表</router-link>
      <router-link to="/favorites" class="navbar-btn">我的收藏</router-link>
      <router-link to="/create" class="navbar-btn">新增筆記</router-link>
      <button @click="handleLogout">登出</button>
    </div>
  </nav>
</template>