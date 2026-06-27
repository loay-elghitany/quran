import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("jwtToken");
    config.headers = config.headers || {};
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    if (response?.data && response.data.success === false) {
      const error = new Error(
        response.data.message || "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.",
      );
      error.response = response;
      return Promise.reject(error);
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("jwtToken");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (error.response) {
      error.message =
        error.response.data?.message ||
        error.response.statusText ||
        "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
    } else if (
      error.code === "ECONNABORTED" ||
      error.message.includes("timeout")
    ) {
      error.message =
        "جاري تهيئة وإيقاظ خادم المدرسة.. برجاء الانتظار ثواني قليلة والمحاولة مرة أخرى.";
    } else if (error.request) {
      error.message =
        "تعذر الاتصال بالخادم. يرجى الانتظار ثواني لإيقاظ النظام تلقائياً والمحاولة مجدداً.";
    } else {
      error.message =
        error.message || "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
    }

    return Promise.reject(error);
  },
);

export default api;
