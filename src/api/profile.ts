import { apiClient } from './client';
import { PROFILE_ENDPOINTS } from './endpoints';
import type { PickedFile } from '../components/FileUploadButton';

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
