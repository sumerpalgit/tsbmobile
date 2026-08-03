import { apiClient } from './client';
import { ETA_ENDPOINTS } from './endpoints';

export type EtaChapter = {
  id: string;
  name: string;
  description: string;
  groupImageUrl: string;
  location: string | null;
  memberCount: number;
};

function normalizeChapter(item: unknown): EtaChapter {
  const record = item as Record<string, unknown>;
  return {
    id: String(record?.id ?? ''),
    name: String(record?.name ?? ''),
    description: String(record?.description ?? ''),
    groupImageUrl: String(record?.group_image_url ?? record?.groupImageUrl ?? ''),
    location: (record?.location as string | null) ?? null,
    memberCount: Number(record?.memberCount ?? record?.member_count ?? 0),
  };
}

export type EtaChapterSuggestions = {
  suggested: EtaChapter[];
  others: EtaChapter[];
};

/** Matches webSrc's `join-eta-chapter` fetch flow: try the location/profile-scoped suggestions
 * endpoint first (requires auth + coordinates in profile), fall back to the flat all-chapters
 * list — sliced 8/rest, same as web — if that fails. */
export async function getSuggestedEtaChapters(): Promise<EtaChapterSuggestions> {
  try {
    const data = await apiClient.get(ETA_ENDPOINTS.SUGGESTIONS).then(res => res.data);
    return {
      suggested: (data?.suggested ?? []).map(normalizeChapter),
      others: (data?.others ?? []).map(normalizeChapter),
    };
  } catch {
    const all: EtaChapter[] = await apiClient
      .get(ETA_ENDPOINTS.ALL)
      .then(res => (res.data ?? []).map(normalizeChapter));
    return { suggested: all.slice(0, 8), others: all.slice(8) };
  }
}

export async function searchEtaChapters(query: string): Promise<EtaChapter[]> {
  const data = await apiClient
    .get(ETA_ENDPOINTS.SEARCH, { params: { query } })
    .then(res => res.data);
  return Array.isArray(data) ? data.map(normalizeChapter) : [];
}

export type BatchJoinResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  joinedChapters?: string[];
  pendingChapters?: { chapterId: string; accepted_at: string | null }[];
  failedChapters?: { chapterId: string; error: string }[];
};

/** Matches webSrc's `POST /api/eta/groups/batch-join` — the actual "join" action, called once
 * on Step 2's Continue (max 3 chapter IDs, enforced by `MAX_ETA_CHAPTERS`). */
export function batchJoinEtaChapters(chapterIds: string[]) {
  return apiClient
    .post<BatchJoinResponse>(ETA_ENDPOINTS.BATCH_JOIN, { chapterIds })
    .then(res => res.data);
}
