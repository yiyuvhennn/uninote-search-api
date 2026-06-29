<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import Navbar from "./components/Navbar.vue";

const route = useRoute();

const isAuthPage = computed(() => route.meta.layout === "auth");
</script>

<template>
  <div :class="['app-shell', { 'app-shell--auth': isAuthPage }]">
    <Navbar v-if="!isAuthPage" />

    <main :class="['app-main', { 'app-main--auth': isAuthPage }]">
      <router-view />
    </main>
  </div>
</template>
