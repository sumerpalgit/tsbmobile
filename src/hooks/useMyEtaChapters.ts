import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyEtaChapters } from '../api/eta';
import { useAuth } from '../store/AuthContext';
import type { ChapterPagination, EtaGroup } from '../types/etaChapters';

export type EtaChapterTab = 'local' | 'international';

/**
 * ETA Chapters' list data source — deliberately NOT a `useQuery` (unlike `useConversations.ts`/
 * `useMyEvents.ts`) because web's own `fetchChapters` (`my-eta-chapters/page.tsx:495-524`) isn't
 * a simple key-based fetch: it's page-appending (load-more), carries a cross-call caching
 * optimization (`joinedCountryCodes`/`memberIds` from the first fetch skip a redundant
 * membership query on every subsequent page/tab change), and a separate one-off count-only
 * fetch for the inactive tab's badge. Plain state + refs mirrors web's own closures more
 * faithfully than forcing this into react-query's cache-key model — same reasoning
 * `MessagesScreen.tsx` already applies to its own chat pagination.
 */
export function useMyEtaChapters() {
  const { isAuthenticated } = useAuth();

  const [tab, setTabState] = useState<EtaChapterTab>('local');
  const [myChapters, setMyChapters] = useState<EtaGroup[]>([]);
  const [chapters, setChapters] = useState<EtaGroup[]>([]);
  const [pagination, setPagination] = useState<ChapterPagination | null>(null);
  const [tabCounts, setTabCounts] = useState<{ local: number | null; international: number | null }>({
    local: null,
    international: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  // Mockup labels the Local tab "Local · India" — real, not hardcoded: derived from the local
  // tab's own returned chapters (the backend already scopes "local" to the user's country, so
  // every local-tab chapter shares one `countryCode`), not a guess at an unreliable profile field.
  const [localCountryName, setLocalCountryName] = useState<string | null>(null);

  const pageRef = useRef(1);
  const joinedCountryCodesRef = useRef<string[]>([]);
  const myChaptersRef = useRef<EtaGroup[]>([]);
  const hasFocusedOnce = useRef(false);

  const loadTab = useCallback(
    async (page: number, targetTab: EtaChapterTab, opts?: { isInitial?: boolean; countOnly?: boolean }) => {
      const countOnly = opts?.countOnly ?? false;
      const isInitial = opts?.isInitial ?? false;
      if (!countOnly) setIsLoading(true);
      try {
        const params: Parameters<typeof fetchMyEtaChapters>[0] = {
          page,
          limit: countOnly ? 1 : 12,
          tab: targetTab,
        };
        if (!isInitial && (joinedCountryCodesRef.current.length > 0 || myChaptersRef.current.length > 0)) {
          if (joinedCountryCodesRef.current.length > 0) {
            params.countries = joinedCountryCodesRef.current.join(',');
          }
          if (myChaptersRef.current.length > 0) {
            params.memberIds = myChaptersRef.current.map(c => c.id).join(',');
          }
          params.skipMyChapters = true;
        }

        const data = await fetchMyEtaChapters(params);

        if (!countOnly) {
          if (!params.skipMyChapters && data.myChapters) {
            myChaptersRef.current = data.myChapters;
            setMyChapters(data.myChapters);
          }
          setChapters(prev => (page === 1 ? data.chapters : [...prev, ...data.chapters]));
          setPagination(data.pagination);
          if (data.joinedCountryCodes) joinedCountryCodesRef.current = data.joinedCountryCodes;
          if (targetTab === 'local') {
            const countryFromChapters = data.chapters.find(c => c.countryCode)?.countryCode;
            if (countryFromChapters) setLocalCountryName(countryFromChapters);
          }
        }
        if (data.pagination?.totalCount != null) {
          setTabCounts(prev => ({ ...prev, [targetTab]: data.pagination!.totalCount }));
        }
      } catch {
        // Matches web's own `console.error`-and-stay-empty handling — no toast, the list/empty
        // state just doesn't populate.
      } finally {
        if (!countOnly) setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated) return;
    pageRef.current = 1;
    loadTab(1, 'local', { isInitial: true });
    loadTab(1, 'international', { isInitial: true, countOnly: true });
    // Fires once when auth becomes ready, matching web's own mount-time `fetchData` + count-only
    // international fetch — `loadTab` is intentionally omitted, it's stable (empty dep array).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const setTab = useCallback(
    (next: EtaChapterTab) => {
      setTabState(next);
      pageRef.current = 1;
      loadTab(1, next);
    },
    [loadTab],
  );

  const loadMore = useCallback(() => {
    if (!pagination?.hasNextPage) return;
    const nextPage = pageRef.current + 1;
    pageRef.current = nextPage;
    loadTab(nextPage, tab);
  }, [pagination, tab, loadTab]);

  /** `forceFull` bypasses the `skipMyChapters` caching optimization above for this one call —
   * needed after join/leave/replace, where `myChapters` has genuinely changed and the cached
   * assumption backing that optimization no longer holds. Without this, `myChapters` silently
   * stays stale after a successful join once the user already has ≥1 chapter (confirmed as a
   * real bug ported faithfully from web's own `fetchData()` → `fetchChapters()`, which has the
   * identical gap — fixed here rather than replicated, same precedent as the Messages caption
   * bug). Routine tab switches/pagination don't need this — membership hasn't changed there. */
  const refetch = useCallback(
    (forceFull = false) => {
      pageRef.current = 1;
      loadTab(1, tab, forceFull ? { isInitial: true } : undefined);
    },
    [tab, loadTab],
  );

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) refetch();
      hasFocusedOnce.current = true;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run on focus, not on every `refetch` identity change.
    }, []),
  );

  return {
    tab,
    setTab,
    myChapters,
    chapters,
    pagination,
    tabCounts,
    localCountryName,
    isLoading,
    loadMore,
    refetch,
  };
}
