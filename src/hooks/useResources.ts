import { useCallback, useEffect, useRef, useState } from 'react';
import { getMyResources, listResources } from '../api/resources';
import type { ResourceItem, ResourcesPagination } from '../types/resources';

const PAGE_LIMIT = 10;

export type ResourceFilters = {
  query: string;
  contentType: string | null;
  authorType: string | null;
  dateRange: string | null;
  sort: string;
};

const EMPTY_FILTERS: ResourceFilters = {
  query: '',
  contentType: null,
  authorType: null,
  dateRange: null,
  sort: 'newest',
};

export type MyResourceStats = {
  totalViews: number;
  totalDownloads: number;
  contributed: number;
};

const EMPTY_STATS: MyResourceStats = { totalViews: 0, totalDownloads: 0, contributed: 0 };

/** My Resources' "All Resources" list — mirrors `useDirectory.ts`'s exact shape (plain
 * `useState`/`useRef` page tracking, not `useQuery`; debounced query + a request-generation guard
 * so a slow, now-stale response can't clobber a newer one). Real backend params are each a single
 * value (`content_type`/`role_type`/`date_range`/`sort`/`q`), matching what `/resource/list`
 * actually supports (see the plan's mismatch #1) — every filter here is single-select. */
export function useResources() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [pagination, setPagination] = useState<ResourcesPagination | null>(null);
  const [myStats, setMyStats] = useState<MyResourceStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [filters, setFiltersState] = useState<ResourceFilters>(EMPTY_FILTERS);

  const pageRef = useRef(1);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const requestIdRef = useRef(0);

  // Query is debounced (300ms) separately from the other filters — those are discrete picks that
  // should apply immediately, a typed search shouldn't fire a network call per keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);
  const debouncedQueryRef = useRef(filters.query);
  debouncedQueryRef.current = debouncedQuery;
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(filters.query), 300);
    return () => clearTimeout(t);
  }, [filters.query]);

  const load = useCallback(async (page: number) => {
    const requestId = ++requestIdRef.current;
    if (page === 1) setIsLoading(true);
    else setIsLoadingMore(true);
    try {
      const f = filtersRef.current;
      const { resources: rows, pagination: pageInfo } = await listResources({
        query: debouncedQueryRef.current.trim() || undefined,
        contentType: f.contentType || undefined,
        authorType: f.authorType || undefined,
        dateRange: f.dateRange || undefined,
        sort: f.sort,
        page,
        limit: PAGE_LIMIT,
      });
      // A newer search/filter/page-load may have started (and finished) while this one was still
      // in flight — discard this now-stale response instead of clobbering fresher data.
      if (requestId !== requestIdRef.current) return;
      setResources(prev => (page === 1 ? rows : [...prev, ...rows]));
      setPagination(pageInfo);
    } catch {
      // Matches web's own console.error-and-stay-empty handling on list failure.
    } finally {
      if (requestId === requestIdRef.current) {
        if (page === 1) setIsLoading(false);
        else setIsLoadingMore(false);
      }
    }
  }, []);

  const refetch = useCallback(() => {
    pageRef.current = 1;
    load(1);
  }, [load]);

  // Fires on mount and whenever a filter actually changes (query only after its debounce
  // settles).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refetch, [debouncedQuery, filters.contentType, filters.authorType, filters.dateRange, filters.sort]);

  // Hero's "Downloaded/Contributed/Your views" stat strip — fired in parallel with, not blocking,
  // the list above, matching web's own separate fan-out timing.
  const loadMyStats = useCallback(() => {
    getMyResources()
      .then(({ resources: mine, totalViews, totalDownloads }) => {
        setMyStats({ totalViews, totalDownloads, contributed: mine.length });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadMyStats();
  }, [loadMyStats]);

  const loadMore = useCallback(() => {
    if (!pagination?.hasNextPage || isLoadingMore) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    load(nextPage);
  }, [pagination, isLoadingMore, load]);

  const setFilters = useCallback((patch: Partial<ResourceFilters>) => {
    setFiltersState(prev => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => setFiltersState(EMPTY_FILTERS), []);

  // "Confirmed-then-applied" local +1 bump after `trackView`/`trackDownload` resolves — not
  // blind-optimistic, matching web's own `handleView`/`handleDownload` (`page.tsx:493-514`)
  // exactly: a local increment off the previous count, gated on `!skipped`, not the server's
  // returned `viewCount`/`downloadCount` (web ignores those fields entirely).
  const incrementViewCount = useCallback((id: number) => {
    setResources(prev => prev.map(r => (r.id === id ? { ...r, view_count: (r.view_count || 0) + 1 } : r)));
  }, []);

  const incrementDownloadCount = useCallback((id: number) => {
    setResources(prev => prev.map(r => (r.id === id ? { ...r, download_count: (r.download_count || 0) + 1 } : r)));
  }, []);

  return {
    resources,
    pagination,
    myStats,
    isLoading,
    isLoadingMore,
    loadMore,
    refetch,
    refetchMyStats: loadMyStats,
    incrementViewCount,
    incrementDownloadCount,
    filters,
    setFilters,
    clearFilters,
  };
}
