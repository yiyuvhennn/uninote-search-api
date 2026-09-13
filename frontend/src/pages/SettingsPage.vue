<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import ToastMessage from "../components/ToastMessage.vue";

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
const showDeleteModal = ref(false);

const user = ref<CurrentUser | null>(null);
const name = ref("");

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

const deletePassword = ref("");
const confirmText = ref("");
const showDeletePassword = ref(false);

const profileMessage = ref("");
const profileError = ref("");
const passwordMessage = ref("");
const passwordError = ref("");
const deleteError = ref("");
const pageError = ref("");
const toastMessage = ref("");
const toastType = ref<"success" | "error" | "info">("info");
const canDeleteAccount = computed(() => Boolean(deletePassword.value.trim() && confirmText.value === "DELETE" && !deletingAccount.value));

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
  toastMessage.value = "";

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
    toastType.value = "success";
    toastMessage.value = "個人資料已更新";
  } catch (error) {
    profileError.value = getErrorMessage(error, "更新個人資料失敗");
    toastType.value = "error";
    toastMessage.value = "儲存失敗，請稍後再試";
  } finally {
    savingProfile.value = false;
  }
}

async function savePassword() {
  passwordMessage.value = "";
  passwordError.value = "";
  toastMessage.value = "";

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
    toastType.value = "success";
    toastMessage.value = "密碼已更新";
  } catch (error) {
    passwordError.value = getErrorMessage(error, "更新密碼失敗");
    toastType.value = "error";
    toastMessage.value = "密碼更新失敗，請稍後再試";
  } finally {
    savingPassword.value = false;
  }
}

async function deleteAccount() {
  deleteError.value = "";
  toastMessage.value = "";

  if (!deletePassword.value.trim()) {
    deleteError.value = "請輸入目前密碼";
    return;
  }

  if (confirmText.value !== "DELETE") {
    deleteError.value = "請輸入 DELETE 以確認刪除帳號";
    return;
  }

  showDeleteModal.value = true;
}

async function confirmDeleteAccount() {
  deleteError.value = "";
  toastMessage.value = "";

  deletingAccount.value = true;

  try {
    await api.delete("/auth/me", {
      data: {
        currentPassword: deletePassword.value,
        confirmText: confirmText.value,
      },
    });

    localStorage.removeItem("token");
    showDeleteModal.value = false;
    router.push("/login");
  } catch (error) {
    deleteError.value = getErrorMessage(error, "刪除帳號失敗");
    toastType.value = "error";
    toastMessage.value = "刪除失敗，請稍後再試";
    showDeleteModal.value = false;
  } finally {
    deletingAccount.value = false;
  }
}

onMounted(fetchMe);
</script>

<template>
  <section class="settings-page page-frame">
    <ToastMessage v-if="toastMessage" :message="toastMessage" :type="toastType" />

    <header class="settings-hero">
      <div>
        <p class="page-kicker">帳號管理</p>
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
          <span>個人資料</span>
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
          <span>密碼</span>
          <h2>修改密碼</h2>
        </div>

        <form class="settings-form" @submit.prevent="savePassword">
          <label>
            <span>目前密碼</span>
            <div class="password-field">
              <input v-model="currentPassword" :type="showCurrentPassword ? 'text' : 'password'" autocomplete="current-password" />
              <button type="button" @click="showCurrentPassword = !showCurrentPassword">
                {{ showCurrentPassword ? "隱藏" : "顯示" }}
              </button>
            </div>
          </label>

          <label>
            <span>新密碼</span>
            <div class="password-field">
              <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" autocomplete="new-password" />
              <button type="button" @click="showNewPassword = !showNewPassword">
                {{ showNewPassword ? "隱藏" : "顯示" }}
              </button>
            </div>
          </label>

          <label>
            <span>確認新密碼</span>
            <div class="password-field">
              <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password" />
              <button type="button" @click="showConfirmPassword = !showConfirmPassword">
                {{ showConfirmPassword ? "隱藏" : "顯示" }}
              </button>
            </div>
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
          <span>危險操作</span>
          <h2>刪除帳號</h2>
        </div>

        <div class="danger-copy">
          <p>刪除前請確認以下影響。完成後無法復原。</p>
          <ul>
            <li>你的帳號會被永久刪除</li>
            <li>你建立的公開筆記會被刪除</li>
            <li>你建立的私人筆記會被刪除</li>
            <li>你匯入的 PDF 筆記會被刪除</li>
            <li>其他人對你筆記的收藏會被移除</li>
          </ul>
        </div>

        <form class="settings-form" @submit.prevent="deleteAccount">
          <label>
            <span>目前密碼</span>
            <div class="password-field">
              <input v-model="deletePassword" :type="showDeletePassword ? 'text' : 'password'" autocomplete="current-password" />
              <button type="button" @click="showDeletePassword = !showDeletePassword">
                {{ showDeletePassword ? "隱藏" : "顯示" }}
              </button>
            </div>
          </label>

          <label>
            <span>輸入 DELETE 確認</span>
            <input v-model="confirmText" placeholder="DELETE" />
          </label>

          <p v-if="deleteError" class="message error">{{ deleteError }}</p>

          <button class="delete-button" type="submit" :disabled="!canDeleteAccount">
            {{ deletingAccount ? "刪除中..." : "永久刪除帳號" }}
          </button>
        </form>
      </section>
    </div>

    <div v-if="showDeleteModal" class="modal-backdrop" role="presentation" @click.self="showDeleteModal = false">
      <section class="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <p class="page-kicker">最後確認</p>
        <h2 id="delete-title">永久刪除帳號？</h2>
        <p>這會刪除你的帳號、公開筆記、私人筆記、PDF 匯入資料與收藏紀錄。完成後無法復原。</p>
        <div class="modal-actions">
          <button type="button" class="secondary-action" :disabled="deletingAccount" @click="showDeleteModal = false">取消</button>
          <button type="button" class="delete-button modal-delete" :disabled="deletingAccount" @click="confirmDeleteAccount">
            {{ deletingAccount ? "刪除中..." : "確認永久刪除" }}
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.settings-page {
  padding: 14px 0 64px;
}

.settings-hero {
  position: relative;
  padding: 26px;
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  background: rgba(255, 250, 240, 0.86);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.settings-hero::before {
  content: "";
  position: absolute;
  inset: 10px;
  border: 1px solid rgba(183, 121, 34, 0.16);
  pointer-events: none;
}

.settings-hero h1 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(34px, 4.6vw, 52px);
  line-height: 1.08;
  letter-spacing: 0;
}

.settings-hero p:not(.page-kicker) {
  max-width: 640px;
  color: var(--muted);
  line-height: 1.7;
}

.settings-layout {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 22px;
}

.settings-card {
  padding: 24px;
  border: 1px solid var(--line-strong);
  border-radius: 5px;
  background: rgba(255, 250, 240, 0.88);
  box-shadow: var(--shadow-soft);
  backdrop-filter: blur(18px);
}

.danger-zone {
  grid-column: 1 / -1;
  border-color: #fecdd3;
  background: linear-gradient(180deg, #fff4f2 0%, #fffaf0 100%);
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

.danger-copy { margin-bottom: 16px; }
.danger-copy p { margin: 0 0 10px; }
.danger-copy ul { margin: 0; padding-left: 20px; }
.danger-copy li + li { margin-top: 6px; }

.password-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.password-field button {
  min-width: 64px;
  border: 0;
  border-radius: 10px;
  color: var(--blue);
  background: #edf4ff;
  font-weight: 800;
}

.message {
  margin: 0;
  padding: 12px 14px;
  border-radius: 12px;
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
  border-radius: 12px;
  color: white;
  font-size: 15px;
  font-weight: 800;
}

.submit-button {
  background: linear-gradient(180deg, #c99637, #8f5d16);
  box-shadow: 0 14px 24px rgba(143, 93, 22, 0.16);
}

.delete-button {
  background: #b42318;
  box-shadow: 0 14px 24px rgba(180, 35, 24, 0.12);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 210;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.48);
}

.confirm-modal {
  width: min(460px, 100%);
  padding: 24px;
  border: 1px solid #fecdd3;
  border-radius: 5px;
  background: #fffafa;
  box-shadow: var(--shadow-hard);
}

.confirm-modal h2 {
  margin: 0 0 10px;
  font-size: 30px;
  letter-spacing: 0;
}

.confirm-modal p:not(.page-kicker) {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 20px;
}

.modal-delete {
  width: 100%;
}

@media (max-width: 860px) {
  .settings-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .settings-page { padding-top: 8px; }
  .settings-card, .settings-hero { padding: 18px; }
  .password-field { grid-template-columns: 1fr; }
  .password-field button { min-height: 40px; }
  .modal-actions { grid-template-columns: 1fr; }
}
</style>
