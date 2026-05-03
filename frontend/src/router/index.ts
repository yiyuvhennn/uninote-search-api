import { createRouter, createWebHistory } from "vue-router";
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
      redirect: "/login",
    },
    {
      path: "/login",
      component: LoginPage,
    },
    {
      path: "/register",
      component: RegisterPage,
    },
    {
      path: "/search",
      component: SearchPage,
    },
    {
      path: "/notes",
      component: NotesPage,
    },
    {
      path: "/notes/:id",
      component: NoteDetailPage,
    },
    {
      path: "/favorites",
      component: FavoritesPage,
    },
    {
      path: "/create",
      component: CreateNotePage,
    }
  ],
});

export default router;