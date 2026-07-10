<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isOpen = ref(false);

const isLoggedIn = computed(() => Boolean(localStorage.getItem("token")));

function handleLogout() {
  localStorage.removeItem("token");
  isOpen.value = false;
  router.push("/login");
}

function closeMenu() {
  isOpen.value = false;
}
</script>

<template>
  <header class="site-nav">
    <router-link class="brand" to="/" @click="closeMenu">
      <span class="brand-icon">uN</span>
      <span class="brand-text">
        <strong>UniNote</strong>
        <small>Search API</small>
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
      <span v-if="isLoggedIn" class="route-chip">Workspace</span>
      <button v-if="isLoggedIn" type="button" class="logout" @click="handleLogout">登出</button>
      <router-link v-else to="/login" class="login-link">登入</router-link>
    </div>
  </header>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 12px;
  z-index: 90;
  width: min(1220px, calc(100% - 32px));
  min-height: 64px;
  margin: 12px auto 0;
  padding: 9px 10px 9px 12px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 38px rgba(24, 33, 47, 0.08);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #111827;
  text-decoration: none;
}

.brand-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  color: white;
  background: #18212f;
  font-size: 15px;
  font-weight: 850;
  letter-spacing: 0;
}

.brand-text strong {
  display: block;
  font-size: 19px;
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
  display: flex;
  justify-content: center;
  gap: 6px;
}

.nav-link {
  position: relative;
  padding: 10px 12px;
  border-radius: 8px;
  color: #475467;
  text-decoration: none;
  font-size: 14px;
  font-weight: 750;
  transition: 0.2s ease;
}

.nav-link:hover { background: #f2f4f7; color: var(--ink); }
.nav-link.router-link-active { color: #1d4ed8; background: #eff6ff; }
.nav-link.feature.router-link-active { color: white; background: #245fd6; }
.nav-link.create { color: #047857; background: #ecfdf3; }

.nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.route-chip {
  padding: 9px 12px;
  border-radius: 8px;
  color: #344054;
  background: #f9fafb;
  border: 1px solid var(--line);
  font-size: 12px;
  font-weight: 750;
}

.logout,
.login-link,
.menu-button {
  border: 0;
  border-radius: 8px;
  padding: 11px 14px;
  color: white;
  background: var(--ink);
  font-size: 14px;
  font-weight: 750;
  text-decoration: none;
  transition: 0.2s ease;
}

.logout:hover,
.login-link:hover,
.menu-button:hover { transform: translateY(-1px); background: #245fd6; }
.menu-button { display: none; }

@media (max-width: 920px) {
  .site-nav { grid-template-columns: 1fr auto; }
  .menu-button { display: inline-flex; justify-content: center; }
  .nav-links {
    display: none;
    grid-column: 1 / -1;
    justify-content: flex-start;
    flex-wrap: wrap;
    padding-top: 8px;
  }
  .nav-links.open { display: flex; }
  .nav-actions { grid-column: 1 / -1; justify-content: flex-start; }
}

@media (max-width: 520px) {
  .site-nav { top: 8px; width: calc(100% - 16px); border-radius: 10px; }
  .brand-text small, .route-chip { display: none; }
}
</style>
