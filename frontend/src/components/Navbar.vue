<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const isLoggedIn = computed(() => Boolean(localStorage.getItem("token")));

function handleLogout() {
  localStorage.removeItem("token");
  router.push("/login");
}
</script>

<template>
  <header class="navbar">
    <router-link to="/" class="navbar-brand" aria-label="uniNote home">
      <span class="brand-mark">uN</span>

      <div>
        <strong>uniNote</strong>
        <small>Search API MVP</small>
      </div>
    </router-link>

    <nav class="navbar-links" aria-label="Primary navigation">
      <router-link to="/" class="navbar-link">首頁</router-link>
      <router-link v-if="isLoggedIn" to="/notes" class="navbar-link">筆記列表</router-link>
      <router-link v-if="isLoggedIn" to="/search" class="navbar-link">搜尋系統</router-link>
      <router-link v-if="isLoggedIn" to="/favorites" class="navbar-link">我的收藏</router-link>
      <router-link v-if="isLoggedIn" to="/create" class="navbar-link">新增筆記</router-link>
    </nav>

    <div class="navbar-actions">
      <span v-if="isLoggedIn" class="status-pill">
        <i></i>
        Online
      </span>

      <router-link v-if="!isLoggedIn" to="/login" class="login-link">
        登入
      </router-link>

      <router-link v-if="!isLoggedIn" to="/register" class="signup-link">
        建立帳號
      </router-link>

      <button
        v-if="isLoggedIn"
        type="button"
        class="logout-btn"
        @click="handleLogout"
      >
        登出
      </button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  min-height: 76px;
  padding: 0 34px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 28px;
  border-bottom: 1px solid rgba(203, 213, 225, 0.78);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(18px);
}

.navbar-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: #111827;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 15px;
  color: white;
  background: linear-gradient(135deg, #4263eb, #7c3aed);
  font-size: 15px;
  font-weight: 950;
  letter-spacing: -0.05em;
  box-shadow: 0 12px 26px rgba(66, 99, 235, 0.28);
}

.navbar-brand strong {
  display: block;
  color: #111827;
  font-size: 22px;
  font-weight: 950;
  line-height: 1;
  letter-spacing: -0.06em;
}

.navbar-brand small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 11px;
  font-weight: 850;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.navbar-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.navbar-link {
  padding: 10px 13px;
  border-radius: 999px;
  color: #64748b;
  text-decoration: none;
  font-size: 14px;
  font-weight: 850;
  transition: 0.18s ease;
}

.navbar-link:hover {
  color: #172033;
  background: #eef2ff;
}

.navbar-link.router-link-exact-active {
  color: white;
  background: linear-gradient(135deg, #4263eb, #7c3aed);
  box-shadow: 0 12px 24px rgba(66, 99, 235, 0.2);
}

.navbar-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border: 1px solid #dbeafe;
  border-radius: 999px;
  color: #2563eb;
  background: #eff6ff;
  font-size: 12px;
  font-weight: 950;
}

.status-pill i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18);
}

.login-link,
.signup-link,
.logout-btn {
  min-height: 40px;
  padding: 0 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
}

.login-link,
.logout-btn {
  border: 0;
  color: #334155;
  background: white;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}

.signup-link {
  color: white;
  background: linear-gradient(135deg, #4263eb, #7c3aed);
  box-shadow: 0 12px 24px rgba(66, 99, 235, 0.22);
}

.logout-btn {
  cursor: pointer;
  transition: 0.18s ease;
}

.logout-btn:hover {
  color: white;
  background: #111827;
  transform: translateY(-1px);
}

@media (max-width: 1080px) {
  .navbar {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 18px;
  }

  .navbar-links,
  .navbar-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }
}

@media (max-width: 560px) {
  .status-pill {
    display: none;
  }

  .navbar-link {
    padding: 9px 11px;
    font-size: 13px;
  }
}
</style>
