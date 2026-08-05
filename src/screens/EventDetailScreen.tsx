import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { EventDetailView } from '../components/events/EventDetailView';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import { useMyEvents } from '../hooks/useMyEvents';
import { useRsvpConfirm } from '../hooks/useRsvpConfirm';
import type { AppStackParamList } from '../navigation/types';

/**
 * My Events' event detail screen — a dedicated pushed screen (registered in `AppNavigator.tsx`)
 * wrapping `EventDetailView`'s content. Was a `Modal` overlay living inside `MyEventsScreen`
 * itself; moved here after `Modal`'s coordinate-space quirks caused a real bug (see
 * `EventDetailView.tsx`'s doc comment). `useRsvpConfirm` is shared with `MyEventsScreen.tsx`
 * rather than duplicated — both need the identical tap-RSVP → confirm-dialog → mutation flow.
 */
function EventDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'EventDetail'>>();
  const { event } = route.params;

  const { rsvpEvents } = useMyEvents();
  const isRsvped = rsvpEvents.some(e => e.id === event.id);

  const { handleRsvp, handleCancelRsvp, confirmDialogProps } = useRsvpConfirm();

  return (
    <>
      <EventDetailView
        event={event}
        isRsvped={isRsvped}
        onClose={() => navigation.goBack()}
        onRsvp={() => handleRsvp(event)}
        onCancelRsvp={() => handleCancelRsvp(event)}
      />
      <ConfirmDialog {...confirmDialogProps} />
    </>
  );
}

export default EventDetailScreen;
