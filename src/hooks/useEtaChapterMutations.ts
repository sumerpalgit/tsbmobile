import { useMutation } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { joinEtaGroup, leaveEtaGroup, requestEtaCity } from '../api/eta';

/** ETA Chapters' write operations — join/leave/request-city. Unlike `useEventMutations.ts`/
 * `useMessageMutations.ts`, these don't invalidate a react-query cache on success: the chapters
 * list is owned by `useMyEtaChapters.ts`'s own `refetch()` (see that hook's doc comment for why
 * it isn't a `useQuery`), so callers call `refetch()` themselves after a mutation settles,
 * mirroring web's own `await joinEtaGroup(...); await fetchData()` sequencing. */
export function useEtaChapterMutations() {
  const joinMutation = useMutation({
    mutationFn: (groupId: string) => joinEtaGroup(groupId),
    onError: () =>
      Toast.show({ type: 'error', text1: 'Unable to join chapter right now', text2: 'Please try again.' }),
  });

  const leaveMutation = useMutation({
    mutationFn: (groupId: string) => leaveEtaGroup(groupId),
    onError: () =>
      Toast.show({ type: 'error', text1: 'Unable to leave chapter right now', text2: 'Please try again.' }),
  });

  const requestCityMutation = useMutation({
    mutationFn: (payload: { city: string; country: string; chapterName: string; reason: string; connection: string }) =>
      requestEtaCity(payload.city, payload.country, payload.chapterName, payload.reason, payload.connection),
    onError: () =>
      Toast.show({ type: 'error', text1: 'Unable to submit request', text2: 'Please try again.' }),
  });

  return {
    joinGroup: joinMutation.mutateAsync,
    isJoining: joinMutation.isPending,
    leaveGroup: leaveMutation.mutateAsync,
    isLeaving: leaveMutation.isPending,
    requestCity: requestCityMutation.mutateAsync,
    isRequestingCity: requestCityMutation.isPending,
  };
}
