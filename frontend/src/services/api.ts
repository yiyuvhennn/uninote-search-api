import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
  timeout: 12000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");

      // 避免 token 失效後仍停在受保護頁面，只看到模糊的「讀取失敗」。
      // 使用 location 重新載入，確保所有殘留的使用者畫面狀態一併清除。
      if (window.location.pathname !== "/login") {
        const redirect = `${window.location.pathname}${window.location.search}`;
        window.location.replace(
          `/login?reason=session-expired&redirect=${encodeURIComponent(redirect)}`
        );
      }
    }

    return Promise.reject(error);
  }
);

export default api;
