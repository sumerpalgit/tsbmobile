import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme';
import { useMyEvents } from '../hooks/useMyEvents';
import { useEventMutations } from '../hooks/useEventMutations';
import { useRsvpConfirm } from '../hooks/useRsvpConfirm';
import { useMe } from '../hooks/useMe';
import type { MyEventItem } from '../types/events';
import type { AppStackParamList, DrawerParamList } from '../navigation/types';
import { MyEventsHeader } from '../components/events/MyEventsHeader';
import { EventsHero } from '../components/events/EventsHero';
import { EventsCalendarPopover } from '../components/events/EventsCalendarPopover';
// import { NextUpCard } from '../components/events/NextUpCard'; // commented out with its render call below
import { EventsControls, EventTab } from '../components/events/EventsControls';
import { EventTypeChipsRow } from '../components/events/EventTypeChipsRow';
import { EventListCard } from '../components/events/EventListCard';
import { EventsEmptyState } from '../components/events/EventsEmptyState';
import { EventsSkeleton } from '../components/events/EventListCardSkeleton';
import { ConfirmDialog } from '../components/events/ConfirmDialog';
import {
  EMPTY_EVENTS_FILTERS,
  EventsFilterPage,
  EventsFilterState,
  countActiveEventFilters,
} from '../components/events/EventsFilterPage';
import { getEventMonthLabel, getEventTypeLabel, isEventPast } from '../components/events/eventVisuals';

/** My Events sits inside the drawer, but "Create a New Event" is a screen pushed on the parent
 * stack (`AppStackParamList`'s `CreateEvent`, see `navigation/types.ts`) — this composite type is
 * the standard React Navigation pattern for "needs both this navigator's own methods
 * (`openDrawer`) and a route that actually lives one level up." `navigate('CreateEvent', ...)`
 * already bubbles up to the parent stack automatically at runtime; this just makes that typecheck. */
type MyEventsNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;

function daysBetween(dateStr: string | null, now: number): number {
  if (!dateStr) return 0;
  return Math.round((new Date(dateStr).getTime() - now) / 86400000);
}

/** Literal port of web's `applyDayFilter` (`my-events/page.tsx:506-519`) — including its own
 * dead `next_3m` case: that quick-pill sets `day: 'next_3m'`, but web's switch never handles it,
 * so it falls to `default: return true` (no filtering effect at all). Web's `today`/`tomorrow`/
 * `next_week`/`weekend`/`soon` cases are omitted — no UI control on either platform ever produces
 * those values, so porting them would add unreachable code. */
function applyDayFilter(event: MyEventItem, nowDate: Date, filters: EventsFilterState): boolean {
  const eventDate = event.start_date ? new Date(event.start_date) : null;
  switch (filters.day) {
    case 'this_week': {
      const end = new Date(nowDate);
      end.setDate(nowDate.getDate() + (7 - nowDate.getDay()));
      return eventDate ? eventDate <= end && eventDate >= nowDate : false;
    }
    case 'this_month': {
      const start = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
      const end = new Date(nowDate.getFullYear(), nowDate.getMonth() + 1, 0);
      return eventDate ? eventDate >= start && eventDate <= end : false;
    }
    case 'custom':
      return filters.customDate ? eventDate?.toISOString().split('T')[0] === filters.customDate : true;
    default:
      return true;
  }
}

/**
 * My Events — functionality from `webSrc/src/app/dashboard/my-events/page.tsx`, UI from the
 * `MyEvents.html` mobile mockup. Owns all local state (tab, search, filters) and composes the
 * header + hero + next-up + controls + type chips + grouped list, with `EventsFilterPage` as a
 * sibling `Modal` overlay (same reasoning as `FilterPanel` on Home) — "Create a New Event"/"Edit
 * Event" and the event detail view are both separate pushed screens instead (`CreateEvent`/
 * `EventDetail` on `AppStackParamList`, see `navigation/types.ts`), not overlays on this screen;
 * both moved out of `Modal`-based overlays after `Modal`'s coordinate-space quirks caused real
 * bugs (see `CreateEventWizard.tsx`/`EventDetailView.tsx`'s own doc comments).
 *
 * Simplification: the controls row scrolls with the page instead of the mockup's CSS `sticky`
 * positioning — true sticky-within-scroll needs a `FlatList`/`stickyHeaderIndices` restructure
 * this list's modest size doesn't warrant.
 */
function MyEventsScreen() {
  const { colors, fonts, spacing } = useTheme();
  const navigation = useNavigation<MyEventsNavigationProp>();

  const { events, rsvpEvents, userCreatedEvents, savedEvents, isLoading, refetch } = useMyEvents();
  const { toggleSave } = useEventMutations();
  const { data: me } = useMe();
  // Shared with `EventDetailScreen.tsx` — same tap-RSVP → confirm-dialog → mutation flow needed
  // in both places, not duplicated (see `useRsvpConfirm.ts`'s doc comment).
  const { handleRsvp, handleCancelRsvp, pendingActionFor, confirmDialogProps } = useRsvpConfirm();

  const [activeTab, setActiveTab] = useState<EventTab>('upcoming');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [filters, setFilters] = useState<EventsFilterState>(EMPTY_EVENTS_FILTERS);
  const [filterPageOpen, setFilterPageOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isRsvped = (eventId: string) => rsvpEvents.some(e => e.id === eventId);
  const isSaved = (event: MyEventItem) => savedEvents.some(s => s.feed_id === event.feed_id);
  // Matches web's `isOwner` check exactly (`ev.feed_owner === user?.id || userCreatedEvents.some(u => u.id === ev.id)`).
  const isOwner = (event: MyEventItem) => event.feed_owner === me?.id || userCreatedEvents.some(u => u.id === event.id);

  // Memoized against the actual data, not recomputed on every render — `counts`/`inSegment`/
  // `filtered`/`nextUpEvent` below all key off this, and a plain `Date.now()` here would give
  // each of them a "changed" dependency on every render (including ones triggered by tapping a
  // button), forcing a full filter/sort/group of the whole events list synchronously on every
  // tap. That's what was actually stalling the RSVP confirm dialog — not the loading-spinner
  // timing itself.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [events, rsvpEvents, savedEvents]);

  const counts = useMemo(
    () => ({
      upcoming: events.filter(e => e.start_date && new Date(e.start_date).getTime() > now).length,
      past: events.filter(e => isEventPast(e)).length,
      saved: savedEvents.length,
    }),
    [events, savedEvents, now],
  );

  const segmentSource = activeTab === 'saved' ? savedEvents : events;

  const inSegment = useMemo(
    () =>
      segmentSource.filter(e => {
        if (activeTab === 'past') return isEventPast(e);
        if (activeTab === 'upcoming') return e.start_date ? new Date(e.start_date).getTime() > now : false;
        return true;
      }),
    [segmentSource, activeTab, now],
  );

  // Deliberately global (every type across all of `events`), not scoped to the active tab —
  // the mockup itself scopes this to the active tab (`MyEvents.html`'s `TYPES.filter(t =>
  // inSeg.some(e => e.type === t))`, `inSeg` being its own tab-filtered list), but that means the
  // available chips — and the current selection, since a type missing from the new tab has to
  // reset — change every time you switch Upcoming/Past/Saved. Explicit product decision to
  // diverge from the mockup here for a stable chip row instead.
  const allEventTypes = useMemo(
    () => Array.from(new Set(events.map(getEventTypeLabel))),
    [events],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const nowDate = new Date(now);
    nowDate.setHours(0, 0, 0, 0);
    return inSegment.filter(event => {
      if (selectedType && getEventTypeLabel(event) !== selectedType) return false;
      if (!applyDayFilter(event, nowDate, filters)) return false;
      // Matches web's `filters.country` substring match against `location` exactly
      // (`my-events/page.tsx:531`).
      if (filters.city && !(event.location ?? '').toLowerCase().includes(filters.city.toLowerCase())) return false;
      // Event type and Location type are independent selections (see `EventsFilterState`'s
      // `locationType` doc comment) but both compare against the same real `event_type` field —
      // picking a conflicting pair across the two sections legitimately yields zero matches.
      if (filters.eventType && (event.event_type ?? '').toLowerCase() !== filters.eventType.toLowerCase()) return false;
      if (filters.locationType && (event.event_type ?? '').toLowerCase() !== filters.locationType.toLowerCase()) return false;

      if (q) {
        const haystack = [event.title, event.hosted_by, event.location, getEventTypeLabel(event)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [inSegment, selectedType, filters, searchQuery, now]);

  // Web's `displayedForGrid` has no sort at all — it just filters and renders in fetch order. This
  // keeps the list's existing default chronological order (soonest-first upcoming, most-recent-
  // first past) since the month-grouped list still needs *a* deterministic order, but the sort is
  // no longer user-selectable (the mockup's Sort-by section had no web equivalent, per web parity).
  const sorted = useMemo(() => {
    const list = [...filtered];
    const asc = activeTab === 'past' ? -1 : 1;
    list.sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0;
      return (aTime - bTime) * asc;
    });
    return list;
  }, [filtered, activeTab]);

  const groups = useMemo(() => {
    const map = new Map<string, MyEventItem[]>();
    sorted.forEach(event => {
      const label = getEventMonthLabel(event);
      const bucket = map.get(label);
      if (bucket) bucket.push(event);
      else map.set(label, [event]);
    });
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
  }, [sorted]);

  const nextUpEvent = useMemo(() => {
    return rsvpEvents
      .filter(e => e.start_date && new Date(e.start_date).getTime() > now)
      .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())[0];
  }, [rsvpEvents, now]);

  // `NextUpCard` (below) is commented out per explicit request — kept here rather than deleted
  // in case it comes back; `showNextUp` is commented out alongside it so it doesn't trip the
  // unused-var lint rule while dark.
  // const showNextUp = activeTab === 'upcoming' && !searchOpen && !searchQuery && !!nextUpEvent;
  const filtersActive = countActiveEventFilters(filters) > 0;

  const attendedCount = events.filter(e => isEventPast(e)).length;
  const registeredCount = rsvpEvents.filter(e => e.start_date && new Date(e.start_date).getTime() > now).length;
  // Matches web's `daysToNextEvent` (`my-events/page.tsx:540-548`) — days until the earliest
  // future RSVP'd event, "—" when there is none. Reuses `nextUpEvent`/`daysBetween` already
  // computed above rather than a second day-math formula.
  const daysToNextEvent: number | string = nextUpEvent ? Math.max(0, daysBetween(nextUpEvent.start_date, now)) : '—';

  const handleRefresh = () => {
    setRefreshing(true);
    refetch();
    setTimeout(() => setRefreshing(false), 600);
  };

  const emptyCopy =
    activeTab === 'upcoming'
      ? { title: 'No upcoming events', hint: 'RSVP to a chapter event or webinar and it will show up here.' }
      : activeTab === 'past'
      ? { title: 'No past events yet', hint: "Events you've attended will show up here once they wrap." }
      : { title: 'No saved events', hint: 'Tap the bookmark on any event to save it for later.' };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.screen, { backgroundColor: colors.pageBg }]}>
      <MyEventsHeader
        onMenuPress={() => navigation.openDrawer()}
        onCalendarPress={() => setCalendarOpen(true)}
        onCreatePress={() => navigation.navigate('CreateEvent', {})}
      />
      <EventsCalendarPopover visible={calendarOpen} events={events} onClose={() => setCalendarOpen(false)} />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
      >
        <EventsHero
          registeredCount={registeredCount}
          savedCount={savedEvents.length}
          daysToNextEvent={daysToNextEvent}
          attendedCount={attendedCount}
        />

        {/* {showNextUp && nextUpEvent && (
          <NextUpCard
            event={nextUpEvent}
            daysUntil={Math.max(0, daysBetween(nextUpEvent.start_date, now))}
            onPress={() => navigation.navigate('EventDetail', { event: nextUpEvent })}
          />
        )} */}

        <View style={[styles.controlsWrap, { paddingTop: spacing.md }]}>
          <EventsControls
            activeTab={activeTab}
            // No longer clears `selectedType` on tab change — now that the chip row is global
            // (see `allEventTypes` above), a selected type stays valid across every tab, so
            // silently dropping it on switch would just be confusing rather than necessary.
            onTabChange={setActiveTab}
            counts={counts}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSearch={() => setSearchOpen(true)}
            onCloseSearch={() => setSearchOpen(false)}
            onOpenFilters={() => setFilterPageOpen(true)}
            filtersActive={filtersActive}
          />

          {allEventTypes.length > 0 && (
            <EventTypeChipsRow types={allEventTypes} selected={selectedType} onSelect={setSelectedType} />
          )}
        </View>

        <View style={styles.listWrap}>
          {isLoading && <EventsSkeleton />}

          {!isLoading && sorted.length === 0 && (
            <EventsEmptyState
              title={emptyCopy.title}
              hint={emptyCopy.hint}
              actionLabel={activeTab !== 'saved' ? 'Create an event' : undefined}
              onAction={activeTab !== 'saved' ? () => navigation.navigate('CreateEvent', {}) : undefined}
            />
          )}

          {!isLoading &&
            groups.map(group => (
              <View key={group.label} style={styles.group}>
                <View style={styles.groupHeader}>
                  <Text style={[fonts.bold, styles.groupLabel, { color: colors.ink3 }]}>{group.label.toUpperCase()}</Text>
                  <View style={[styles.groupLine, { backgroundColor: colors.border }]} />
                  <Text style={[fonts.semibold, styles.groupCount, { color: colors.ink3 }]}>
                    {group.items.length} event{group.items.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.groupItems}>
                  {group.items.map(event => (
                    <EventListCard
                      key={event.id}
                      event={event}
                      isRsvped={isRsvped(event.id)}
                      saved={isSaved(event)}
                      isOwner={isOwner(event)}
                      pendingAction={pendingActionFor(event.id)}
                      onOpen={() => navigation.navigate('EventDetail', { event })}
                      onSave={() => event.feed_id && toggleSave({ event, wasSaved: isSaved(event) })}
                      onRsvp={() => handleRsvp(event)}
                      onCancelRsvp={() => handleCancelRsvp(event)}
                      onEdit={() => navigation.navigate('CreateEvent', { event })}
                    />
                  ))}
                </View>
              </View>
            ))}
        </View>

        <View style={{ height: spacing.xxxl }} />
      </ScrollView>

      <EventsFilterPage
        visible={filterPageOpen}
        initialFilters={filters}
        onClose={() => setFilterPageOpen(false)}
        onApply={next => {
          setFilters(next);
          setFilterPageOpen(false);
        }}
      />

      <ConfirmDialog {...confirmDialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  controlsWrap: {
    paddingHorizontal: 16,
  },
  listWrap: {
    paddingHorizontal: 16,
  },
  group: {
    marginBottom: 6,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  groupLabel: {
    fontSize: 10.5,
    letterSpacing: 0.8,
  },
  groupLine: {
    flex: 1,
    height: 1,
  },
  groupCount: {
    fontSize: 10.5,
  },
  groupItems: {
    gap: 10,
  },
});

export default MyEventsScreen;
