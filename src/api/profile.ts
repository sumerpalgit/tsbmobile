import { apiClient } from './client';
import { PROFILE_ENDPOINTS } from './endpoints';
import { normalizeProfile } from './directory';
import type { PickedFile } from '../components/FileUploadButton';
import type { Profile } from '../types/directory';

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

export type ProfileCompletion = {
  completionPercentage: number;
  filled: number;
  total: number;
};

/** Matches webSrc's `useProfileCompletion`: `GET /api/profile/completion` →
 * `{ completion_percentage, filled, total }`. Powers the Home feed's "Complete Your Profile"
 * banner (`ProfileCompletionCard`). */
export async function getProfileCompletion(): Promise<ProfileCompletion> {
  const result = await apiClient.get(PROFILE_ENDPOINTS.COMPLETION).then(res => res.data);
  return {
    completionPercentage: Number(result?.completion_percentage ?? 0),
    filled: Number(result?.filled ?? 0),
    total: Number(result?.total ?? 0),
  };
}

export type UploadDocumentResponse = {
  fileUrl: string;
};

/** Matches webSrc's `UnifiedRoleForm.tsx` `uploadFile`: `POST /api/profile/upload-document`,
 * multipart (`file` + `type`), returns `{ fileUrl }` to embed directly into the role PUT
 * payload. `fileType` is the same document-category tag web sends (`cim`, `resume`,
 * `pitch_deck`, `investment_criteria`, `lending_criteria`, `credentials`, `cover_letter`). */
export function uploadDocument(file: PickedFile, fileType: string) {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType ?? 'application/octet-stream',
  } as unknown as Blob);
  form.append('type', fileType);

  return apiClient
    .post<UploadDocumentResponse>(PROFILE_ENDPOINTS.UPLOAD_DOCUMENT, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then(res => res.data);
}

/** `GET /profile/username/:username` — matches web's real single-profile lookup
 * (`profiles/[username]/page.tsx:632-638`): `{ data: { profile, targetId, roleProfile } }`, with
 * the profile's real `id` coming from `targetId`, not the nested `profile` object (`setProfile({
 * ...json.data.profile, id: json.data.targetId })` on web). Powers "View profile" from a message
 * thread, navigating into the same `MemberProfileScreen` Directory already built. */
export async function fetchProfileByUsername(username: string): Promise<Profile> {
  const data = await apiClient.get(`${PROFILE_ENDPOINTS.BY_USERNAME}/${username}`).then(res => res.data);
  const raw = data?.data?.profile ?? data?.profile ?? {};
  return normalizeProfile({ ...raw, id: data?.data?.targetId ?? data?.targetId ?? raw?.id });
}

/** `PUT /profile/update-profile` — shared by Settings' Account and Profile tabs, each sending a
 * disjoint partial body (`{name,phone,phone_country,timezone}` vs `{name,bio,city,headline}`),
 * matching web's `handleSavePersonalInfo`/`handleSaveProfileForm` exactly (see
 * `PROFILE_ENDPOINTS.UPDATE`'s doc comment). */
export function updateProfile(payload: {
  name?: string;
  phone?: string;
  phone_country?: string;
  timezone?: string;
  bio?: string;
  city?: string;
  headline?: string;
}) {
  return apiClient.put(PROFILE_ENDPOINTS.UPDATE, payload).then(res => res.data);
}

/** `PUT /profile/update-profile-image` — called after a direct-to-Supabase upload resolves a
 * public URL (`uploadFileDirectToSupabase`, `src/api/supabaseDirectUpload.ts`), matching web's
 * `updateProfileImage` server action. */
export function updateProfileImage(imageUrl: string) {
  return apiClient.put(PROFILE_ENDPOINTS.UPDATE_PROFILE_IMAGE, { imageUrl }).then(res => res.data);
}

/** `PUT /profile/update-cover-image` — same pattern as `updateProfileImage` above. */
export function updateCoverImage(imageUrl: string) {
  return apiClient.put(PROFILE_ENDPOINTS.UPDATE_COVER_IMAGE, { imageUrl }).then(res => res.data);
}
