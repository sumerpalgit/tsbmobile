import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './client';
import { rotateTokenForProfileSwitch } from '../services/push/token';
import { DUAL_PROFILE_ENDPOINTS } from './endpoints';

/** Thin wrappers over `DUAL_PROFILE_ENDPOINTS` — matches
 * `webSrc/app/dashboard/create-dual-profile/page.tsx`'s real `/api/dual-profile/*` calls (see the
 * plan at `delightful-seeking-snowglobe.md`). */

export type CreateDualProfileRequest = {
  role_type: string;
  sub_category: string;
  bio?: string;
  org_role?: string;
  org_name?: string;
  linkedin_url?: string;
  chapter_ids?: string[];
};

export type DualProfileMutationResponse = {
  token?: string;
  data?: unknown;
  message?: string;
};

/** Persists a rotated JWT the same way `login`/`applyOAuthSession` do (`src/api/auth.ts`) —
 * `apiClient`'s request interceptor (`client.ts:36`) reads `accessToken` from `AsyncStorage` fresh
 * on every call, so writing it here is enough for every subsequent request (role-profile save,
 * interests save, etc.) to automatically carry the new token with no extra plumbing. */
async function applyRotatedToken(response: DualProfileMutationResponse) {
  if (response.token) {
    await AsyncStorage.setItem('accessToken', response.token);
  }
}

/** `POST /dual-profile/create` — creates the second-role profile. Response includes a fresh JWT
 * reflecting the new dual-profile claim; caller should also invalidate `ME_QUERY_KEY` afterward so
 * `useMe()` picks up the new state everywhere (Profile's identity card, TopBar avatar, etc.). */
export async function createDualProfile(payload: CreateDualProfileRequest) {
  const data = await apiClient
    .post<DualProfileMutationResponse>(DUAL_PROFILE_ENDPOINTS.CREATE, payload)
    .then(res => res.data);
  await applyRotatedToken(data);
  return data;
}

export type DualCheckResponse = {
  isDualIdNull: boolean;
};

/** `GET /dual-profile/dual-check` — `isDualIdNull: false` means the account already has a dual
 * profile. */
export async function checkDualProfile(): Promise<DualCheckResponse> {
  const data = await apiClient
    .get(DUAL_PROFILE_ENDPOINTS.DUAL_CHECK)
    .then(res => res.data);
  return { isDualIdNull: data?.is_dual_id_null ?? true };
}

/** `DELETE /dual-profile/delete` — same rotated-token handling as `createDualProfile`. */
export async function deleteDualProfile() {
  const data = await apiClient
    .delete<DualProfileMutationResponse>(DUAL_PROFILE_ENDPOINTS.DELETE)
    .then(res => res.data);
  await applyRotatedToken(data);
  return data;
}

/** `POST /dual-profile/switch` — flips which profile (primary/dual) is active. Called from
 * `ViewProfileScreen`'s `handleSwitchProfile`.
 *
 * Also rotates the FCM push token. Worth spelling out because it's counter-intuitive: an FCM
 * token belongs to the app INSTALL, not the user account, so switching profile rotates the JWT
 * here but would otherwise leave the device carrying the push identity of the profile just left.
 * Rotating keeps the two in step. Only `switch` does this — `createDualProfile`/`deleteDualProfile`
 * don't change which identity is active.
 *
 * Fire-and-forget by design: the switch has already succeeded by this point, and a failed token
 * rotation must not surface to the user as a failed switch. `rotateTokenForProfileSwitch` swallows
 * its own errors and logs them. */
export async function switchDualProfile() {
  const data = await apiClient
    .post<DualProfileMutationResponse>(DUAL_PROFILE_ENDPOINTS.SWITCH)
    .then(res => res.data);
  await applyRotatedToken(data);
  rotateTokenForProfileSwitch();
  return data;
}
