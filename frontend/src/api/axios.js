import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    if (error.response) {
      error.message =
        error.response.data?.message ||
        error.response.statusText ||
        "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
    } else if (error.request) {
      error.message =
        "تعذر الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.";
    } else {
      error.message =
        error.message || "حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.";
    }

    return Promise.reject(error);
  },
);

export default api;
