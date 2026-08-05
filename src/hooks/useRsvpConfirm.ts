import { useState } from 'react';
import { useEventMutations } from './useEventMutations';
import type { MyEventItem } from '../types/events';

/**
 * RSVP/cancel confirm-dialog state — shared between `MyEventsScreen.tsx` (card list) and
 * `EventDetailScreen.tsx` (detail screen), which used to be the same screen's local state before
 * the detail view became its own pushed screen. Pulled out here instead of duplicated, since both
 * need identical behavior: tap RSVP/Cancel → `ConfirmDialog` opens → confirm calls the mutation.
 *
 * `pendingAction` is separate from `pendingConfirm` on purpose — it clears on `ConfirmDialog`'s
 * `onShow`, not on confirm/cancel, so the tapped button's own loading spinner only covers the gap
 * between the tap and the dialog actually becoming visible, not the whole time it stays open (see
 * `EventListCard.tsx`'s `pendingAction` prop).
 */
export function useRsvpConfirm() {
  const { submitRsvp, cancelRsvp } = useEventMutations();
  const [pendingConfirm, setPendingConfirm] = useState<{ type: 'rsvp' | 'cancelRsvp'; event: MyEventItem } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ eventId: string; type: 'rsvp' | 'cancel' } | null>(null);

  const handleRsvp = (event: MyEventItem) => {
    setPendingAction({ eventId: event.id, type: 'rsvp' });
    setPendingConfirm({ type: 'rsvp', event });
  };

  const handleCancelRsvp = (event: MyEventItem) => {
    setPendingAction({ eventId: event.id, type: 'cancel' });
    setPendingConfirm({ type: 'cancelRsvp', event });
  };

  const confirmPending = () => {
    if (!pendingConfirm) return;
    if (pendingConfirm.type === 'rsvp') submitRsvp(pendingConfirm.event.id);
    else cancelRsvp(pendingConfirm.event.id);
    setPendingConfirm(null);
    setPendingAction(null);
  };

  /** `EventListCard`'s `pendingAction` prop — `null` unless this exact event is the one currently
   * waiting on its dialog to open. */
  const pendingActionFor = (eventId: string) => (pendingAction && pendingAction.eventId === eventId ? pendingAction.type : null);

  const confirmDialogProps = {
    visible: !!pendingConfirm,
    title: pendingConfirm?.type === 'rsvp' ? 'Confirm RSVP' : 'Cancel RSVP',
    message:
      pendingConfirm?.type === 'rsvp'
        ? 'Are you sure you want to RSVP for this event?'
        : 'Are you sure you want to cancel your RSVP?',
    confirmLabel: pendingConfirm?.type === 'rsvp' ? 'RSVP' : 'Cancel RSVP',
    cancelLabel: pendingConfirm?.type === 'rsvp' ? 'Cancel' : 'Keep RSVP',
    destructive: pendingConfirm?.type === 'cancelRsvp',
    onConfirm: confirmPending,
    onCancel: () => {
      setPendingConfirm(null);
      setPendingAction(null);
    },
    onShow: () => setPendingAction(null),
  };

  return { handleRsvp, handleCancelRsvp, pendingActionFor, confirmDialogProps };
}
