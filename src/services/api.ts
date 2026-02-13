import axios from 'axios';
import { translateError } from '@/utils/errors';

const api = axios.create({
  baseURL: 'https://api.gobokin.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// https://hallbooker.onrender.com/api/v1
// https://qspfh08j-8000.uks1.devtunnels.ms/api/v1

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        delete config.headers.Authorization;
      }
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