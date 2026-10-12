import axios from 'axios';
import { translateError } from '@/utils/errors';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.gobokin.com/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// https://hallbooker.onrender.com/api/v1
// https://qspfh08j-8000.uks1.devtunnels.ms/api/v1

const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null;
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
};

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || getCookie('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
    }

    // Redirect specific super admin and policies endpoints to the local Next.js API route handlers
    const useProduction = config.headers && (config.headers['X-Use-Production'] || config.headers['x-use-production']);
    if (config.headers) {
      delete config.headers['X-Use-Production'];
      delete config.headers['x-use-production'];
    }

    if (!useProduction && config.url && (
      config.url.startsWith('/policies') ||
      config.url.startsWith('policies')
    )) {
      config.baseURL = '/api/v1';
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('unauthorized-access'));
      }
    }

    // Determine if error is eligible for retry (network error, DNS resolution failure, 5xx server error, timeout)
    const isNetworkOrServerError =
      !error.response ||
      (error.response.status >= 500 && error.response.status <= 599) ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
      error.message?.includes('Network Error');

    // Only retry GET/HEAD requests or requests marked explicitly for retry, and only up to MAX_RETRIES times
    const isRetryableMethod = !config?.method || ['get', 'head'].includes(config.method.toLowerCase());

    if (config && isRetryableMethod && isNetworkOrServerError) {
      config.__retryCount = config.__retryCount || 0;

      if (config.__retryCount < MAX_RETRIES) {
        config.__retryCount += 1;
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, config.__retryCount - 1);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('api-retry-in-progress', {
              detail: { retryCount: config.__retryCount, maxRetries: MAX_RETRIES, delay, url: config.url },
            })
          );
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        return api(config);
      }
    }

    // Translate technical error to layman terms
    const translatedMessage = translateError(error);

    // Attach the translated message to the error object so components can use it directly
    if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      errObj.originalMessage = errObj.message;
      errObj.message = translatedMessage;
    }

    return Promise.reject(error);
  }
);

export default api;