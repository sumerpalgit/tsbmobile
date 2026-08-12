import { useCallback, useEffect, useState } from 'react';
import { fetchAdById } from '../api/adManagement';
import type { AdCampaign } from '../types/adManagement';

/** Single-campaign fetch for the detail/edit screens — `GET /ads/:id`. */
export function useAdCampaign(adId: string) {
  const [ad, setAd] = useState<AdCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setAd(await fetchAdById(adId));
    } catch {
      setAd(null);
    } finally {
      setIsLoading(false);
    }
  }, [adId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ad, isLoading, refetch: load };
}
