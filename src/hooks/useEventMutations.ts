import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import {
  cancelEventRsvp,
  createEvent,
  submitEventRsvp,
  updateEvent,
} from '../api/events';
import { toggleSave as toggleSaveApi } from '../api/saves';
import { MY_EVENTS_QUERY_KEY, SAVED_EVENTS_QUERY_KEY } from '../api/queryKeys';
import type { EventFormPayload, MyEventItem } from '../types/events';

/** My Events' write operations — RSVP, save/bookmark toggle, and create/edit, each invalidating
 * whichever of `MY_EVENTS_QUERY_KEY`/`SAVED_EVENTS_QUERY_KEY` its change affects so the list
 * refetches, mirroring web's own "await mutation, then refetch the filter-list" pattern
 * (`submitEventRsvp`/`cancelEventRsvp`/`handleAddEvent` in `my-events/page.tsx`). First
 * `useMutation` usage in the app — establishes the invalidate-on-success + Toast-on-error
 * convention other features can follow.
 */
export function useEventMutations() {
  const queryClient = useQueryClient();

  const invalidateEvents = () => queryClient.invalidateQueries({ queryKey: MY_EVENTS_QUERY_KEY });
  const invalidateSaved = () => queryClient.invalidateQueries({ queryKey: SAVED_EVENTS_QUERY_KEY });

  const rsvpMutation = useMutation({
    // Wrapped (not `mutationFn: submitEventRsvp` directly) — `submitEventRsvp` now takes an
    // optional second `response` param, which react-query's own mutate-context argument would
    // otherwise collide with positionally. Always registers "attending" here, matching this
    // hook's existing one-tap RSVP flow (My Events has no Going/Maybe/Can't-make-it picker).
    mutationFn: (eventId: string) => submitEventRsvp(eventId),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: "You're registered ✓" });
      invalidateEvents();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to RSVP', text2: 'Please try again.' }),
  });

  const cancelRsvpMutation = useMutation({
    mutationFn: cancelEventRsvp,
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'RSVP cancelled' });
      invalidateEvents();
    },
    onError: () =>
      Toast.show({ type: 'error', text1: 'Failed to cancel RSVP', text2: 'Please try again.' }),
  });

  // Optimistic — the bookmark toggle needs to flip the instant it's tapped (not after the round
  // trip), unlike the other mutations here. Writes the new saved list into the
  // `SAVED_EVENTS_QUERY_KEY` cache directly in `onMutate`, before the request even goes out;
  // `onError` restores the pre-toggle snapshot if the API call fails; `onSettled` still
  // refetches both lists to reconcile with the server either way.
  const saveMutation = useMutation({
    mutationFn: ({ event }: { event: MyEventItem; wasSaved: boolean }) => toggleSaveApi(event.feed_id!),
    onMutate: async ({ event, wasSaved }) => {
      await queryClient.cancelQueries({ queryKey: SAVED_EVENTS_QUERY_KEY });
      const previousSaved = queryClient.getQueryData<MyEventItem[]>(SAVED_EVENTS_QUERY_KEY);
      queryClient.setQueryData<MyEventItem[]>(SAVED_EVENTS_QUERY_KEY, (old = []) =>
        wasSaved ? old.filter(e => e.feed_id !== event.feed_id) : [...old, event],
      );
      return { previousSaved };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSaved) queryClient.setQueryData(SAVED_EVENTS_QUERY_KEY, context.previousSaved);
      Toast.show({ type: 'error', text1: 'Failed to update bookmark' });
    },
    onSettled: () => {
      invalidateEvents();
      invalidateSaved();
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: EventFormPayload) => createEvent(payload),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Event posted to your chapter feed ✓' });
      invalidateEvents();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to create event', text2: 'Please try again.' }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: EventFormPayload }) => updateEvent(id, payload),
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Event updated ✓' });
      invalidateEvents();
    },
    onError: () => Toast.show({ type: 'error', text1: 'Failed to update event', text2: 'Please try again.' }),
  });

  return {
    submitRsvp: rsvpMutation.mutate,
    isSubmittingRsvp: rsvpMutation.isPending,
    cancelRsvp: cancelRsvpMutation.mutate,
    isCancellingRsvp: cancelRsvpMutation.isPending,
    toggleSave: saveMutation.mutate,
    createEvent: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateEvent: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
