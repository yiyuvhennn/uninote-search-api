<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt?: string;
};

const router = useRouter();
const loading = ref(true);
const savingProfile = ref(false);
const savingPassword = ref(false);
const deletingAccount = ref(false);

const user = ref<CurrentUser | null>(null);
const name = ref("");

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");

const deletePassword = ref("");
const confirmText = ref("");

const profileMessage = ref("");
const profileError = ref("");
const passwordMessage = ref("");
const passwordError = ref("");
const deleteError = ref("");
const pageError = ref("");

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.response?.data?.error || fallback;
}

function formatDate(value?: string) {
  if (!value) return "未記錄";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}

async function fetchMe() {
  loading.value = true;
  pageError.value = "";

  try {
    const res = await api.get<{ user: CurrentUser }>("/auth/me");
    user.value = res.data.user;
    name.value = res.data.user.name;
  } catch (error) {
    pageError.value = getErrorMessage(error, "讀取帳號資料失敗");
  } finally {
    loading.value = false;
  }
}

async function saveProfile() {
  profileMessage.value = "";
  profileError.value = "";

  if (!name.value.trim()) {
    profileError.value = "請輸入名稱";
    return;
  }

  savingProfile.value = true;

  try {
    const res = await api.patch<{ user: CurrentUser }>("/auth/me", {
      name: name.value.trim(),
    });

    user.value = res.data.user;
    name.value = res.data.user.name;
    profileMessage.value = "個人資料已更新";
  } catch (error) {
    profileError.value = getErrorMessage(error, "更新個人資料失敗");
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword() {
  passwordMessage.value = "";
  passwordError.value = "";

  if (!currentPassword.value.trim()) {
    passwordError.value = "請輸入目前密碼";
    return;
  }

  if (!newPassword.value.trim()) {
    passwordError.value = "請輸入新密碼";
    return;
  }

  if (!confirmPassword.value.trim()) {
    passwordError.value = "請再次輸入新密碼";
    return;
  }

  if (newPassword.value.length < 6) {
    passwordError.value = "新密碼至少需要 6 碼";
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = "新密碼與確認密碼不一致";
    return;
  }

  savingPassword.value = true;

  try {
    await api.patch("/auth/me/password", {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    });

    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    passwordMessage.value = "密碼已更新";
  } catch (error) {
    passwordError.value = getErrorMessage(error, "更新密碼失敗");
  } finally {
    savingPassword.value = false;
  }
}

async function deleteAccount() {
  deleteError.value = "";

  if (!deletePassword.value.trim()) {
    deleteError.value = "請輸入目前密碼";
    return;
  }

  if (confirmText.value !== "DELETE") {
    deleteError.value = "請輸入 DELETE 以確認刪除帳號";
    return;
  }

  const confirmed = window.confirm("確定要永久刪除帳號嗎？這個動作無法復原。");

  if (!confirmed) return;

  deletingAccount.value = true;

  try {
    await api.delete("/auth/me", {
      data: {
        currentPassword: deletePassword.value,
        confirmText: confirmText.value,
      },
    });

    localStorage.removeItem("token");
    router.push("/login");
  } catch (error) {
    deleteError.value = getErrorMessage(error, "刪除帳號失敗");
  } finally {
    deletingAccount.value = false;
  }
}

onMounted(fetchMe);
</script>

<template>
  <section class="settings-page page-frame">
    <header class="settings-hero">
      <div>
        <p class="page-kicker">Account settings</p>
        <h1>帳號設定</h1>
        <p>管理你的個人資料、登入密碼與帳號狀態。</p>
      </div>
    </header>

    <section v-if="loading" class="state-panel">
      <div class="spinner"></div>
      <h3>讀取帳號資料</h3>
      <p>正在確認目前登入使用者。</p>
    </section>

    <section v-else-if="pageError" class="state-panel error">
      <h3>讀取失敗</h3>
      <p>{{ pageError }}</p>
      <button class="primary-action" type="button" @click="fetchMe">重新整理</button>
    </section>

    <div v-else class="settings-layout">
      <section class="settings-card">
        <div class="section-heading">
          <span>Profile</span>
          <h2>個人資料</h2>
        </div>

        <form class="settings-form" @submit.prevent="saveProfile">
          <label>
            <span>Email</span>
            <input :value="user?.email" disabled />
          </label>

          <label>
            <span>名稱</span>
            <input v-model="name" placeholder="輸入顯示名稱" />
          </label>

          <p class="muted">建立時間：{{ formatDate(user?.createdAt) }}</p>
          <p v-if="profileError" class="message error">{{ profileError }}</p>
          <p v-if="profileMessage" class="message success">{{ profileMessage }}</p>

          <button class="submit-button" type="submit" :disabled="savingProfile">
            {{ savingProfile ? "儲存中..." : "儲存個人資料" }}
          </button>
        </form>
      </section>

      <section class="settings-card">
        <div class="section-heading">
          <span>Password</span>
          <h2>修改密碼</h2>
        </div>

        <form class="settings-form" @submit.prevent="savePassword">
          <label>
            <span>目前密碼</span>
            <input v-model="currentPassword" type="password" autocomplete="current-password" />
          </label>

          <label>
            <span>新密碼</span>
            <input v-model="newPassword" type="password" autocomplete="new-password" />
          </label>

          <label>
            <span>確認新密碼</span>
            <input v-model="confirmPassword" type="password" autocomplete="new-password" />
          </label>

          <p v-if="passwordError" class="message error">{{ passwordError }}</p>
          <p v-if="passwordMessage" class="message success">{{ passwordMessage }}</p>

          <button class="submit-button" type="submit" :disabled="savingPassword">
            {{ savingPassword ? "更新中..." : "更新密碼" }}
          </button>
        </form>
      </section>

      <section class="settings-card danger-zone">
        <div class="section-heading">
          <span>Danger zone</span>
          <h2>刪除帳號</h2>
        </div>

        <p class="danger-copy">
          刪除帳號後，你的筆記、PDF 匯入資料與收藏資料會一併刪除，這個動作無法復原。
        </p>

        <form class="settings-form" @submit.prevent="deleteAccount">
          <label>
            <span>目前密碼</span>
            <input v-model="deletePassword" type="password" autocomplete="current-password" />
          </label>

          <label>
            <span>輸入 DELETE 確認</span>
            <input v-model="confirmText" placeholder="DELETE" />
          </label>

          <p v-if="deleteError" class="message error">{{ deleteError }}</p>

          <button class="delete-button" type="submit" :disabled="deletingAccount">
            {{ deletingAccount ? "刪除中..." : "永久刪除帳號" }}
          </button>
        </form>
      </section>
    </div>
  </section>
</template>

<style scoped>
.settings-page {
  padding: 28px 0 60px;
}

.settings-hero {
  padding: 32px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #ffffff;
  box-shadow: var(--shadow-soft);
}

.settings-hero h1 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(42px, 6vw, 72px);
  line-height: 1.04;
  letter-spacing: 0;
}

.settings-hero p:not(.page-kicker) {
  max-width: 640px;
  color: var(--muted);
  line-height: 1.8;
}

.settings-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 22px;
}

.settings-card {
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow-soft);
}

.danger-zone {
  grid-column: 1 / -1;
  border-color: #fecdd3;
  background: #fffafa;
}

.section-heading span {
  color: var(--blue);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.section-heading h2 {
  margin: 8px 0 18px;
  color: var(--ink);
  font-size: 28px;
  letter-spacing: 0;
}

.settings-form {
  display: grid;
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
}

label span {
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

input:disabled {
  color: #667085;
  background: #f2f4f7;
}

.muted,
.danger-copy {
  margin: 0;
  color: var(--muted);
  line-height: 1.7;
}

.danger-copy {
  margin-bottom: 16px;
}

.message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 10px;
  font-weight: 800;
}

.message.error {
  color: #b91c1c;
  background: #fff1f2;
}

.message.success {
  color: #166534;
  background: #f0fdf4;
}

.submit-button,
.delete-button {
  min-height: 48px;
  border: 0;
  border-radius: 8px;
  color: white;
  font-size: 15px;
  font-weight: 800;
}

.submit-button {
  background: var(--blue);
}

.delete-button {
  background: #b42318;
}

@media (max-width: 860px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}
</style>
