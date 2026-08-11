import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ResourceItem } from '../types/resources';

/** Matches web's real `localStorage["savedResources"]` key (`page.tsx:367-379`) — same name, this
 * app's `AsyncStorage` equivalent. Save/unsave is genuinely local-only on real web (no backend
 * call at all, see the plan's mismatch #3), so this is a faithful port, not an invented shortcut. */
const STORAGE_KEY = 'savedResources';

/** My Resources' "Saved" tab data source — 100% local, no network call, matching web's own
 * architecture exactly. Stores full `ResourceItem` objects (not just ids) so the Saved tab can
 * render without ever hitting the list endpoint again, same reason web does it this way. */
export function useSavedResources() {
  const [savedResources, setSavedResources] = useState<ResourceItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(stored => {
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setSavedResources(parsed);
      })
      .catch(() => {
        // A failed read just means Saved starts empty — not worth surfacing to the user.
      })
      .finally(() => setIsLoaded(true));
  }, []);

  const savedIds = useMemo(() => new Set(savedResources.map(r => r.id)), [savedResources]);

  const toggleSave = useCallback((item: ResourceItem) => {
    setSavedResources(prev => {
      const isSaved = prev.some(r => r.id === item.id);
      const next = isSaved ? prev.filter(r => r.id !== item.id) : [...prev, item];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {
        // Truly local storage — a failed write just means the toggle won't survive a reload;
        // no rollback needed since there's no server state to diverge from.
      });
      return next;
    });
  }, []);

  return { savedResources, savedIds, toggleSave, isLoaded };
}
