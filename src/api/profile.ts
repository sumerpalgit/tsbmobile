import { apiClient } from './client';
import { PROFILE_ENDPOINTS, UPLOAD_ENDPOINTS } from './endpoints';
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

/** The backend's MIME whitelist (`application/pdf` / `application/msword` /
 * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) matches these exact
 * strings. A browser's `<input type=file>` always reports the real one, which is why web works —
 * but `@react-native-documents/picker` can hand back an unreliable or generic `mimeType`
 * (`application/octet-stream`, or nothing at all) depending on the device/file manager the file
 * came from, and the backend then rejects it. Deriving from the file extension instead of
 * trusting the OS-reported type is the fix — matches what a browser does implicitly. */
function resolveDocumentMimeType(fileName: string, reportedMimeType: string | null): string {
  const ext = fileName.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'doc') return 'application/msword';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return reportedMimeType ?? 'application/octet-stream';
}

/** `POST /api/upload/document` (real endpoint confirmed by backend, 2026-08-13 — this was
 * previously wired to a nonexistent `/profile/upload-document`, same class of wrong-route bug as
 * the RSVP-cancel one, see `MY_ACTIVITY_ENDPOINTS.EVENT_RSVP`'s doc comment). Multipart
 * (`file` + `type`), returns `{ success, fileUrl }` — only `fileUrl` is embedded directly into
 * the role PUT payload. `fileType` is the document-category tag the backend expects exactly:
 * `cim`, `investment_criteria`, `pitch_deck`, `lending_criteria`, `credentials`, `resume`,
 * `cover_letter`, or the generic `other_document` fallback.
 *
 * `Content-Type: 'multipart/form-data'` IS set explicitly here (even with no boundary
 * parameter) — counter-intuitive, but required on this app's specific setup: `apiClient`
 * (`src/api/client.ts`) has an instance-level default `Content-Type: application/json`, and
 * axios's own `transformRequest` (`node_modules/axios/lib/defaults/index.js`) special-cases
 * exactly this combination — `FormData` body + a Content-Type that resolves to
 * `application/json` gets **JSON.stringified instead of sent as real multipart binary data**.
 * Omitting the header here (an earlier attempt at this fix) fell through to that instance
 * default and silently broke the upload — the backend's generic 500 was it receiving a JSON
 * blob where it expected multipart. Explicitly setting `multipart/form-data` avoids that branch;
 * React Native's own native networking layer fills in the real boundary regardless of the
 * JS-level header value, same as the other 3 upload call sites already doing this successfully
 * elsewhere in this app (`ai-assist.ts`/`events.ts`/`messages.ts`). */
export function uploadDocument(file: PickedFile, fileType: string) {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: resolveDocumentMimeType(file.name, file.mimeType),
  } as unknown as Blob);
  form.append('type', fileType);

  return apiClient
    .post<UploadDocumentResponse>(UPLOAD_ENDPOINTS.DOCUMENT, form, {
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
