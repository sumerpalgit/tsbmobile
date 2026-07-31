import axios from 'axios';
import { API_BASE_URL } from '@env';

/** Shared Axios instance for all API calls. No auth/refresh-token interceptors yet — added once
 * the login endpoint is confirmed working. */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
