import { useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';
import { fetchAiConversations } from '../api/ai-assist';
import { AI_CONVERSATIONS_QUERY_KEY } from '../api/queryKeys';
import { useAuth } from '../store/AuthContext';

/** AI Assist's conversation list — mirrors `useMyEvents.ts`'s shape (single `useQuery`,
 * refetch-on-focus with a `hasFocusedOnce` guard so it doesn't double-fire on first mount). The
 * live transcript of whichever conversation is open is NOT cached here — it's local state on
 * `AiAssistScreen` (a streaming SSE transcript isn't a cacheable GET resource, matching how
 * webSrc itself treats it — only the conversation list is a plain `useQuery`). */
export function useAiConversations() {
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: AI_CONVERSATIONS_QUERY_KEY,
    queryFn: fetchAiConversations,
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
