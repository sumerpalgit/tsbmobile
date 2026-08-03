import axios from 'axios';

/** Mirrors the `{ error: string }` shape the backend returns on failed requests. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error ?? fallback;
  }
  return fallback;
}
