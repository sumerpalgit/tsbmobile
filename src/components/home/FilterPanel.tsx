import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon, IconName } from '../icons/Icon';
import { Pill } from '../Pill';
import { Switch } from '../Switch';
import { SegmentedControl } from '../SegmentedControl';
import { Button } from '../Button';

/**
 * Home feed "Filters" panel — matches the app bar/drawer/home reference (`TSB Home FV.html`)'s
 * Filters panel exactly for layout/options (visuals are sourced from the HTML design, per
 * project convention). Option value encoding for `postedWithin` follows webSrc's real
 * `SearchFilter.tsx`/`dashboard/page.tsx` instead (hour-count strings like `"168"`) since that's
 * what an eventual real feed-search API call will need — webSrc is the functional reference,
 * not the visual one.
 *
 * `onlyChapters` and `hideRsvpEvents` are shown (matching the design) but have no equivalent
 * anywhere in webSrc's real filter — confirmed there's no client- or server-side logic for
 * either on web, so they're UI-only until a real backend contract for them exists. Web's own
 * "Old to New" sort toggle isn't included, since it's not in this design.
 *
 * No feed exists yet to actually filter — this panel only produces a `FilterState` value via
 * `onApply`; wiring it to a real feed/search call is a later step once the feed itself is built.
 */

export type FilterState = {
  postTypes: string[];
  postedBy: string[];
  topics: string[];
  postedWithin: 'all' | '24' | '168' | '720';
  onlySaved: boolean;
  onlyChapters: boolean;
  hideAnonymous: boolean;
  hideRsvpEvents: boolean;
  activeOpportunitiesOnly: boolean;
};

export const EMPTY_FILTERS: FilterState = {
  postTypes: [],
  postedBy: [],
  topics: [],
  postedWithin: 'all',
  onlySaved: false,
  onlyChapters: false,
  hideAnonymous: false,
  hideRsvpEvents: false,
  activeOpportunitiesOnly: false,
};

export function countActiveFilters(f: FilterState): number {
  return (
    f.postTypes.length +
    f.postedBy.length +
    f.topics.length +
    (f.postedWithin !== 'all' ? 1 : 0) +
    (f.onlySaved ? 1 : 0) +
    (f.onlyChapters ? 1 : 0) +
    (f.hideAnonymous ? 1 : 0) +
    (f.hideRsvpEvents ? 1 : 0) +
    (f.activeOpportunitiesOnly ? 1 : 0)
  );
}

const POST_TYPES: { value: string; label: string }[] = [
  { value: 'ask', label: 'Ask the Community' },
  { value: 'investor', label: 'Investor Corner' },
  { value: 'capital', label: 'Search Capital' },
  { value: 'deal', label: 'Share a Deal' },
  { value: 'match', label: 'Find My Match' },
  { value: 'job', label: 'Jobs' },
  { value: 'event', label: 'Events' },
  { value: 'poll', label: 'Polls' },
];

const POSTED_BY: { value: string; label: string }[] = [
  { value: 'searchers', label: 'Searchers' },
  { value: 'investors', label: 'Investors' },
  { value: 'sellers', label: 'Sellers' },
  { value: 'advisors', label: 'Advisors' },
  { value: 'lenders', label: 'Lenders' },
  { value: 'anon', label: 'Anonymous' },
];

const TOPICS = [
  'LOI',
  'QoE / Diligence',
  'Tax DD',
  'SBA',
  'SaaS',
  'Industrials',
  'Healthcare',
  'Tech',
  'Consumer',
  'Logistics',
  'Financial Svcs',
  'Networking',
  'Lower mid-mkt',
];

const POSTED_WITHIN: { value: FilterState['postedWithin']; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: '24', label: '24 hrs' },
  { value: '168', label: 'This week' },
  { value: '720', label: 'This month' },
];

type ToggleKey = 'onlySaved' | 'onlyChapters' | 'hideAnonymous' | 'hideRsvpEvents' | 'activeOpportunitiesOnly';

const RELEVANCE_TOGGLES: { key: ToggleKey; icon: IconName; label: string; sub: string }[] = [
  { key: 'onlySaved', icon: 'bookmark', label: 'Only saved posts', sub: "Posts you've bookmarked" },
  { key: 'onlyChapters', icon: 'etaChapters', label: 'Only my chapters', sub: 'Chicago, NY, SF Bay Area' },
  { key: 'hideAnonymous', icon: 'account', label: 'Hide anonymous posts', sub: 'Skip posts with identity hidden' },
  {
    key: 'hideRsvpEvents',
    icon: 'calendar',
    label: "Hide events I've RSVP'd",
    sub: "Keep the feed focused on what's new",
  },
  {
    key: 'activeOpportunitiesOnly',
    icon: 'trendingUp',
    label: 'Active opportunities only',
    sub: 'Deals under LOI, open RSVPs, hiring posts',
  },
];

export function FilterPanel({
  visible,
  initialFilters,
  onClose,
  onApply,
}: {
  visible: boolean;
  initialFilters: FilterState;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}) {
  const { colors, fonts, fontSize, spacing, radius, borderWidth, letterSpacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(initialFilters);
  const [topicQuery, setTopicQuery] = useState('');

  // Matches the reference's `tsbSlideIn` keyframe (`translateX(28px) → translateX(0)`) — a
  // horizontal slide from the right, not RN Modal's built-in `animationType="slide"`, which
  // only ever animates vertically from the bottom. Driven manually instead: `shouldRender`
  // keeps the Modal mounted through the exit animation (Modal's own `visible` toggling off
  // would otherwise unmount it instantly, before the slide-out can play).
  const screenWidth = Dimensions.get('window').width;
  const [shouldRender, setShouldRender] = useState(visible);
  const translateX = useRef(new Animated.Value(visible ? 0 : screenWidth)).current;

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setDraft(initialFilters);
      setTopicQuery('');
      translateX.setValue(screenWidth);
      Animated.timing(translateX, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: screenWidth, duration: 220, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setShouldRender(false);
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const toggleArrayValue = (key: 'postTypes' | 'postedBy' | 'topics', value: string) => {
    setDraft(prev => {
      const current = prev[key];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const activeCount = countActiveFilters(draft);
  const filteredTopics = TOPICS.filter(t => t.toLowerCase().includes(topicQuery.trim().toLowerCase()));

  return (
    <Modal visible={shouldRender} animationType="none" transparent onRequestClose={onClose}>
      <Animated.View
        style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top, transform: [{ translateX }] }]}
      >
        <View
          style={[
            styles.header,
            { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.eyebrowRow}>
                <View style={[styles.eyebrowDash, { backgroundColor: colors.gold }]} />
                <Text
                  style={[
                    fonts.bold,
                    styles.eyebrow,
                    { color: colors.goldDark, letterSpacing: letterSpacing.wider },
                  ]}
                >
                  Refine your feed
                </Text>
              </View>
              <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Filters</Text>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={[
                styles.closeButton,
                { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg },
              ]}
            >
              <Icon name="close" size={14} color={colors.ink2} />
            </Pressable>
          </View>
          <Text style={[fonts.regular, styles.subtitle, { color: colors.ink2 }]}>
            Narrow what shows in your feed. Filters stack — pick from any group.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <FilterSection icon="docList" title="Post type" count={draft.postTypes.length}>
            <ChipWrap>
              {POST_TYPES.map(t => (
                <Pill
                  key={t.value}
                  label={t.label}
                  selected={draft.postTypes.includes(t.value)}
                  onPress={() => toggleArrayValue('postTypes', t.value)}
                />
              ))}
            </ChipWrap>
          </FilterSection>

          <FilterSection icon="people" title="Posted by" count={draft.postedBy.length}>
            <ChipWrap>
              {POSTED_BY.map(b => (
                <Pill
                  key={b.value}
                  label={b.label}
                  selected={draft.postedBy.includes(b.value)}
                  onPress={() => toggleArrayValue('postedBy', b.value)}
                />
              ))}
            </ChipWrap>
          </FilterSection>

          <FilterSection icon="grid" title="Topic & sector" count={draft.topics.length}>
            <View
              style={[
                styles.topicSearch,
                { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg },
              ]}
            >
              <Icon name="search" size={15} color={colors.ink3} />
              <TextInput
                value={topicQuery}
                onChangeText={setTopicQuery}
                placeholder="Search topics (e.g. QoE, SaaS, LOI)…"
                placeholderTextColor={colors.ink3}
                style={[styles.topicInput, { fontSize: fontSize.body, color: colors.ink }]}
              />
            </View>
            <View style={{ height: spacing.md }} />
            <ChipWrap>
              {filteredTopics.map(topic => (
                <Pill
                  key={topic}
                  label={topic}
                  selected={draft.topics.includes(topic)}
                  onPress={() => toggleArrayValue('topics', topic)}
                />
              ))}
            </ChipWrap>
          </FilterSection>

          <FilterSection icon="clock" title="Posted within" count={draft.postedWithin !== 'all' ? 1 : 0}>
            <SegmentedControl
              options={POSTED_WITHIN}
              value={draft.postedWithin}
              onChange={v => setDraft(prev => ({ ...prev, postedWithin: v }))}
            />
          </FilterSection>

          <FilterSection icon="check" title="More relevance">
            {RELEVANCE_TOGGLES.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.toggleRow,
                  index < RELEVANCE_TOGGLES.length - 1 && {
                    borderBottomColor: colors.border,
                    borderBottomWidth: borderWidth.hairline,
                  },
                ]}
              >
                <Icon name={item.icon} size={16} color={colors.ink2} />
                <View style={{ flex: 1 }}>
                  <Text style={[fonts.semibold, styles.toggleLabel, { color: colors.ink }]}>{item.label}</Text>
                  <Text style={[fonts.regular, styles.toggleSub, { color: colors.ink3 }]}>{item.sub}</Text>
                </View>
                <Switch
                  value={draft[item.key]}
                  onValueChange={next => setDraft(prev => ({ ...prev, [item.key]: next }))}
                />
              </View>
            ))}
          </FilterSection>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: borderWidth.thin,
              paddingBottom: 16 + insets.bottom,
            },
          ]}
        >
          <Button label="Clear" icon="close" variant="secondary" disabled={activeCount === 0} onPress={() => setDraft(EMPTY_FILTERS)} />
          <Button
            label={activeCount === 0 ? 'Show all posts' : `Apply ${activeCount} filter${activeCount === 1 ? '' : 's'}`}
            icon="checkmark"
            variant="primary"
            fullWidth
            onPress={() => onApply(draft)}
          />
        </View>
      </Animated.View>
    </Modal>
  );
}

function FilterSection({
  icon,
  title,
  count,
  children,
}: {
  icon: IconName;
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  const hasBadge = count !== undefined;

  return (
    <View style={[styles.section, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.hairline }]}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={16} color={colors.goldDark} />
        <Text style={[fonts.bold, styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
        {hasBadge && (
          <View
            style={[
              styles.badge,
              { borderRadius: radius.lg, backgroundColor: count! > 0 ? colors.chip : colors.surfaceSunken },
            ]}
          >
            <Text style={[fonts.bold, styles.badgeText, { color: count! > 0 ? colors.goldDark : colors.ink3 }]}>
              {count! > 0 ? `${count} selected` : 'Any'}
            </Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipWrap}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDash: {
    width: 16,
    height: 2,
    borderRadius: 2,
  },
  eyebrow: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 27,
    marginTop: 8,
    lineHeight: 30,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 11,
  },
  body: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  section: {
    paddingVertical: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 13,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 12,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 13,
    borderWidth: 1,
  },
  topicInput: {
    flex: 1,
    padding: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 14,
  },
  toggleLabel: {
    fontSize: 13.5,
  },
  toggleSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
