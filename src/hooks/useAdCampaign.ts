import { useCallback, useEffect, useState } from 'react';
import { fetchAdById } from '../api/adManagement';
import type { AdCampaign } from '../types/adManagement';

/** Single-campaign fetch for the detail/edit screens — `GET /ads/:id`. `error` is exposed
 * separately from `ad === null` (matches web's explicit "Error: {message}" / "Campaign not
 * found." states) so the screen can tell "still loading" apart from "fetch genuinely failed"
 * instead of silently rendering an empty header for both. */
export function useAdCampaign(adId: string) {
  const [ad, setAd] = useState<AdCampaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAdById(adId);
      setAd(result);
      if (!result) setError('Campaign not found.');
    } catch (err: any) {
      setAd(null);
      setError(err?.message || 'Failed to load campaign.');
    } finally {
      setIsLoading(false);
    }
  }, [adId]);

  useEffect(() => {
    load();
  }, [load]);

  return { ad, isLoading, error, refetch: load };
}
