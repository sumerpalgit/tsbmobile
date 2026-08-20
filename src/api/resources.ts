import { apiClient } from './client';
import { RESOURCE_ENDPOINTS } from './endpoints';
import type { ResourceItem, ResourcesPagination } from '../types/resources';

function normalizeResource(item: unknown): ResourceItem {
  const r = item as Record<string, unknown>;
  return {
    id: Number(r?.id),
    title: String(r?.title ?? ''),
    description: String(r?.description ?? ''),
    resource_link: (r?.resource_link as string | null) ?? null,
    file_url: (r?.file_url as string | null) ?? null,
    download_count: Number(r?.download_count ?? 0),
    view_count: Number(r?.view_count ?? 0),
    content_type: String(r?.content_type ?? ''),
    created_at: String(r?.created_at ?? ''),
    author_id: r?.author_id as string | undefined,
    author_name: (r?.author_name as string | null) ?? null,
    author_username: (r?.author_username as string | null) ?? null,
    author_img: (r?.author_img as string | null) ?? null,
  };
}

/** Real response (`ResourcesResponse`, `my-resources.ts:156-164`) is a flat `{page, totalPages}`
 * shape, not `hasNextPage`/`hasPrevPage` booleans — derived here so every list hook in this app
 * (`useDirectory.ts`, `useMyEtaChapters.ts`, this one) reads the same pagination shape. */
function normalizePagination(data: Record<string, unknown>): ResourcesPagination {
  const page = Number(data?.page ?? 1);
  const totalPages = Number(data?.totalPages ?? 1);
  return {
    currentPage: page,
    totalPages,
    totalItems: Number(data?.total ?? 0),
    itemsPerPage: Number(data?.limit ?? 0),
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

export type ListResourcesParams = {
  page: number;
  limit: number;
  contentType?: string;
  query?: string;
  sort?: string;
  dateRange?: string;
  authorType?: string;
};

/** `GET /resource/list` — matches web's `listResources` (`actions/my-resources.ts:183-202`).
 * `authorType` is sent as the `role_type` param, matching web's own real (if confusingly-named)
 * wire param. */
export async function listResources(
  params: ListResourcesParams,
): Promise<{ resources: ResourceItem[]; pagination: ResourcesPagination }> {
  const data = await apiClient
    .get(RESOURCE_ENDPOINTS.LIST, {
      params: {
        page: params.page,
        limit: params.limit,
        content_type: params.contentType || undefined,
        q: params.query || undefined,
        sort: params.sort || undefined,
        date_range: params.dateRange || undefined,
        role_type: params.authorType || undefined,
      },
    })
    .then(res => res.data);

  const rows = Array.isArray(data?.resources) ? data.resources : [];
  return {
    resources: rows.map(normalizeResource),
    pagination: normalizePagination(data ?? {}),
  };
}

/** `GET /resource/my` — matches web's `getMyResources` (`actions/my-resources.ts:204-206`).
 * Powers the hero's "Downloaded/Contributed/Your views" stat strip — `contributed` is
 * `resources.length`, matching web's own `myContributed = getMyResources().resources.length`. */
export async function getMyResources(): Promise<{ resources: ResourceItem[]; totalViews: number; totalDownloads: number }> {
  const data = await apiClient.get(RESOURCE_ENDPOINTS.MY).then(res => res.data);
  const rows = Array.isArray(data?.resources) ? data.resources : [];
  return {
    resources: rows.map(normalizeResource),
    totalViews: Number(data?.totalViews ?? 0),
    totalDownloads: Number(data?.totalDownloads ?? 0),
  };
}

export type CreateResourcePayload = {
  title: string;
  description: string;
  contentType: string;
  authorSource: string;
  resourceLink?: string;
  fileUrl?: string;
};

/** `POST /resource/create` — matches web's `createResource` (`actions/my-resources.ts:208-220`).
 * Web's own form collects `author_source` but never actually sends it (a real bug in
 * `page.tsx:219-225`) — sent here anyway since omitting it looks unintentional, not deliberate. */
export function createResource(payload: CreateResourcePayload) {
  return apiClient
    .post(RESOURCE_ENDPOINTS.CREATE, {
      title: payload.title,
      description: payload.description,
      content_type: payload.contentType,
      author_source: payload.authorSource,
      resource_link: payload.resourceLink || undefined,
      file_url: payload.fileUrl || undefined,
    })
    .then(res => res.data);
}

/** `POST /resource/download/:id` — matches web's `trackDownload` (`actions/my-resources.ts:222-226`).
 * "Confirmed-then-applied" — the caller only bumps its local `download_count` once this resolves
 * and `skipped` isn't true, not blind-optimistically, matching web's own `handleDownload`. */
export function trackDownload(id: number): Promise<{ fileUrl?: string; downloadCount?: number; skipped?: boolean }> {
  return apiClient.post(`${RESOURCE_ENDPOINTS.DOWNLOAD}/${id}`).then(res => res.data);
}

/** `POST /resource/view/:id` — matches web's `trackView` (`actions/my-resources.ts:228-232`). */
export function trackView(id: number): Promise<{ viewCount?: number; skipped?: boolean }> {
  return apiClient.post(`${RESOURCE_ENDPOINTS.VIEW}/${id}`).then(res => res.data);
}

/** `DELETE /resource/delete/:id` — matches web's `ResourcesSection.tsx` own-resource delete
 * call. Powers View Profile's Resources tab (Phase 5) "My Contributions" delete action. */
export function deleteResource(id: number) {
  return apiClient.delete(`${RESOURCE_ENDPOINTS.DELETE}/${id}`).then(res => res.data);
}
