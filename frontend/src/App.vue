<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "./components/Navbar.vue";

const route = useRoute();

const isAuthPage = computed(() => {
  return route.path === "/login" || route.path === "/register";
});
</script>

<template>
  <div class="app-shell">
    <Navbar v-if="!isAuthPage" />

    <main :class="['app-main', { 'app-main--auth': isAuthPage }]">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 8% 0%, rgba(66, 99, 235, 0.13), transparent 30%),
    radial-gradient(circle at 92% 10%, rgba(124, 58, 237, 0.12), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
}

.app-main {
  min-height: calc(100vh - 76px);
  padding: 32px;
}

.app-main--auth {
  min-height: 100vh;
  padding: 0;
}

@media (max-width: 768px) {
  .app-main {
    padding: 18px;
  }

  .app-main--auth {
    padding: 0;
  }
}
</style>
