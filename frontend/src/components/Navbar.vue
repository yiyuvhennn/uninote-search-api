<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
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
        <strong>uniNote</strong>
        <small>search intelligence</small>
      </span>
    </router-link>

    <button class="menu-button" type="button" @click="isOpen = !isOpen">
      {{ isOpen ? "關閉" : "選單" }}
    </button>

    <nav :class="['nav-links', { open: isOpen }]">
      <router-link to="/" class="nav-link" @click="closeMenu">首頁</router-link>
      <router-link v-if="isLoggedIn" to="/search" class="nav-link feature" @click="closeMenu">搜尋艙</router-link>
      <router-link v-if="isLoggedIn" to="/notes" class="nav-link" @click="closeMenu">筆記庫</router-link>
      <router-link v-if="isLoggedIn" to="/favorites" class="nav-link" @click="closeMenu">收藏</router-link>
      <router-link v-if="isLoggedIn" to="/create" class="nav-link create" @click="closeMenu">新增</router-link>
    </nav>

    <div class="nav-actions">
      <span v-if="isLoggedIn" class="route-chip">{{ route.name || 'Workspace' }}</span>
      <button v-if="isLoggedIn" type="button" class="logout" @click="handleLogout">登出</button>
      <router-link v-else to="/login" class="login-link">登入</router-link>
    </div>
  </header>
</template>

<style scoped>
.site-nav {
  position: sticky;
  top: 16px;
  z-index: 90;
  width: min(1220px, calc(100% - 32px));
  min-height: 70px;
  margin: 16px auto 0;
  padding: 10px 12px 10px 14px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 18px;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.11);
  backdrop-filter: blur(24px);
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
  width: 48px;
  height: 48px;
  border-radius: 18px;
  color: #06111f;
  background:
    radial-gradient(circle at 20% 15%, white 0 20%, transparent 21%),
    linear-gradient(135deg, #a3e635, #22d3ee 45%, #7c3aed);
  font-size: 15px;
  font-weight: 1000;
  letter-spacing: -0.06em;
  box-shadow: 0 18px 38px rgba(34, 211, 238, 0.22);
}

.brand-text strong {
  display: block;
  font-size: 22px;
  line-height: 1;
  font-weight: 1000;
  letter-spacing: -0.075em;
}

.brand-text small {
  display: block;
  margin-top: 5px;
  color: #64748b;
  font-size: 10px;
  font-weight: 950;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.nav-link {
  position: relative;
  padding: 11px 14px;
  border-radius: 999px;
  color: #475569;
  text-decoration: none;
  font-size: 14px;
  font-weight: 950;
  transition: 0.2s ease;
}

.nav-link:hover { background: rgba(241, 245, 249, 0.92); color: #0f172a; }
.nav-link.router-link-active { color: white; background: #111827; box-shadow: 0 16px 34px rgba(15, 23, 42, 0.18); }
.nav-link.feature.router-link-active { background: linear-gradient(135deg, #3867ff, #7c3aed); }
.nav-link.create { color: #0f766e; background: rgba(204, 251, 241, 0.72); }

.nav-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.route-chip {
  padding: 9px 12px;
  border-radius: 999px;
  color: #3867ff;
  background: rgba(239, 246, 255, 0.92);
  border: 1px solid rgba(147, 197, 253, 0.4);
  font-size: 12px;
  font-weight: 1000;
}

.logout,
.login-link,
.menu-button {
  border: 0;
  border-radius: 999px;
  padding: 11px 14px;
  color: white;
  background: #111827;
  font-size: 14px;
  font-weight: 950;
  text-decoration: none;
  transition: 0.2s ease;
}

.logout:hover,
.login-link:hover,
.menu-button:hover { transform: translateY(-1px); background: #3867ff; }
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
  .site-nav { top: 8px; width: calc(100% - 16px); border-radius: 22px; }
  .brand-text small, .route-chip { display: none; }
}
</style>
