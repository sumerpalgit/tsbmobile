import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CreateEventWizard } from '../components/events/CreateEventWizard/CreateEventWizard';
import { buildDraftFromEvent } from '../components/events/CreateEventWizard/types';
import { useEventMutations } from '../hooks/useEventMutations';
import type { AppStackParamList } from '../navigation/types';

/**
 * My Events' "Create a New Event" / "Edit Event" screen — a dedicated pushed screen (registered
 * in `AppNavigator.tsx`) wrapping `CreateEventWizard`'s step content. Was a `Modal` overlay living
 * inside `MyEventsScreen` itself; moved here so opening it is a real native push (with its own
 * back gesture) instead of a second `Modal` stacking on top of My Events' own screen.
 *
 * `route.params.event` presence switches it into edit mode — `EventListCard`'s owner-only "Edit"
 * button and the empty-state/header "Create Event" triggers all just navigate here with or
 * without that param instead of managing `wizardOpen`/`editingEvent` overlay state locally.
 */
function CreateEventScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'CreateEvent'>>();
  const editingEvent = route.params?.event;

  const { createEvent, updateEvent, isCreating, isUpdating } = useEventMutations();

  return (
    <CreateEventWizard
      initialDraft={editingEvent ? buildDraftFromEvent(editingEvent) : undefined}
      onClose={() => navigation.goBack()}
      onSubmit={payload => (editingEvent ? updateEvent({ id: editingEvent.id, payload }) : createEvent(payload))}
      isSubmitting={editingEvent ? isUpdating : isCreating}
    />
  );
}

export default CreateEventScreen;
