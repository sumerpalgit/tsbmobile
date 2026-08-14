import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import type { MyEventItem } from '../../types/events';
import { HEADER_CONTENT_HEIGHT } from './MyEventsHeader';

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const POPOVER_WIDTH = 288;
const GAP = 8;
/** Matches `MyEventsHeader`'s `row` style's `paddingHorizontal` — right-aligns the popover flush
 * with the header's own right margin (roughly under the Calendar button, which sits near the
 * header's right edge) rather than trying to anchor to that specific button's measured position. */
const HEADER_RIGHT_MARGIN = 16;

/**
 * Mini month-nav calendar — port of web's `showCalendar` popup (`my-events/page.tsx:313-384,
 * 1084-1133`): prev/next month nav, "today" highlight, a dot under any day that has an event.
 *
 * Positioned from `insets.top + HEADER_CONTENT_HEIGHT`, not by measuring the Calendar button at
 * runtime (`measureInWindow`, the technique `FieldSelect.tsx` uses for its own dropdown). That
 * technique fits a field that can sit anywhere mid-scroll; this header's height never changes with
 * content, so anchoring off a fixed constant both this file and `MyEventsHeader.tsx` share is
 * simpler and sidesteps a real bug that approach hit here specifically: a `measureInWindow` call
 * against this header consistently returned a position tens of dp higher than the button's actual
 * on-screen spot (confirmed empirically across cold relaunches and a `statusBarTranslucent`
 * toggle, so it wasn't a mount-timing race or a status-bar coordinate-space mismatch — likely
 * something about measuring a plain wrapping `View` this close to the very top of the window on
 * this device/RN version), which rendered the popover overlapping and hiding the button instead of
 * sitting below it.
 *
 * A wrong/stale `insets.top` here would misplace the whole popover (not just mis-pad it), since
 * it feeds directly into the absolute `top` position above — so this nests its own
 * `SafeAreaProvider` inside the `Modal` rather than trusting the app-root one (`App.tsx`): `Modal`
 * renders in a separate native window on Android, and insets measured against the main window
 * aren't guaranteed to apply there too. Same root cause/fix as `DirectoryFiltersPanel.tsx`. The
 * insets-consuming content is split into `EventsCalendarPopoverContent` because a component can't
 * read a `Provider` it renders itself later in the same return — `useSafeAreaInsets()` has to be
 * called from *inside* the new nested provider's subtree.
 */
export function EventsCalendarPopover({
  visible,
  events,
  onClose,
}: {
  visible: boolean;
  events: MyEventItem[];
  onClose: () => void;
}) {
  if (!visible) return null;

  // `statusBarTranslucent` so this Modal's coordinate origin is the very top of the physical
  // screen — matches `EventsFilterPage`/`EventDetailView`'s own reasoning for it — and `top`
  // computed below already accounts for that by adding `insets.top` itself.
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaProvider>
        <EventsCalendarPopoverContent events={events} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

function EventsCalendarPopoverContent({ events, onClose }: { events: MyEventItem[]; onClose: () => void }) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => new Date());

  useEffect(() => {
    setMonth(new Date());
  }, []);

  const eventDatesSet = useMemo(
    () => new Set(events.map(e => e.start_date?.split('T')[0]).filter((d): d is string => !!d)),
    [events],
  );

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const today = new Date();
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const top = insets.top + HEADER_CONTENT_HEIGHT + GAP;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
      <Pressable
        onPress={e => e.stopPropagation()}
        style={[
          styles.popup,
          elevation('lg'),
          {
            top,
            right: HEADER_RIGHT_MARGIN,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: borderWidth.thin,
            borderRadius: radius.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            style={({ pressed }) => [styles.navButton, { borderRadius: radius.md }, pressed && styles.pressed]}
          >
            <ChevronLeft size={15} color={colors.ink2} strokeWidth={2} />
          </Pressable>
          <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>
            {month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <Pressable
            onPress={() => setMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            style={({ pressed }) => [styles.navButton, { borderRadius: radius.md }, pressed && styles.pressed]}
          >
            <ChevronRight size={15} color={colors.ink2} strokeWidth={2} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {DOW.map(d => (
            <View key={d} style={styles.cell}>
              <Text style={[fonts.bold, styles.dowText, { color: colors.ink3 }]}>{d}</Text>
            </View>
          ))}
          {cells.map((d, i) => {
            if (!d) return <View key={`e-${i}`} style={styles.cell} />;
            const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = d === today.getDate() && m === today.getMonth() && year === today.getFullYear();
            const hasEvent = eventDatesSet.has(dateStr);
            return (
              <View key={d} style={styles.cell}>
                <View
                  style={[
                    styles.dayCircle,
                    { borderRadius: radius.pill },
                    isToday && { backgroundColor: colors.gold },
                  ]}
                >
                  <Text style={[fonts.semibold, styles.dayText, { color: isToday ? '#fff' : colors.ink }]}>{d}</Text>
                </View>
                {hasEvent && <View style={[styles.dot, { backgroundColor: isToday ? '#fff' : colors.gold }]} />}
              </View>
            );
          })}
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  popup: {
    position: 'absolute',
    width: POPOVER_WIDTH,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dowText: {
    fontSize: 10,
  },
  dayCircle: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 12,
  },
  dot: {
    position: 'absolute',
    bottom: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  pressed: {
    opacity: 0.65,
  },
});
