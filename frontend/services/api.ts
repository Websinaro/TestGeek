import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

// Extend InternalAxiosRequestConfig to support retries and refresh flags
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
  _retry?: boolean;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const csrfToken = getCookie('XSRF-TOKEN');
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = csrfToken;
  }
  return config;
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as ExtendedAxiosRequestConfig;
    const response = error.response;

    // Determine if we should retry regular idempotent GET calls:
    const shouldRetry =
      config &&
      (!response || response.status === 429 || response.status >= 500) &&
      (!config.retryCount || config.retryCount < MAX_RETRIES) &&
      config.method?.toLowerCase() === 'get' &&
      !config._retry;

    if (shouldRetry) {
      config.retryCount = (config.retryCount || 0) + 1;
      console.warn(
        `[API Retry] Request failed for ${config.url} with ${
          response ? `status ${response.status}` : 'network mismatch'
        }. Attempting retry #${config.retryCount} in ${RETRY_DELAY}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return api(config);
    }

    // Access Token expired/invalid status 401 handling
    if (response?.status === 401 && config && !config._retry && !config.url?.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            config.headers.Authorization = `Bearer ${token}`;
            return api(config);
          })
          .catch((err) => Promise.reject(err));
      }

      config._retry = true;
      isRefreshing = true;

      return new Promise((resolve, reject) => {
        api
          .post('/auth/refresh', {}, { withCredentials: true })
          .then(({ data }) => {
            const newToken = data.token;
            useAuthStore.getState().setToken(newToken);
            if (data.user) {
              useAuthStore.getState().setUser(data.user);
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            config.headers.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);
            resolve(api(config));
          })
          .catch((err) => {
            processQueue(err, null);
            useAuthStore.getState().clearAuth();
            reject(err);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    if (response?.status === 401) {
      useAuthStore.getState().clearAuth();
    }
    return Promise.reject(error);
  }
);

export interface FormattedError {
  message: string;
  fieldErrors?: Record<string, string>;
  statusCode?: number;
  timestamp?: string;
  path?: string;
}

export const formatAPIError = (error: any): FormattedError => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object') {
      return {
        message: data.message || 'An error occurred on the server.',
        fieldErrors: data.errors || undefined,
        statusCode: data.statusCode || error.response?.status,
        timestamp: data.timestamp,
        path: data.path,
      };
    }

    if (error.request) {
      return {
        message: 'No response received from the server. Please check your internet connection.',
      };
    }

    return {
      message: error.message || 'A network error occurred while sending your request.',
    };
  }

  return {
    message: error?.message || 'An unexpected error occurred.',
  };
};

export default api;

