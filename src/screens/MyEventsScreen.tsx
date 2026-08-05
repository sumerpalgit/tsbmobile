import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { NextUpCard } from '../components/events/NextUpCard';
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
import { getEventMonthLabel, getEventTypeLabel, isEventPast, isVirtualEvent } from '../components/events/eventVisuals';

/** My Events sits inside the drawer, but "Create a New Event" is a screen pushed on the parent
 * stack (`AppStackParamList`'s `CreateEvent`, see `navigation/types.ts`) — this composite type is
 * the standard React Navigation pattern for "needs both this navigator's own methods
 * (`openDrawer`) and a route that actually lives one level up." `navigate('CreateEvent', ...)`
 * already bubbles up to the parent stack automatically at runtime; this just makes that typecheck. */
type MyEventsNavigationProp = CompositeNavigationProp<
  DrawerNavigationProp<DrawerParamList>,
  NativeStackNavigationProp<AppStackParamList>
>;

const DATE_RANGE_CAP_DAYS: Record<string, number> = { week: 7, month: 31, quarter: 92 };

function daysBetween(dateStr: string | null, now: number): number {
  if (!dateStr) return 0;
  return Math.round((new Date(dateStr).getTime() - now) / 86400000);
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

  const typesInSegment = useMemo(
    () => Array.from(new Set(inSegment.map(getEventTypeLabel))),
    [inSegment],
  );

  const cityOptions = useMemo(
    () => Array.from(new Set(events.map(e => e.location).filter((v): v is string => !!v))).sort(),
    [events],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return inSegment.filter(event => {
      if (selectedType && getEventTypeLabel(event) !== selectedType) return false;
      if (filters.types.length && !filters.types.includes(getEventTypeLabel(event))) return false;
      if (filters.locs.length) {
        const locType = isVirtualEvent(event) ? 'Virtual' : (event.format ?? '').toLowerCase().includes('hybrid') ? 'Hybrid' : 'In-Person';
        if (!filters.locs.includes(locType)) return false;
      }
      if (filters.cities.length && !filters.cities.includes(event.location ?? '')) return false;

      if (filters.dateRange === 'custom') {
        const eventTime = event.start_date ? new Date(event.start_date).getTime() : 0;
        if (filters.dateFrom && eventTime < new Date(filters.dateFrom).getTime()) return false;
        if (filters.dateTo && eventTime > new Date(filters.dateTo).getTime()) return false;
      } else if (filters.dateRange !== 'any') {
        const cap = DATE_RANGE_CAP_DAYS[filters.dateRange] ?? Infinity;
        if (Math.abs(daysBetween(event.start_date, now)) > cap) return false;
      }

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

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (filters.sort === 'az') {
      list.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
      return list;
    }
    const asc = activeTab === 'past' ? (filters.sort === 'soon' ? -1 : 1) : filters.sort === 'soon' ? 1 : -1;
    list.sort((a, b) => {
      const aTime = a.start_date ? new Date(a.start_date).getTime() : 0;
      const bTime = b.start_date ? new Date(b.start_date).getTime() : 0;
      return (aTime - bTime) * asc;
    });
    return list;
  }, [filtered, filters.sort, activeTab]);

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

  const showNextUp = activeTab === 'upcoming' && !searchOpen && !searchQuery && !!nextUpEvent;
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
    <View style={[styles.screen, { backgroundColor: colors.pageBg }]}>
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

        {showNextUp && nextUpEvent && (
          <NextUpCard
            event={nextUpEvent}
            daysUntil={Math.max(0, daysBetween(nextUpEvent.start_date, now))}
            onPress={() => navigation.navigate('EventDetail', { event: nextUpEvent })}
          />
        )}

        <View style={[styles.controlsWrap, { paddingTop: spacing.md }]}>
          <EventsControls
            activeTab={activeTab}
            onTabChange={tab => {
              setActiveTab(tab);
              setSelectedType(null);
            }}
            counts={counts}
            searchOpen={searchOpen}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onOpenSearch={() => setSearchOpen(true)}
            onCloseSearch={() => setSearchOpen(false)}
            onOpenFilters={() => setFilterPageOpen(true)}
            filtersActive={filtersActive}
          />

          {typesInSegment.length > 0 && (
            <EventTypeChipsRow types={typesInSegment} selected={selectedType} onSelect={setSelectedType} />
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
        activeTab={activeTab}
        initialFilters={filters}
        cityOptions={cityOptions}
        onClose={() => setFilterPageOpen(false)}
        onApply={next => {
          setFilters(next);
          setFilterPageOpen(false);
        }}
      />

      <ConfirmDialog {...confirmDialogProps} />
    </View>
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
