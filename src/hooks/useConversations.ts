import { useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { fetchConversations } from '../api/messages';
import { CONVERSATIONS_QUERY_KEY } from '../api/queryKeys';
import { useAuth } from '../store/AuthContext';

/** Messages' conversation list — same shape as `useMyEvents.ts`/`useAiConversations.ts` (single
 * `useQuery`, refetch-on-focus with a `hasFocusedOnce` guard). The open thread's live message
 * list is NOT cached here — it's local state on `MessagesScreen`, updated both by REST fetch and
 * by the WebSocket's `NEW_MESSAGE` push, same reasoning as AI Assist's streaming transcript not
 * living in react-query. */
export function useConversations() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: fetchConversations,
    enabled: isAuthenticated,
  });

  const { refetch } = query;
  const hasFocusedOnce = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasFocusedOnce.current) {
        refetch();
      }
      hasFocusedOnce.current = true;
    }, [refetch]),
  );

  return {
    conversations: query.data ?? [],
    isLoading: query.isLoading,
    refetch,
  };
}
