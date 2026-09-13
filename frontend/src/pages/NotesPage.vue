<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "../services/api";
import type { Note } from "../types/note";
import NoteCard from "../components/NoteCard.vue";

type NoteScope = "all" | "mine" | "public";

const route = useRoute();
const router = useRouter();
const notes = ref<Note[]>([]);
const loading = ref(true);
const errorMessage = ref("");
const quickFilter = ref("");
const scope = ref<NoteScope>("all");
const currentUserId = ref<number | null>(null);
const syncingUrl = ref(false);

const scopeOptions: Array<{ label: string; value: NoteScope }> = [
  { label: "全部可見", value: "all" },
  { label: "我的筆記", value: "mine" },
  { label: "公開筆記", value: "public" },
];

function isNoteScope(value: unknown): value is NoteScope {
  return value === "all" || value === "mine" || value === "public";
}

function readQueryValue(value: unknown) {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function applyQueryState() {
  const routeScope = readQueryValue(route.query.scope);
  scope.value = isNoteScope(routeScope) ? routeScope : "all";
  quickFilter.value = readQueryValue(route.query.q);
}

function syncUrlQuery() {
  syncingUrl.value = true;
  router.replace({
    path: "/notes",
    query: {
      scope: scope.value !== "all" ? scope.value : undefined,
      q: quickFilter.value.trim() || undefined,
    },
  }).finally(() => {
    window.setTimeout(() => {
      syncingUrl.value = false;
    }, 0);
  });
}

const filteredNotes = computed(() => {
  const key = quickFilter.value.trim().toLowerCase();
  if (!key) return notes.value;
  return notes.value.filter((note) => [note.title, note.course, note.category, note.description].filter(Boolean).some((item) => String(item).toLowerCase().includes(key)));
});
const totalCourses = computed(() => new Set(notes.value.map((note) => note.course).filter(Boolean)).size);
const totalViews = computed(() => notes.value.reduce((sum, note) => sum + (note.views || 0), 0));
const scopeLabel = computed(() => scopeOptions.find((option) => option.value === scope.value)?.label ?? "全部可見");
const emptyTitle = computed(() => {
  if (quickFilter.value.trim()) return "沒有符合條件的筆記";
  if (scope.value === "mine") return "你還沒有建立筆記";
  if (scope.value === "public") return "目前沒有公開筆記";
  return "目前沒有可瀏覽的筆記";
});

async function fetchNotes() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [meRes, notesRes] = await Promise.all([
      api.get("/auth/me"),
      api.get("/notes", {
        params: {
          scope: scope.value,
        },
      }),
    ]);

    currentUserId.value = meRes.data.user.id;
    notes.value = notesRes.data;
  } catch (error) {
    console.error(error);
    errorMessage.value = "目前無法讀取筆記，請稍後再試。";
  } finally { loading.value = false; }
}
function handleDeleted(noteId: number) { notes.value = notes.value.filter((note) => note.id !== noteId); }

function changeScope(nextScope: NoteScope) {
  scope.value = nextScope;
  syncUrlQuery();
  fetchNotes();
}

watch(quickFilter, () => syncUrlQuery());

watch(() => route.fullPath, () => {
  if (syncingUrl.value) return;
  applyQueryState();
  fetchNotes();
});

onMounted(() => {
  applyQueryState();
  fetchNotes();
});
</script>

<template>
  <section class="notes-board page-frame">
    <div class="board-hero">
      <div>
        <p class="page-kicker">筆記管理</p>
        <h1>筆記庫</h1>
        <p>瀏覽公開筆記與自己的私人筆記，也可以快速篩選、收藏或新增內容。</p>
      </div>
      <div class="board-actions">
        <router-link to="/search" class="primary-action">搜尋筆記</router-link>
        <router-link to="/create" class="secondary-action">新增筆記</router-link>
      </div>
    </div>

    <div class="tool-panel">
      <div class="scope-tabs" aria-label="筆記範圍">
        <button
          v-for="option in scopeOptions"
          :key="option.value"
          type="button"
          :class="{ active: scope === option.value }"
          @click="changeScope(option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <label class="quick-search">
        <span>快速篩選</span>
        <input v-model="quickFilter" placeholder="搜尋標題、課程、分類或描述" />
        <small>此處只篩選目前清單；同義詞請使用上方「搜尋筆記」。</small>
      </label>

      <div class="library-overview">
        <article><span>筆記</span><strong>{{ notes.length }}</strong></article>
        <article><span>課程</span><strong>{{ totalCourses }}</strong></article>
        <article><span>瀏覽</span><strong>{{ totalViews }}</strong></article>
      </div>
    </div>

    <div v-if="quickFilter.trim()" class="active-filter-strip">
      <span>{{ scopeLabel }}</span>
      <button type="button" @click="quickFilter = ''">{{ quickFilter }} ×</button>
    </div>

    <section v-if="loading" class="state-panel"><div class="spinner"></div><h3>載入筆記中</h3><p>正在整理你的筆記列表。</p></section>
    <section v-else-if="errorMessage" class="state-panel error"><h3>讀取失敗</h3><p>{{ errorMessage }}</p><button class="primary-action" @click="fetchNotes">重新整理</button></section>
    <section v-else-if="filteredNotes.length === 0" class="state-panel empty-state">
      <h3>{{ emptyTitle }}</h3>
      <p>你可以新增自己的筆記，或到搜尋頁查看其他人公開分享的內容。</p>
      <div class="empty-actions">
        <router-link to="/create" class="primary-action">新增筆記</router-link>
        <router-link to="/search" class="secondary-action">去搜尋</router-link>
      </div>
    </section>

    <section v-else class="note-masonry">
      <NoteCard
        v-for="note in filteredNotes"
        :key="note.id"
        :note="note"
        :initialFavorited="Boolean(note.favorites?.length)"
        :isOwner="note.authorId === currentUserId"
        :showDeleteButton="note.authorId === currentUserId"
        @deleted="handleDeleted"
      />
    </section>
  </section>
</template>

<style scoped>
.notes-board { padding: 14px 0 64px; }
.board-hero { position:relative; display:grid; grid-template-columns:1fr auto; gap:18px; align-items:end; padding:28px; border-radius:5px; background:rgba(255,250,240,.86); border:1px solid var(--line-strong); box-shadow:var(--shadow-soft); }
.board-hero::before { content:""; position:absolute; inset:10px; border:1px solid rgba(183,121,34,.18); pointer-events:none; }
h1 { margin:0; font-size:clamp(34px,5vw,52px); line-height:1.04; letter-spacing:0; }.board-hero p { max-width:680px; color:var(--muted); line-height:1.7; }.board-actions { display:flex; flex-wrap:wrap; gap:12px; justify-content:flex-end; }
.tool-panel { display:grid; grid-template-columns: 1fr minmax(260px, 380px) auto; gap:14px; align-items:end; margin:16px 0 22px; padding:14px; border:1px solid var(--line-strong); border-radius:5px; background:rgba(255,250,240,.78); box-shadow:var(--shadow-soft); }
.library-overview { display:grid; grid-template-columns: repeat(3, 72px); gap:8px; }
.library-overview article { padding:10px; border-radius:4px; border:1px solid var(--line); background:#f4ead5; }
.library-overview span,.quick-search span { display:block; margin-bottom:7px; color:var(--muted); font-size:11px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }.library-overview strong { font-size:21px; letter-spacing:0; }
.scope-tabs { display:flex; flex-wrap:wrap; gap:10px; }
.scope-tabs button { border:1px solid var(--line); border-radius:999px; padding:10px 13px; color:#57422b; background:#fffaf0; font-weight:800; }
.scope-tabs button.active { color:#6f2430; background:#fff4df; border-color:#d9ad55; box-shadow: inset 0 0 0 1px rgba(183,121,34,.12); }
.active-filter-strip { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:-8px 0 18px; }
.active-filter-strip span { color:var(--muted); font-size:12px; font-weight:800; }
.active-filter-strip button { border:1px solid #d9ad55; border-radius:999px; padding:7px 10px; color:#6f2430; background:#fff4df; font-weight:800; }
.note-masonry { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:18px; }
.state-panel .primary-action { margin-top:18px; }
.empty-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:12px; margin-top:18px; }
@media (max-width: 1100px) { .tool-panel { grid-template-columns:1fr; } .library-overview { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 980px) { .board-hero,.note-masonry { grid-template-columns:1fr; } .board-actions { justify-content:flex-start; } }
@media (max-width: 560px) { .board-actions,.empty-actions,.active-filter-strip { flex-direction:column; align-items:stretch; } .library-overview { grid-template-columns:1fr; } }
</style>
