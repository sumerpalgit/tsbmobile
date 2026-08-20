import { apiClient } from './client';
import { PROFILE_OVERVIEW_ENDPOINTS, WORK_EXPERIENCE_ENDPOINTS, EDUCATION_ENDPOINTS } from './endpoints';

/** Matches `webSrc/app/dashboard/my-profile/page.tsx:2539-2774` exactly — a standalone record,
 * distinct from the onboarding-role `designation`/`organization` fields `PROFILE_ENDPOINTS.UPDATE`
 * edits. Always shown as an editable form on web (no separate view/edit toggle), so mobile does
 * the same. */
export type CurrentOrganization = {
  org_name: string;
  org_role: string;
  org_website: string;
  calendly_link: string;
  credentials_deck_url: string;
};

const EMPTY_CURRENT_ORGANIZATION: CurrentOrganization = {
  org_name: '',
  org_role: '',
  org_website: '',
  calendly_link: '',
  credentials_deck_url: '',
};

/** `GET /profile/current-organization` — 404s/empty response before the user has ever saved one,
 * treated the same as an empty record rather than an error (matches web's own fallback). */
export async function fetchCurrentOrganization(): Promise<CurrentOrganization> {
  const d = await apiClient
    .get(PROFILE_OVERVIEW_ENDPOINTS.CURRENT_ORGANIZATION)
    .then(res => res.data)
    .catch(() => null);
  if (!d) return EMPTY_CURRENT_ORGANIZATION;
  return {
    org_name: d.org_name ?? '',
    org_role: d.org_role ?? '',
    org_website: d.org_website ?? '',
    calendly_link: d.calendly_link ?? '',
    credentials_deck_url: d.credentials_deck_url ?? '',
  };
}

/** `PUT /profile/current-organization` — web sends all 5 fields on every save regardless of which
 * changed (`handleSave`'s single request body), mirrored here rather than diffing. */
export function updateCurrentOrganization(payload: CurrentOrganization) {
  return apiClient.put(PROFILE_OVERVIEW_ENDPOINTS.CURRENT_ORGANIZATION, payload).then(res => res.data);
}

/** Matches `webSrc/app/dashboard/my-profile/page.tsx:1133-1210`'s `SuggestedConnectionsCard` —
 * a real, purpose-built recommendation endpoint (not a generic search), read-only, no
 * Connect/Follow action anywhere on it. */
export type SuggestedConnection = {
  username: string;
  name: string;
  role_type: string | null;
  profile_img: string | null;
};

function normalizeSuggestedConnection(item: unknown): SuggestedConnection {
  const r = item as Record<string, unknown>;
  return {
    username: String(r?.username ?? ''),
    name: String(r?.name ?? ''),
    role_type: (r?.role_type as string | null) ?? null,
    profile_img: (r?.profile_img as string | null) ?? null,
  };
}

/** `GET /profile/suggested-connections` — response envelope varies (`res.data || res.suggestions
 * || res.users`, matching web's own defensive unwrap), so try all three. */
export async function fetchSuggestedConnections(): Promise<SuggestedConnection[]> {
  const data = await apiClient.get(PROFILE_OVERVIEW_ENDPOINTS.SUGGESTED_CONNECTIONS).then(res => res.data).catch(() => null);
  const list: unknown[] = Array.isArray(data) ? data : data?.data ?? data?.suggestions ?? data?.users ?? [];
  return Array.isArray(list) ? list.map(normalizeSuggestedConnection).filter(c => c.username) : [];
}

/** Matches `webSrc/app/dashboard/my-profile/page.tsx:2231-2536`'s Experience CRUD
 * (`/api/work-experience/*`). Web's Add flow is a 3-step wizard, Edit is single-step — confirmed
 * intentional on web itself, not a mockup-only quirk, kept as-is. No blocking client-side
 * validation on save (unlike Education below). */
export type WorkExperienceEntry = {
  id: string;
  organization_name: string;
  job_title: string;
  is_current: boolean;
  start_month: string;
  start_year: string;
  end_month: string;
  end_year: string;
  description: string;
};

function normalizeWorkExperience(item: unknown): WorkExperienceEntry {
  const r = item as Record<string, unknown>;
  return {
    id: String(r?.id ?? ''),
    organization_name: String(r?.organization_name ?? ''),
    job_title: String(r?.job_title ?? ''),
    is_current: Boolean(r?.is_current),
    start_month: String(r?.start_month ?? ''),
    start_year: String(r?.start_year ?? ''),
    end_month: String(r?.end_month ?? ''),
    end_year: String(r?.end_year ?? ''),
    description: String(r?.description ?? ''),
  };
}

/** `GET /work-experience/my` — response envelope varies (`res.work_experience || res.data ||
 * res.experiences || res`, matching web's own defensive unwrap). */
export async function fetchMyWorkExperience(): Promise<WorkExperienceEntry[]> {
  const data = await apiClient.get(WORK_EXPERIENCE_ENDPOINTS.MY).then(res => res.data).catch(() => null);
  const list: unknown[] = Array.isArray(data)
    ? data
    : data?.work_experience ?? data?.data ?? data?.experiences ?? [];
  return Array.isArray(list) ? list.map(normalizeWorkExperience) : [];
}

export type WorkExperiencePayload = Omit<WorkExperienceEntry, 'id'>;

/** `POST /work-experience/add`. */
export function addWorkExperience(payload: WorkExperiencePayload) {
  return apiClient.post(WORK_EXPERIENCE_ENDPOINTS.ADD, payload).then(res => res.data);
}

/** `PUT /work-experience/:id`. */
export function updateWorkExperience(id: string, payload: WorkExperiencePayload) {
  return apiClient.put(`${WORK_EXPERIENCE_ENDPOINTS.BASE}/${id}`, payload).then(res => res.data);
}

/** `DELETE /work-experience/:id`. */
export function deleteWorkExperience(id: string) {
  return apiClient.delete(`${WORK_EXPERIENCE_ENDPOINTS.BASE}/${id}`).then(res => res.data);
}

/** Matches `webSrc/app/dashboard/my-profile/page.tsx:717-1123`'s Education CRUD
 * (`/api/education/*`). Web sends `field_of_study` as an empty string on every save — its own UI
 * never collects it despite the type having the field — mirrored here rather than second-guessing
 * it. This is the one CRUD card here with real client-side validation on web: "School and Degree
 * are required." blocks save. */
export type EducationEntry = {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string;
  start_year: string;
  end_year: string;
  is_current: boolean;
};

function normalizeEducation(item: unknown): EducationEntry {
  const r = item as Record<string, unknown>;
  return {
    id: String(r?.id ?? ''),
    institution_name: String(r?.institution_name ?? ''),
    degree: String(r?.degree ?? ''),
    field_of_study: String(r?.field_of_study ?? ''),
    start_year: String(r?.start_year ?? ''),
    end_year: String(r?.end_year ?? ''),
    is_current: Boolean(r?.is_current),
  };
}

/** `GET /education/my` — same defensive-envelope handling as `fetchMyWorkExperience`. Falls back
 * to an empty list (not a synthetic role-onboarding-derived entry like web does) — that fallback
 * reads from `roleProfile` fields mobile doesn't fetch on this screen, and the resulting entry has
 * no `id` anyway (renders with no edit/delete icons on web), so an honest empty list here is
 * simpler and no less correct. */
export async function fetchMyEducation(): Promise<EducationEntry[]> {
  const data = await apiClient.get(EDUCATION_ENDPOINTS.MY).then(res => res.data).catch(() => null);
  const list: unknown[] = Array.isArray(data) ? data : data?.education ?? data?.data ?? [];
  return Array.isArray(list) ? list.map(normalizeEducation) : [];
}

export type EducationPayload = Omit<EducationEntry, 'id'>;

/** `POST /education/add`. */
export function addEducation(payload: EducationPayload) {
  return apiClient.post(EDUCATION_ENDPOINTS.ADD, payload).then(res => res.data);
}

/** `PUT /education/:id`. */
export function updateEducation(id: string, payload: EducationPayload) {
  return apiClient.put(`${EDUCATION_ENDPOINTS.BASE}/${id}`, payload).then(res => res.data);
}

/** `DELETE /education/:id`. */
export function deleteEducation(id: string) {
  return apiClient.delete(`${EDUCATION_ENDPOINTS.BASE}/${id}`).then(res => res.data);
}
