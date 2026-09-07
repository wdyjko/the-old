import axios from "axios";
import { useUserStore } from "../store/userStore";

// 线上通过 vercel.json 代理 /api/* 到后端服务
// 本地开发通过 vite.config.ts 的 server.proxy 代理
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
