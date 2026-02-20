import axios from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "./auth.js";

// ВАЖНО: baseURL под себя
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Отдельный клиент для refresh (без интерсепторов), чтобы избежать рекурсии
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// --- очередь запросов на время refresh ---
let isRefreshing = false;
let refreshPromise = null;
let pendingQueue = [];

function processQueue(error, newAccessToken) {
  pendingQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${newAccessToken}`;
      resolve(api(config));
    }
  });
  pendingQueue = [];
}

// --- request: подставляем access token ---
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- response: ловим 401 и делаем refresh ---
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error?.config;

    // если нет конфига/ответа — просто пробрасываем
    if (!original || !error?.response) return Promise.reject(error);

    const status = error.response.status;

    // чтобы не уйти в бесконечный цикл
    if (status !== 401) return Promise.reject(error);

    // если это сам refresh endpoint — значит refresh токен умер
    if (original.url?.includes("/auth/refresh")) {
      clearTokens();
      return Promise.reject(error);
    }

    // помечаем, что уже ретраили этот запрос
    if (original.__isRetry) return Promise.reject(error);
    original.__isRetry = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearTokens();
      return Promise.reject(error);
    }

    // если refresh уже идет — ставим запрос в очередь
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, config: original });
      });
    }

    isRefreshing = true;

    try {
      refreshPromise = refreshClient.post("/auth/refresh", { refreshToken });

      const refreshRes = await refreshPromise;

      // ожидаем формат ответа:
      // { accessToken: "...", refreshToken?: "..." }
      const newAccessToken = refreshRes.data?.accessToken;
      const newRefreshToken = refreshRes.data?.refreshToken;

      if (!newAccessToken) {
        throw new Error("Refresh response has no accessToken");
      }

      setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken });

      processQueue(null, newAccessToken);

      // повторяем исходный запрос
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch (e) {
      processQueue(e, null);
      clearTokens();
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }
);
