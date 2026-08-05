import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  deleteAiConversation,
  reactToAiMessage,
  shareAiConversation,
  summariseAiMessage,
  updateAiConversation,
} from '../api/ai-assist';
import { AI_CONVERSATIONS_QUERY_KEY } from '../api/queryKeys';
import type { MessageReaction } from '../types/ai-assist';

/** AI Assist's write operations — rename/delete/bookmark a conversation, react to and summarise a
 * message, generate a share link. Same invalidate-on-success + `Toast.show`-on-error convention
 * `useEventMutations.ts` established as this app's first `useMutation` usage. Message reactions
 * are optimistic (the like/dislike button needs to flip instantly, same reasoning as that file's
 * `saveMutation`) — everything else awaits the round trip since there's no local list entry to
 * update ahead of it. */
export function useAiConversationMutations() {
  const queryClient = useQueryClient();
  const invalidateConversations = () =>
    queryClient.invalidateQueries({ queryKey: AI_CONVERSATIONS_QUERY_KEY });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateAiConversation(id, { title }),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Chat renamed ✓' });
      invalidateConversations();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to rename chat', text2: 'Please try again.' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAiConversation(id),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Chat deleted' });
      invalidateConversations();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to delete chat', text2: 'Please try again.' }),
  });

  const toggleSaveMutation = useMutation({
    mutationFn: ({ id, isSaved }: { id: string; isSaved: boolean }) =>
      updateAiConversation(id, { is_saved: isSaved }),
    onMutate: async ({ id, isSaved }) => {
      await queryClient.cancelQueries({ queryKey: AI_CONVERSATIONS_QUERY_KEY });
      const previous = queryClient.getQueryData(AI_CONVERSATIONS_QUERY_KEY);
      queryClient.setQueryData(AI_CONVERSATIONS_QUERY_KEY, (old: any[] = []) =>
        old.map(c => (c.id === id ? { ...c, is_saved: isSaved } : c)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(AI_CONVERSATIONS_QUERY_KEY, context.previous);
      Toast.show({ type: 'error', text1: 'Failed to update — please try again' });
    },
    onSettled: invalidateConversations,
  });

  const reactMutation = useMutation({
    mutationFn: ({ messageId, reaction }: { messageId: string; reaction: MessageReaction | null }) =>
      reactToAiMessage(messageId, reaction),
  });

  const shareMutation = useMutation({
    mutationFn: (id: string) => shareAiConversation(id),
    onError: () => Toast.show({ type: 'error', text1: 'Failed to generate share link' }),
  });

  const summariseMutation = useMutation({
    mutationFn: (messageId: string) => summariseAiMessage(messageId),
  });

  return {
    rename: renameMutation.mutate,
    isRenaming: renameMutation.isPending,
    remove: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
    toggleSave: toggleSaveMutation.mutate,
    react: reactMutation.mutate,
    share: shareMutation.mutateAsync,
    isSharing: shareMutation.isPending,
    summarise: summariseMutation.mutateAsync,
    isSummarising: summariseMutation.isPending,
  };
}
