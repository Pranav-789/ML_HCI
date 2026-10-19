import axios from "axios";
import { BASE_URL } from "../utils/constants.ts";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      config.headers.set("Authorization", `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Track refresh request to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || "";

    const isAuthError =
      status === 401 ||
      (status === 403 && (message.toLowerCase().includes("token") || message.toLowerCase().includes("unauthorized") || message.toLowerCase().includes("forbidden")));

    // Avoid infinite loop if refresh endpoint itself failed
    if (isAuthError && !originalRequest._retry && !originalRequest.url?.includes("/auth/refresh-token") && !originalRequest.url?.includes("/auth/login")) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token) {
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post(
          `${BASE_URL}/auth/refresh-token`,
          { refreshToken },
          {
            withCredentials: true,
            headers: {
              "Content-Type": "application/json",
              ...(refreshToken ? { "x-refresh-token": refreshToken } : {}),
            },
          }
        );

        if (res.data?.success && res.data?.data?.accessToken) {
          const newAccessToken = res.data.data.accessToken;
          const newRefreshToken = res.data.data.refreshToken;

          localStorage.setItem("accessToken", newAccessToken);
          if (newRefreshToken) {
            localStorage.setItem("refreshToken", newRefreshToken);
          }

          api.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          processQueue(null, newAccessToken);
          return api(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.dispatchEvent(new CustomEvent("auth:session-expired"));
        return Promise.reject(new Error("Your session has expired. Please log in again to continue."));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
