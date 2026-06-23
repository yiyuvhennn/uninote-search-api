import { createRouter, createWebHistory } from "vue-router";
import HomePage from "../pages/HomePage.vue";
import LoginPage from "../pages/LoginPage.vue";
import RegisterPage from "../pages/RegisterPage.vue";
import NotesPage from "../pages/NotesPage.vue";
import NoteDetailPage from "../pages/NoteDetailPage.vue";
import FavoritesPage from "../pages/FavoritesPage.vue";
import CreateNotePage from "../pages/CreateNotePage.vue";
import SearchPage from "../pages/SearchPage.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomePage,
    },
    {
      path: "/login",
      name: "login",
      component: LoginPage,
    },
    {
      path: "/register",
      name: "register",
      component: RegisterPage,
    },
    {
      path: "/search",
      name: "search",
      component: SearchPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/notes",
      name: "notes",
      component: NotesPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/notes/:id",
      name: "note-detail",
      component: NoteDetailPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/favorites",
      name: "favorites",
      component: FavoritesPage,
      meta: { requiresAuth: true },
    },
    {
      path: "/create",
      name: "create-note",
      component: CreateNotePage,
      meta: { requiresAuth: true },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/",
    },
  ],
});

router.beforeEach((to) => {
  const token = localStorage.getItem("token");

  if (to.meta.requiresAuth && !token) {
    return {
      path: "/login",
      query: { redirect: to.fullPath },
    };
  }

  if ((to.path === "/login" || to.path === "/register") && token) {
    return "/notes";
  }

  return true;
});

export default router;
