import { apiClient } from './client';
import { PROFILE_ENDPOINTS } from './endpoints';

export type User = {
  id: string;
  email: string;
  name: string;
  username: string;
  profileImg: string;
  coverImg: string;
  /** Full DB profile record — shape varies by roleType, kept loose like the web client. */
  profile?: unknown;
};

/** Mirrors webSrc's `mapProfileToUser`: the backend has returned the profile under
 * `profile`, `data.profile`, `data` and `user` depending on the endpoint, so unwrap
 * defensively rather than assuming one shape. */
function mapProfileToUser(payload: any): User | null {
  if (!payload) return null;

  const dbProfile = payload.profile && typeof payload.profile === 'object' ? payload.profile : payload;

  return {
    id: payload.id ?? dbProfile.id,
    email: payload.email ?? dbProfile.email,
    name: payload.name ?? dbProfile.name ?? '',
    username: payload.username ?? dbProfile.username ?? '',
    profileImg: payload.profileImg ?? payload.profile_img ?? dbProfile.profile_img ?? '',
    coverImg: payload.coverImg ?? payload.cover_img ?? dbProfile.cover_img ?? '',
    profile: dbProfile,
  };
}

export async function getMe(): Promise<User | null> {
  const result = await apiClient.get(PROFILE_ENDPOINTS.ME).then(res => res.data);
  const payload = result?.profile ?? result?.data?.profile ?? result?.data ?? result?.user ?? null;
  return mapProfileToUser(payload);
}
