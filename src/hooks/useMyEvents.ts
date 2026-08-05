import { useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { fetchMyEvents, fetchSavedEvents } from '../api/events';
import { MY_EVENTS_QUERY_KEY, SAVED_EVENTS_QUERY_KEY } from '../api/queryKeys';
import { useAuth } from '../store/AuthContext';

/** Matches web's `SAVED_POSTS` page size (`page=1&limit=100`) — My Events fetches every saved
 * event in one page, no pagination UI, same as web. */
const SAVED_EVENTS_LIMIT = 100;

/** My Events' combined data source — mirrors web's single `fetchAllData` effect
 * (`my-events/page.tsx`), which fires both `/api/event/filter-list` and
 * `/api/my-activity/saved-posts` together on mount. Two separate `useQuery`s (not one) so a
 * save-toggle can invalidate just `SAVED_EVENTS_QUERY_KEY` without refetching the larger events
 * list, and vice versa for RSVP.
 *
 * Refetches on every focus of the My Events drawer screen, not just first mount — same reasoning
 * and `hasFocusedOnce` skip-first-focus guard as `useHomeFeed.ts`. */
export function useMyEvents() {
  const { isAuthenticated } = useAuth();

  const eventsQuery = useQuery({
    queryKey: MY_EVENTS_QUERY_KEY,
    queryFn: fetchMyEvents,
    enabled: isAuthenticated,
  });

  const savedQuery = useQuery({
    queryKey: SAVED_EVENTS_QUERY_KEY,
    queryFn: () => fetchSavedEvents(1, SAVED_EVENTS_LIMIT),
    enabled: isAuthenticated,
  });

  const { refetch: refetchEvents } = eventsQuery;
  const { refetch: refetchSaved } = savedQuery;
  const hasFocusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) {
        refetchEvents();
        refetchSaved();
      }
      hasFocusedOnce.current = true;
    }, [refetchEvents, refetchSaved]),
  );

  return {
    events: eventsQuery.data?.allEvents ?? [],
    rsvpEvents: eventsQuery.data?.userRsvpEvents ?? [],
    userCreatedEvents: eventsQuery.data?.userCreatedEvents ?? [],
    savedEvents: savedQuery.data ?? [],
    isLoading: eventsQuery.isLoading || savedQuery.isLoading,
    refetch: useCallback(() => {
      refetchEvents();
      refetchSaved();
    }, [refetchEvents, refetchSaved]),
  };
}
