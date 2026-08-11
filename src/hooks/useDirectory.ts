import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchDirectoryStats, fetchSavedContacts, searchDirectoryProfiles } from '../api/directory';
import type { DirectoryPagination, DirectorySort, DirectoryStats, Profile } from '../types/directory';
import type { CityResult } from '../api/location';

const PAGE_LIMIT = 24;

export type DirectoryFilters = {
  query: string;
  roleType: string | null;
  subCategory: string | null;
  city: CityResult | null;
};

const EMPTY_FILTERS: DirectoryFilters = { query: '', roleType: null, subCategory: null, city: null };

/** Directory's list data source — deliberately not a `useQuery`, mirrors `useMyEtaChapters.ts`'s
 * shape (plain `useState`/`useRef` page tracking, manual page-append on load-more, every filter
 * change resets to page 1). Web's own `roleType`/`subCategory`/`city`/`stateCode`/`countryCode`
 * search params are each a single value, not an array — despite the mockup's filter drawer
 * showing a multi-select checkbox grid for "User type", the real backend has no multi-role-type
 * search capability, so this hook (and the drawer built on top of it) is single-select for every
 * filter dimension, matching what `/profile/search` actually supports rather than building UI for
 * a capability that doesn't exist. The drawer's type grid and the horizontal role-chip row both
 * read/write the same single `roleType` state. */
export function useDirectory(groupId?: string) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [pagination, setPagination] = useState<DirectoryPagination | null>(null);
  const [stats, setStats] = useState<DirectoryStats>({ all: null, byRole: {} });
  const [savedUsernames, setSavedUsernames] = useState<Set<string>>(new Set());
  const [savedProfiles, setSavedProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  const [filters, setFiltersState] = useState<DirectoryFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<DirectorySort>('default');

  const pageRef = useRef(1);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const hasFocusedOnce = useRef(false);
  const requestIdRef = useRef(0);

  // Query is debounced (300ms) separately from role/sub-category/city — those are discrete picks
  // that should apply immediately, but a typed search was firing a network call per keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);
  const debouncedQueryRef = useRef(filters.query);
  debouncedQueryRef.current = debouncedQuery;
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(filters.query), 300);
    return () => clearTimeout(t);
  }, [filters.query]);

  const load = useCallback(
    async (page: number) => {
      const requestId = ++requestIdRef.current;
      if (page === 1) setIsLoading(true);
      else setIsLoadingMore(true);
      try {
        const f = filtersRef.current;
        const { profiles: rows, pagination: pageInfo } = await searchDirectoryProfiles({
          query: debouncedQueryRef.current.trim() || undefined,
          roleType: f.roleType || undefined,
          subCategory: f.subCategory || undefined,
          city: f.city?.city,
          stateCode: f.city?.stateCode,
          countryCode: f.city?.countryCode,
          groupId,
          page,
          limit: PAGE_LIMIT,
        });
        // A newer search/filter/page-load may have started (and finished) while this one was
        // still in flight — discard this now-stale response instead of clobbering fresher data.
        if (requestId !== requestIdRef.current) return;
        setProfiles(prev => (page === 1 ? rows : [...prev, ...rows]));
        setPagination(pageInfo);
      } catch {
        // Matches web's own console.error-and-stay-empty handling on search failure.
      } finally {
        if (requestId === requestIdRef.current) {
          if (page === 1) setIsLoading(false);
          else setIsLoadingMore(false);
        }
      }
    },
    [groupId],
  );

  const refetch = useCallback(() => {
    pageRef.current = 1;
    load(1);
  }, [load]);

  // Fires on mount and whenever a filter/sort actually changes (query only after its debounce
  // settles, so typing doesn't fire a fetch per keystroke).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(refetch, [debouncedQuery, filters.roleType, filters.subCategory, filters.city, groupId]);

  // Hero total + per-role-type chip counts — fired in parallel with (not blocking) the list
  // above; can arrive a beat after real results, matching web's own separate fan-out timing.
  useEffect(() => {
    fetchDirectoryStats(groupId).then(setStats);
  }, [groupId]);

  // The "Saved members" view is a real, independent list (`GET /saved-contacts`), not a filter of
  // whatever page of search results happens to be loaded — a saved member outside the currently
  // loaded/filtered page must still show up here.
  const loadSaved = useCallback(() => {
    setIsLoadingSaved(true);
    return fetchSavedContacts()
      .then(rows => {
        setSavedProfiles(rows);
        setSavedUsernames(new Set(rows.map(r => r.username)));
      })
      .catch(() => {})
      .finally(() => setIsLoadingSaved(false));
  }, []);

  useEffect(() => {
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) refetch();
      hasFocusedOnce.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const loadMore = useCallback(() => {
    if (!pagination?.hasNextPage || isLoadingMore) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    load(nextPage);
  }, [pagination, isLoadingMore, load]);

  const setFilters = useCallback((patch: Partial<DirectoryFilters>) => {
    setFiltersState(prev => ({ ...prev, ...patch }));
  }, []);

  const clearFilters = useCallback(() => setFiltersState(EMPTY_FILTERS), []);

  const sortedProfiles =
    sort === 'az' ? [...profiles].sort((a, b) => a.name.localeCompare(b.name)) : profiles;

  return {
    profiles: sortedProfiles,
    pagination,
    stats,
    savedUsernames,
    setSavedUsernames,
    savedProfiles,
    setSavedProfiles,
    isLoadingSaved,
    refetchSaved: loadSaved,
    isLoading,
    isLoadingMore,
    loadMore,
    refetch,
    filters,
    setFilters,
    clearFilters,
    sort,
    setSort,
  };
}
