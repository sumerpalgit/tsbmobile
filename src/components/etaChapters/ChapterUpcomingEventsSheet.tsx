import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { BookOpen, Calendar, GraduationCap, MapPin, Users, Video, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { fetchChapterEvents } from '../../api/eta';
import type { ChapterEvent } from '../../types/etaChapters';

type EventTab = 'upcoming' | 'past';
type EventCategory = 'all' | 'networking' | 'education' | 'workshop' | 'webinar';

const CATEGORY_META: Record<Exclude<EventCategory, 'all'> | 'default', { label: string; bg: string; color: string; icon: LucideIcon }> = {
  networking: { label: 'Networking', bg: '#e0f2fe', color: '#0369a1', icon: Users },
  education: { label: 'Education', bg: '#f3e8ff', color: '#7e22ce', icon: GraduationCap },
  workshop: { label: 'Workshop', bg: '#e4f4ec', color: '#1a7a48', icon: BookOpen },
  webinar: { label: 'Webinar', bg: '#FEF3C7', color: '#B45309', icon: Video },
  default: { label: 'Event', bg: '#F3ECD8', color: '#7a6020', icon: Calendar },
};

const CATS: EventCategory[] = ['all', 'networking', 'education', 'workshop', 'webinar'];

/** Same keyword-matching heuristic as web's `getEventMeta` (`my-eta-chapters/page.tsx:2268`) —
 * category isn't a real backend field, web itself derives it client-side from title/location/
 * description text, so this ports that live logic verbatim rather than treating it as fabricated
 * data. */
function getEventCategory(event: ChapterEvent): Exclude<EventCategory, 'all'> | 'default' {
  const text = `${event.location ?? ''} ${event.title ?? ''} ${event.description ?? ''}`.toLowerCase();
  if (text.includes('webinar') || text.includes('zoom') || text.includes('google meet') || text.includes('online')) return 'webinar';
  if (text.includes('workshop') || text.includes('masterclass')) return 'workshop';
  if (text.includes('education') || text.includes('course') || text.includes('training') || text.includes('learn')) return 'education';
  if (text.includes('networking') || text.includes('meetup') || text.includes('happy hour') || text.includes('meet up')) return 'networking';
  return 'default';
}

function formatEventDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} · ${time}`;
}

function getHostInitials(title: string | null) {
  return (title || 'Chapter')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const HOST_COLORS = ['#0f766e', '#6d28d9', '#b45309', '#1a7a48', '#0369a1', '#7a6020', '#be123c'];

/** Matches web's `EventsSidePanel` (`my-eta-chapters/page.tsx:2286`) — a right-side desktop panel
 * on web, ported here as a bottom sheet (mobile-appropriate for the same content, same real data
 * and filtering logic) rather than a full-screen right-hand drawer.
 *
 * Nests its own `SafeAreaProvider` inside the `Modal` rather than trusting the app-root one —
 * `Modal` renders in a separate native window on Android, so insets measured against the main
 * window aren't guaranteed to apply there too (same root cause fixed for
 * `DirectoryFiltersPanel.tsx`). The insets-consuming content is split into
 * `ChapterUpcomingEventsSheetContent` because a component can't read a `Provider` it renders
 * itself later in the same return — `useSafeAreaInsets()` has to be called from *inside* the new
 * nested provider's subtree. */
export function ChapterUpcomingEventsSheet({
  visible,
  chapterId,
  chapterName,
  onClose,
}: {
  visible: boolean;
  chapterId: string | null;
  chapterName: string;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaProvider>
        <ChapterUpcomingEventsSheetContent visible={visible} chapterId={chapterId} chapterName={chapterName} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

function ChapterUpcomingEventsSheetContent({
  visible,
  chapterId,
  chapterName,
  onClose,
}: {
  visible: boolean;
  chapterId: string | null;
  chapterName: string;
  onClose: () => void;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const [events, setEvents] = useState<ChapterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<EventTab>('upcoming');
  const [activeCat, setActiveCat] = useState<EventCategory>('all');

  useEffect(() => {
    if (!visible || !chapterId) return;
    setActiveTab('upcoming');
    setActiveCat('all');
    setLoading(true);
    fetchChapterEvents([chapterId])
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [visible, chapterId]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: ChapterEvent[] = [];
    const gone: ChapterEvent[] = [];
    for (const e of events) {
      if (!e.startDate) continue;
      const t = new Date(e.startDate).getTime();
      if (Number.isNaN(t)) continue;
      (t >= now ? up : gone).push(e);
    }
    up.sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
    gone.sort((a, b) => new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime());
    return { upcoming: up, past: gone };
  }, [events]);

  const displayed = (activeTab === 'upcoming' ? upcoming : past).filter(e => activeCat === 'all' || getEventCategory(e) === activeCat);

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable onPress={e => e.stopPropagation()} style={[styles.sheet, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl }]}>
        <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <View style={styles.eyebrowRow}>
                <View style={[styles.eyebrowLine, { backgroundColor: colors.gold }]} />
                <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldLight }]}>ETA {chapterName} · Events</Text>
              </View>
              <Text style={[fonts.display, styles.title, { color: '#fff' }]}>Upcoming Events</Text>
              <Text style={[fonts.regular, styles.headerSub, { color: 'rgba(255,255,255,0.6)' }]}>
                Meetups, panels, workshops, and webinars hosted by your chapter.
              </Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Close" style={styles.closeButton}>
              <X size={13} color="rgba(255,255,255,0.85)" strokeWidth={1.8} />
            </Pressable>
          </View>
        </LinearGradient>

        <View style={[styles.tabs, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          {(
            [
              ['upcoming', 'Upcoming', upcoming.length],
              ['past', 'Past', past.length],
            ] as const
          ).map(([tab, label, count]) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[styles.tabButton, { borderBottomColor: active ? colors.gold : 'transparent' }]}
              >
                <Text style={[fonts.semibold, styles.tabLabel, { color: active ? colors.ink : colors.ink3 }]}>{label}</Text>
                <View style={[styles.tabCount, { backgroundColor: active ? colors.gold : colors.surfaceSunken, borderRadius: radius.xxl }]}>
                  <Text style={[fonts.bold, styles.tabCountText, { color: active ? '#fff' : colors.ink2 }]}>{count}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.catRow, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}
          contentContainerStyle={styles.catRowContent}
        >
          {CATS.map(c => {
            const active = activeCat === c;
            const label = c === 'all' ? 'All' : CATEGORY_META[c].label;
            return (
              <Pressable
                key={c}
                onPress={() => setActiveCat(c)}
                style={[
                  styles.catChip,
                  { backgroundColor: active ? colors.navy : colors.surface2, borderColor: active ? colors.navy : colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xxl },
                ]}
              >
                <Text style={[active ? fonts.semibold : fonts.regular, styles.catChipText, { color: active ? '#fff' : colors.ink2 }]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} showsVerticalScrollIndicator={false}>
          {loading ? null : displayed.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}>
                <Calendar size={22} color={colors.ink3} strokeWidth={1.6} />
              </View>
              <Text style={[fonts.bold, styles.emptyTitle, { color: colors.ink }]}>No events match</Text>
              <Text style={[fonts.regular, styles.emptyBody, { color: colors.ink3 }]}>
                Try a different filter or check back soon — chapter leaders post new events weekly.
              </Text>
            </View>
          ) : (
            displayed.map((event, idx) => {
              const cat = getEventCategory(event);
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const hostColor = HOST_COLORS[idx % HOST_COLORS.length];
              return (
                <View
                  key={event.id}
                  style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}
                >
                  <View style={[styles.eventAccent, { backgroundColor: meta.color }]} />
                  <View style={styles.eventTop}>
                    <View style={[styles.eventIconWell, { backgroundColor: meta.bg, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
                      <Icon size={16} color={meta.color} strokeWidth={1.6} />
                    </View>
                    <View style={styles.eventTextWrap}>
                      <View style={[styles.catLabel, { backgroundColor: meta.bg, borderRadius: radius.xxl }]}>
                        <Text style={[fonts.bold, styles.catLabelText, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
                      </View>
                      <Text style={[fonts.semibold, styles.eventTitle, { color: colors.ink }]} numberOfLines={2}>
                        {event.title ?? 'Untitled event'}
                      </Text>
                      {!!event.startDate && (
                        <View style={styles.eventMetaRow}>
                          <Calendar size={11} color={colors.ink3} strokeWidth={1.6} />
                          <Text style={[fonts.semibold, styles.eventMetaText, { color: colors.ink }]}>{formatEventDate(event.startDate)}</Text>
                        </View>
                      )}
                      {!!event.location && (
                        <View style={styles.eventMetaRow}>
                          <MapPin size={11} color={colors.ink3} strokeWidth={1.6} />
                          <Text style={[fonts.regular, styles.eventMetaText, { color: colors.ink3 }]}>{event.location}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {!!event.description && (
                    <Text style={[fonts.regular, styles.eventDescription, { color: colors.ink2 }]} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}

                  <View style={[styles.eventFooter, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin, backgroundColor: colors.surface2 }]}>
                    <View style={[styles.hostAvatar, { backgroundColor: hostColor }]}>
                      <Text style={[fonts.bold, styles.hostInitials]}>{getHostInitials(event.title)}</Text>
                    </View>
                    <View style={styles.hostTextWrap}>
                      <Text style={[fonts.bold, styles.hostLabel, { color: colors.ink3 }]}>HOSTED BY</Text>
                      <Text style={[fonts.semibold, styles.hostName, { color: colors.ink }]} numberOfLines={1}>
                        {event.title || 'Chapter'}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,16,24,0.5)',
  },
  sheet: {
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    padding: 18,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  eyebrowLine: {
    width: 16,
    height: 1,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 21,
  },
  headerSub: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tabLabel: {
    fontSize: 12,
  },
  tabCount: {
    minWidth: 16,
    paddingHorizontal: 5,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCountText: {
    fontSize: 9.5,
  },
  catRow: {
    flexGrow: 0,
  },
  catRowContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  catChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  catChipText: {
    fontSize: 11.5,
  },
  scroll: {
    flexShrink: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 50,
  },
  emptyIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    marginBottom: 4,
  },
  emptyBody: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  eventCard: {
    overflow: 'hidden',
    marginHorizontal: 18,
    marginTop: 12,
  },
  eventAccent: {
    height: 3,
  },
  eventTop: {
    flexDirection: 'row',
    gap: 11,
    padding: 13,
    paddingBottom: 8,
  },
  eventIconWell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  catLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 5,
  },
  catLabelText: {
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  eventTitle: {
    fontSize: 13.5,
    lineHeight: 18,
    marginBottom: 4,
  },
  eventMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  eventMetaText: {
    fontSize: 11,
  },
  eventDescription: {
    fontSize: 11.5,
    lineHeight: 17,
    paddingHorizontal: 13,
    paddingBottom: 10,
  },
  eventFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 11,
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostInitials: {
    fontSize: 9.5,
    color: '#fff',
  },
  hostTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  hostLabel: {
    fontSize: 8.5,
    letterSpacing: 0.6,
  },
  hostName: {
    fontSize: 11,
    marginTop: 1,
  },
});
