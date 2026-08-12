import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMyAds } from '../api/adManagement';
import { deriveStatus, matchesAdFilters, EMPTY_AD_FILTERS, aggregateKpis } from '../types/adManagement';
import type { AdCampaign, AdFilters, AdStatus } from '../types/adManagement';

/** `GET /ads/my-ads` has no server params at all (confirmed reading `actions/ad-management.ts` in
 * full) — real web fetches the whole account once and does every filter/search/status-tab
 * client-side over that one array, so this hook does the same rather than inventing pagination
 * that doesn't exist. Matches `useDirectory.ts`'s general shape (state + refetch), minus the
 * page-append machinery that hook needs and this one doesn't. */
export function useAdCampaigns() {
  const [ads, setAds] = useState<AdCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFiltersState] = useState<AdFilters>(EMPTY_AD_FILTERS);
  const [statusTab, setStatusTab] = useState<AdStatus | 'all'>('all');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setAds(await fetchMyAds());
    } catch {
      setAds([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setFilters = (patch: Partial<AdFilters>) => setFiltersState(prev => ({ ...prev, ...patch }));
  const clearFilters = () => setFiltersState(EMPTY_AD_FILTERS);

  // The status tab row (All/Active/In Review/Paused/Draft/Ended) and the filter sheet's own
  // status checkboxes both narrow by status — matching web's real behavior, a tab pick and a
  // sheet pick are the same underlying `statuses[]` filter, just two different entry points into
  // it, so the tab is folded into the same `matchesAdFilters` call rather than a second pass.
  const effectiveFilters: AdFilters = useMemo(
    () => ({
      ...filters,
      statuses: statusTab === 'all' ? filters.statuses : [statusTab],
    }),
    [filters, statusTab],
  );

  const filteredAds = useMemo(() => ads.filter(ad => matchesAdFilters(ad, effectiveFilters)), [ads, effectiveFilters]);

  const statusCounts = useMemo(() => {
    const counts: Record<AdStatus, number> = { active: 0, review: 0, paused: 0, draft: 0, ended: 0 };
    ads.forEach(ad => {
      counts[deriveStatus(ad)] += 1;
    });
    return counts;
  }, [ads]);

  const kpis = useMemo(() => aggregateKpis(ads), [ads]);

  const activeFilterCount = [
    ...filters.statuses,
    ...filters.placements,
    filters.minBudget,
    filters.maxBudget,
    filters.startAfter,
    filters.endBefore,
  ].filter(Boolean).length;

  return {
    ads,
    filteredAds,
    isLoading,
    refetch: load,
    filters,
    setFilters,
    clearFilters,
    activeFilterCount,
    statusTab,
    setStatusTab,
    statusCounts,
    kpis,
  };
}
