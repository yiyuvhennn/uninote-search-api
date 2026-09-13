<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";

const router = useRouter();
const route = useRoute();
const isOpen = ref(false);
const currentUser = ref<{ name: string; email: string } | null>(null);

const isLoggedIn = computed(() => Boolean(localStorage.getItem("token")));
const currentUserLabel = computed(() =>
  currentUser.value
    ? `${currentUser.value.name} · ${currentUser.value.email}`
    : "確認登入身分中…"
);

async function loadCurrentUser() {
  if (!localStorage.getItem("token")) {
    currentUser.value = null;
    return;
  }

  try {
    const response = await api.get("/auth/me");
    currentUser.value = response.data.user;
  } catch {
    currentUser.value = null;
  }
}

function handleLogout() {
  localStorage.removeItem("token");
  currentUser.value = null;
  isOpen.value = false;
  router.push("/login");
}

function closeMenu() {
  isOpen.value = false;
}

onMounted(loadCurrentUser);
watch(() => route.fullPath, loadCurrentUser);
</script>

<template>
  <header class="site-nav">
    <router-link class="brand" to="/" @click="closeMenu">
      <span class="brand-icon">uN</span>
      <span class="brand-text">
        <strong>UniNote</strong>
        <small>學習筆記</small>
      </span>
    </router-link>

    <button class="menu-button" type="button" @click="isOpen = !isOpen">
      {{ isOpen ? "關閉" : "選單" }}
    </button>

    <nav :class="['nav-links', { open: isOpen }]">
      <router-link to="/" class="nav-link" @click="closeMenu">首頁</router-link>
      <router-link v-if="isLoggedIn" to="/search" class="nav-link feature" @click="closeMenu">搜尋</router-link>
      <router-link v-if="isLoggedIn" to="/notes" class="nav-link" @click="closeMenu">筆記庫</router-link>
      <router-link v-if="isLoggedIn" to="/favorites" class="nav-link" @click="closeMenu">收藏</router-link>
      <router-link v-if="isLoggedIn" to="/create" class="nav-link create" @click="closeMenu">新增</router-link>
      <router-link v-if="isLoggedIn" to="/settings" class="nav-link" @click="closeMenu">設定</router-link>
    </nav>

    <div class="nav-actions">
      <span v-if="isLoggedIn" class="route-chip" :title="currentUser?.email">
        {{ currentUserLabel }}
      </span>
      <button v-if="isLoggedIn" type="button" class="logout" @click="handleLogout">登出</button>
      <router-link v-else to="/login" class="login-link">登入</router-link>
    </div>
  </header>
</template>

<style scoped>
.site-nav {
  position: relative;
  z-index: 90;
  width: min(1220px, calc(100% - 32px));
  min-height: 66px;
  margin: 14px auto 22px;
  padding: 10px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  border: 1px solid var(--line-strong);
  border-radius: 4px;
  background:
    linear-gradient(180deg, rgba(255,250,240,.94), rgba(247,236,214,.88));
  box-shadow: 0 12px 34px rgba(56, 39, 23, 0.12);
  backdrop-filter: blur(18px);
}

.site-nav::before {
  content: "";
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(183, 121, 34, 0.24);
  pointer-events: none;
}

.brand {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #111827;
  text-decoration: none;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 3px;
  color: white;
  background:
    linear-gradient(135deg, rgba(255,255,255,.18), transparent 35%),
    #172235;
  font-size: 15px;
  font-weight: 850;
  letter-spacing: 0;
}

.brand-text strong {
  display: block;
  font-family: "Noto Serif TC", Georgia, serif;
  font-size: 20px;
  line-height: 1;
  font-weight: 850;
  letter-spacing: 0;
}

.brand-text small {
  display: block;
  margin-top: 5px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.nav-links {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 4px;
  border: 1px solid rgba(198, 179, 146, 0.72);
  border-radius: 999px;
  background: rgba(255, 250, 240, 0.66);
}

.nav-link {
  position: relative;
  padding: 9px 12px;
  border-radius: 999px;
  color: #5d4a34;
  text-decoration: none;
  font-size: 14px;
  font-weight: 750;
  transition: 0.2s ease;
}

.nav-link:hover { background: #fff7e8; color: var(--ink); box-shadow: 0 8px 18px rgba(56,39,23,.08); }
.nav-link.router-link-active { color: #6f2430; background: #fff7e8; box-shadow: inset 0 0 0 1px rgba(183,121,34,.24); }
.nav-link.feature.router-link-active { color: white; background: var(--wine); }
.nav-link.create { color: #175d47; background: rgba(225, 242, 225, .84); }

.nav-actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.route-chip {
  padding: 9px 12px;
  border-radius: 999px;
  color: #57422b;
  background: rgba(255,250,240,.72);
  border: 1px solid var(--line-strong);
  font-size: 12px;
  font-weight: 750;
}

.logout,
.login-link,
.menu-button {
  border: 0;
  border-radius: 3px;
  padding: 11px 14px;
  color: white;
  background: var(--slate);
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
  transition: 0.2s ease;
}

.logout:hover,
.login-link:hover,
.menu-button:hover { transform: translateY(-1px); background: var(--wine); }
.menu-button { display: none; }

@media (max-width: 920px) {
  .site-nav {
    grid-template-columns: minmax(0, 1fr) auto auto;
    gap: 8px;
  }
  .menu-button { display: inline-flex; justify-content: center; }
  .nav-links {
    display: none;
    grid-column: 1 / -1;
    justify-content: flex-start;
    flex-wrap: wrap;
    padding-top: 8px;
    background: transparent;
    border: 0;
  }
  .nav-links.open { display: flex; }
  .route-chip { display: none; }
  .nav-actions { grid-column: auto; justify-content: flex-end; }
}

@media (max-width: 520px) {
  .site-nav { width: calc(100% - 16px); margin-bottom: 14px; border-radius: 4px; }
  .brand-text small, .route-chip { display: none; }
}
</style>
