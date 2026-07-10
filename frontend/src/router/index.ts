import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import LoginPage from "../pages/LoginPage.vue";
import RegisterPage from "../pages/RegisterPage.vue";
import NotesPage from "../pages/NotesPage.vue";
import NoteDetailPage from "../pages/NoteDetailPage.vue";
import FavoritesPage from "../pages/FavoritesPage.vue";
import CreateNotePage from "../pages/CreateNotePage.vue";
import SearchPage from "../pages/SearchPage.vue";
import SettingsPage from "../pages/SettingsPage.vue";

const protectedPages = ["/notes", "/search", "/favorites", "/create", "/settings"];

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: HomePage },
    { path: "/login", component: LoginPage, meta: { layout: "auth", guestOnly: true } },
    { path: "/register", component: RegisterPage, meta: { layout: "auth", guestOnly: true } },
    { path: "/search", component: SearchPage, meta: { requiresAuth: true } },
    { path: "/notes", component: NotesPage, meta: { requiresAuth: true } },
    { path: "/notes/:id", component: NoteDetailPage, meta: { requiresAuth: true } },
    { path: "/favorites", component: FavoritesPage, meta: { requiresAuth: true } },
    { path: "/create", component: CreateNotePage, meta: { requiresAuth: true } },
    { path: "/settings", component: SettingsPage, meta: { requiresAuth: true } },
    { path: "/:pathMatch(.*)*", redirect: "/" },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");
  const needsAuth = Boolean(to.meta.requiresAuth) || protectedPages.some((path) => to.path.startsWith(path));

  if (needsAuth && !token) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  if (to.meta.guestOnly && token) {
    return { path: "/search" };
  }

  return true;
});

export default router;
