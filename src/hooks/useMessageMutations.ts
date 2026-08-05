import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markConversationRead, startConversation } from '../api/messages';
import { CONVERSATIONS_QUERY_KEY } from '../api/queryKeys';
import type { Conversation } from '../types/messages';

/** Messages' write operations — mark-read and start-a-new-conversation. Matches
 * `useAiConversationMutations.ts`'s conventions (optimistic cache writes where web is
 * optimistic, invalidate/refetch otherwise) — no `Toast.show` on error for either of these,
 * because web itself has none (`markAsRead` only `console.error`s, `startConversationWith`
 * likewise) — don't invent user-facing error UX web doesn't have. */
export function useMessageMutations() {
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onMutate: async (conversationId: string) => {
      await queryClient.cancelQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY);
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) =>
        old.map(c => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, context.previous);
    },
  });

  const startConversationMutation = useMutation({
    mutationFn: ({ username }: { username: string; name: string; profileImg?: string | null }) =>
      startConversation(username),
    onSuccess: (conversationId, { name, profileImg }) => {
      queryClient.setQueryData<Conversation[]>(CONVERSATIONS_QUERY_KEY, (old = []) => {
        if (old.some(c => c.id === conversationId)) return old;
        const placeholder: Conversation = {
          id: conversationId,
          name,
          profileImg: profileImg ?? null,
          latestMessage: null,
          participantId: conversationId,
          unreadCount: 0,
        };
        return [placeholder, ...old];
      });
    },
  });

  return {
    markRead: markReadMutation.mutate,
    startConversation: startConversationMutation.mutateAsync,
    isStartingConversation: startConversationMutation.isPending,
  };
}
