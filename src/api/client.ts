import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_PREFIX } from '@env';
import { AUTH_ENDPOINTS } from './endpoints';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error?: unknown) => void }[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(p => (error ? p.reject(error) : token && p.resolve(token)));
  failedQueue = [];
};

/** Lets AuthContext know a refresh attempt failed so it can flip `isAuthenticated`
 * back to false — this module has no React context of its own to update it. */
let onAuthFailure: (() => void) | null = null;
export function setOnAuthFailure(handler: (() => void) | null) {
  onAuthFailure = handler;
}

/** Shared Axios instance for all API calls, with a 401 interceptor that refreshes the
 * access token once and retries the original request. Concurrent 401s while a refresh is
 * already in flight queue behind it instead of each triggering their own refresh call. */
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    // A 401 from `/auth/login` itself is a real "invalid email or password" response, not an
    // expired-access-token signal — there's no token to refresh yet (the user was never
    // authenticated). Without this check, the code below would try `AsyncStorage.getItem
    // ('refreshToken')` (null, since login hasn't happened), throw a plain `Error('No refresh
    // token available')`, and reject with THAT instead of the real login error — which is why
    // the login screen's `axios.isAxiosError(err)` check was failing and falling through to a
    // generic "Something went wrong" toast instead of the backend's actual `{"error": "Invalid
    // email or password"}` message.
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || originalRequest.url === AUTH_ENDPOINTS.LOGIN) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject,
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${API_BASE_URL}${API_PREFIX}${AUTH_ENDPOINTS.REFRESH_TOKEN}`,
        { refreshToken },
      );

      const { token, refreshToken: newRefreshToken } = response.data;
      await AsyncStorage.setItem('accessToken', token);
      if (newRefreshToken) {
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
      }

      originalRequest.headers.Authorization = `Bearer ${token}`;
      processQueue(null, token);
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      await AsyncStorage.removeMany(['accessToken', 'refreshToken', 'onboardingComplete']);
      onAuthFailure?.();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
