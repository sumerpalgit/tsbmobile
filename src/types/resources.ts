/** Matches webSrc's real `ResourceItem` (`src/actions/my-resources.ts:166-181`) verbatim, minus
 * `eta_phase` — present in the real type but never read anywhere in `page.tsx`, a dead field on
 * web itself. */
export type ResourceItem = {
  id: number;
  title: string;
  description: string;
  resource_link: string | null;
  file_url: string | null;
  download_count: number;
  view_count: number;
  content_type: string;
  created_at: string;
  author_id?: string;
  author_name?: string | null;
  author_username?: string | null;
  author_img?: string | null;
};

/** Matches the real `GET /resource/list` response's pagination fields
 * (`ResourcesResponse`, `my-resources.ts:156-164`), normalized into this app's existing
 * `DirectoryPagination` shape (`hasNextPage`/`hasPrevPage` derived from `page`/`totalPages`, since
 * the real response doesn't carry those two booleans directly — see `normalizeResourcesResponse`
 * in `api/resources.ts`). */
export type ResourcesPagination = {
  currentPage: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

/** Hardcoded frontend constant on web too (`page.tsx:31`) — not fetched from any API. */
export const CONTENT_TYPES = ['Articles', 'Checklists', 'Templates', 'Tools', 'Case Studies'] as const;

/** Hardcoded frontend constant on web too (`page.tsx:42-49`), labeled "Author Type" in the UI but
 * sent to the backend as the `role_type` param — a real naming mismatch on web itself, preserved
 * here rather than "fixed" since the wire value is what actually matters. */
export const RESOURCE_AUTHOR_TYPES: { value: string; label: string }[] = [
  { value: 'tsb_original', label: 'TSB Original' },
  { value: 'community', label: 'Community' },
  { value: 'advisor', label: 'Advisors' },
  { value: 'lender', label: 'Lenders' },
  { value: 'searcher', label: 'Searchers' },
];

/** Matches web's real `DateRange` values (`my-resources.ts`'s `date_range` param) — mockup labels
 * mapped onto the real wire values (`3m`→`3months` etc.), not the mockup's own local keys. */
export const DATE_RANGES: { value: string; label: string }[] = [
  { value: '', label: 'Any time' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: '3months', label: 'Last 3 months' },
  { value: 'year', label: 'This year' },
];

/** Web's real `sort` param + exact label wording, ported verbatim from `page.tsx:311-319`
 * (`SortKey`/its label map) — all 5 real options, not just the 2 the mockup's own demo UI
 * happened to design for. The mockup's radio-row treatment already scales to any option count, so
 * this only meant supplying the other 3 real values, not redesigning anything. */
export const RESOURCE_SORTS: { value: string; label: string }[] = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'most_downloaded', label: 'Most Downloaded' },
];

/** A resource is "Hot" once its download count crosses the same threshold real web uses
 * (`page.tsx:68`, `download_count > 50`) — real, data-driven, not a mockup fabrication. */
export function isHotResource(item: ResourceItem): boolean {
  return item.download_count > 50;
}
