import axios from 'axios';
import { translateError } from '@/utils/errors';

export const API_BASE_URL = 'https://api.gobokin.com/api/v1';

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
      config.url.startsWith('/events/admin/packages') ||
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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('unauthorized-access'));
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