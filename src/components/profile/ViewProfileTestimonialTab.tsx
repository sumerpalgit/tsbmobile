import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Plus, Star } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { fetchMyTestimonials, Testimonial } from '../../api/testimonials';
import { TestimonialCard } from './testimonial/TestimonialCard';
import { RequestTestimonialSheet } from './testimonial/RequestTestimonialSheet';

type FilterKey = 'all' | 'featured' | 'fiveStar';

function lastReceivedLabel(testimonials: Testimonial[]): string {
  if (testimonials.length === 0) return '';
  const latest = testimonials.reduce((max, t) => (t.created_at > max ? t.created_at : max), testimonials[0].created_at);
  const then = new Date(latest).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return 'Last received today';
  if (days < 30) return `Last received ${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Last received ${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `Last received ${years} year${years === 1 ? '' : 's'} ago`;
}

/**
 * View Profile's Testimonial tab — Phase 4. Matches the mockup's summary/rating card + filter
 * chips + testimonial-card list + "Request Testimonial" flow, built against web's real confirmed
 * endpoints (`GET /testimonial/:username`, `GET /follow/:username/followers`,
 * `POST /testimonial/request` — all verified via direct research, not assumed).
 *
 * The rating summary (average, 5-row star distribution, featured/five-star counts, "last
 * received") is computed CLIENT-SIDE from the already-fetched flat list — no separate summary
 * endpoint exists (only the one list endpoint was found), same reasoning as the mockup's own
 * static demo values being per-testimonial-derived rather than a distinct API concept.
 *
 * No paginated `FlatList` here (unlike Posts' Phase 3) — `fetchMyTestimonials` returns the full
 * flat list in one call, matching web (no page/limit params on that endpoint), so this renders
 * inside `ViewProfileScreen`'s existing `KeyboardAwareScrollView` like Overview does, not as its
 * own scroll container.
 *
 * "Write a testimonial" / approve-reject flows are NOT built — confirmed via direct research that
 * no such endpoints exist anywhere in web's own codebase either (web's `is_approved` field is
 * declared but never read/filtered on). Only List + Request are real, so only List + Request are
 * built.
 */
export function ViewProfileTestimonialTab({ username }: { username: string }) {
  const { colors, fonts } = useTheme();
  const [loading, setLoading] = useState(true);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [requestOpen, setRequestOpen] = useState(false);

  const load = () => {
    setLoading(true);
    fetchMyTestimonials(username)
      .then(setTestimonials)
      .finally(() => setLoading(false));
  };

  useEffect(load, [username]);

  const stats = useMemo(() => {
    const total = testimonials.length;
    const avg = total > 0 ? testimonials.reduce((sum, t) => sum + t.rating, 0) / total : 0;
    const featuredCount = testimonials.filter(t => t.is_featured).length;
    const fiveStarCount = testimonials.filter(t => Math.round(t.rating) === 5).length;
    const distribution = [5, 4, 3, 2, 1].map(star => {
      const count = testimonials.filter(t => Math.round(t.rating) === star).length;
      return { star, count, pct: total > 0 ? (count / total) * 100 : 0 };
    });
    return { total, avg, featuredCount, fiveStarCount, distribution };
  }, [testimonials]);

  const filtered = useMemo(() => {
    if (filter === 'featured') return testimonials.filter(t => t.is_featured);
    if (filter === 'fiveStar') return testimonials.filter(t => Math.round(t.rating) === 5);
    return testimonials;
  }, [testimonials, filter]);

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'all', label: `All (${stats.total})` },
    { key: 'featured', label: `★ Featured (${stats.featuredCount})` },
    { key: 'fiveStar', label: `5★ Only (${stats.fiveStarCount})` },
  ];

  if (loading) {
    return <TestimonialSkeleton />;
  }

  return (
    <View style={styles.container}>
      {stats.total > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.summaryTopRow}>
            <View style={styles.avgBlock}>
              <Text style={[fonts.display, styles.avgValue, { color: colors.ink }]}>{stats.avg.toFixed(1)}</Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} size={11} color={colors.gold} fill={i < Math.round(stats.avg) ? colors.gold : 'transparent'} strokeWidth={1.2} />
                ))}
              </View>
              <Text style={[fonts.regular, styles.avgCaption, { color: colors.ink3 }]}>
                {stats.total} testimonial{stats.total === 1 ? '' : 's'}
              </Text>
            </View>

            <View style={styles.distBlock}>
              {stats.distribution.map(row => (
                <View key={row.star} style={styles.distRow}>
                  <Text style={[fonts.semibold, styles.distStarLabel, { color: colors.ink3 }]}>{row.star}</Text>
                  <Star size={9} color={colors.gold} fill={colors.gold} strokeWidth={0} />
                  <View style={[styles.distTrack, { backgroundColor: colors.surfaceSunken }]}>
                    <View style={[styles.distFill, { width: `${row.pct}%`, backgroundColor: colors.gold }]} />
                  </View>
                  <Text style={[fonts.regular, styles.distCount, { color: colors.ink3 }]}>{row.count}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.factsRow, { borderTopColor: colors.border }]}>
            {[
              `${stats.featuredCount} featured`,
              `${stats.fiveStarCount} five-star review${stats.fiveStarCount === 1 ? '' : 's'}`,
              lastReceivedLabel(testimonials),
            ].map(fact => (
              <View key={fact} style={styles.factRow}>
                <View style={[styles.factDot, { backgroundColor: colors.gold }]} />
                <Text style={[fonts.regular, styles.factText, { color: colors.ink2 }]}>{fact}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={() => setRequestOpen(true)}
            style={[styles.requestButton, { borderColor: colors.authFieldBorder, backgroundColor: colors.authField }]}
          >
            <Plus size={14} color={colors.ink} strokeWidth={2} />
            <Text style={[fonts.bold, styles.requestButtonText, { color: colors.ink }]}>Request Testimonial</Text>
          </Pressable>
        </View>
      )}

      {stats.total > 0 && (
        <View style={styles.chipRow}>
          {filters.map(f => {
            const active = f.key === filter;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[
                  styles.chip,
                  { borderColor: active ? colors.goldLight : colors.border, backgroundColor: active ? colors.chip : colors.surface },
                ]}
              >
                <Text style={[fonts.bold, styles.chipText, { color: active ? colors.goldDark : colors.ink2 }]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {stats.total === 0 ? (
        <View style={styles.emptyRoot}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceSunken }]}>
            <Star size={22} color={colors.ink3} strokeWidth={1.6} />
          </View>
          <Text style={[fonts.semibold, styles.emptyTitle, { color: colors.ink2 }]}>No testimonials yet</Text>
          <Text style={[fonts.regular, styles.emptySubtitle, { color: colors.ink3 }]}>
            Testimonials from your connections will appear here.
          </Text>
          <Pressable
            onPress={() => setRequestOpen(true)}
            style={[styles.requestButton, styles.emptyRequestButton, { borderColor: colors.authFieldBorder, backgroundColor: colors.authField }]}
          >
            <Plus size={14} color={colors.ink} strokeWidth={2} />
            <Text style={[fonts.bold, styles.requestButtonText, { color: colors.ink }]}>Request Testimonial</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={[styles.filterEmptyBox, { borderColor: colors.border, backgroundColor: colors.surfaceSunken }]}>
          <Star size={20} color={colors.ink3} strokeWidth={1.6} />
          <Text style={[fonts.semibold, styles.emptyTitle, { color: colors.ink2 }]}>
            {filter === 'featured' ? 'No featured testimonials yet' : 'No 5-star testimonials yet'}
          </Text>
          {filter === 'featured' && (
            <Text style={[fonts.regular, styles.emptySubtitle, { color: colors.ink3 }]}>
              Feature a testimonial to pin it to the top of your profile.
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.list}>
          {filtered.map(t => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </View>
      )}

      <RequestTestimonialSheet
        visible={requestOpen}
        username={username}
        onClose={() => setRequestOpen(false)}
        onSent={load}
      />
    </View>
  );
}

/** Same opacity-pulse shimmer as `ResourceCardSkeleton.tsx`/Role Thesis' own skeletons — replaces
 * this tab's original plain `ActivityIndicator`, matching this project's established
 * "skeleton over spinner" loading convention. */
function Shimmer({ width, height, radius = 6 }: { width: number | `${number}%`; height: number; radius?: number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceSunken }, { opacity }]} />;
}

/** Mirrors this tab's own real shape (summary card + filter chips + testimonial cards) rather
 * than a generic spinner — one shimmer card per real `TestimonialCard` (avatar + name/subtitle
 * lines + body lines + footer line), matching that component's actual layout. */
function TestimonialSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[skeletonStyles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={skeletonStyles.summaryTopRow}>
          <View style={skeletonStyles.avgBlock}>
            <Shimmer width={54} height={30} radius={6} />
            <Shimmer width={70} height={11} />
          </View>
          <View style={skeletonStyles.distBlock}>
            {[0, 1, 2, 3, 4].map(i => (
              <Shimmer key={i} width="100%" height={7} radius={3} />
            ))}
          </View>
        </View>
        <View style={[skeletonStyles.factsRow, { borderTopColor: colors.border }]}>
          <Shimmer width="60%" height={11} />
          <Shimmer width="45%" height={11} />
        </View>
      </View>

      <View style={styles.chipRow}>
        {[0, 1, 2].map(i => (
          <Shimmer key={i} width={80} height={34} radius={10} />
        ))}
      </View>

      <View style={styles.list}>
        {[0, 1].map(i => (
          <View key={i} style={[skeletonStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={skeletonStyles.cardHeader}>
              <Shimmer width={38} height={38} radius={19} />
              <View style={skeletonStyles.cardHeaderText}>
                <Shimmer width="50%" height={13} />
                <View style={skeletonStyles.cardHeaderLine}>
                  <Shimmer width="35%" height={11} />
                </View>
              </View>
            </View>
            <View style={skeletonStyles.cardBody}>
              <Shimmer width="100%" height={11} />
              <Shimmer width="90%" height={11} />
              <Shimmer width="60%" height={11} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 14 },
  summaryCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 15 },
  summaryTopRow: { flexDirection: 'row', gap: 16 },
  avgBlock: { alignItems: 'center', justifyContent: 'center', gap: 3, minWidth: 80 },
  avgValue: { fontSize: 32, letterSpacing: -0.5 },
  starsRow: { flexDirection: 'row', gap: 1.5 },
  avgCaption: { fontSize: 10.5 },
  distBlock: { flex: 1, gap: 5, justifyContent: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  distStarLabel: { fontSize: 10, width: 8 },
  distTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  distFill: { height: '100%', borderRadius: 3 },
  distCount: { fontSize: 10, width: 14, textAlign: 'right' },
  factsRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 13, paddingTop: 11, gap: 7 },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  factDot: { width: 4, height: 4, borderRadius: 2 },
  factText: { fontSize: 11.5 },
  requestButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, height: 42, borderRadius: 12, borderWidth: 1, marginTop: 13 },
  requestButtonText: { fontSize: 12.5 },
  emptyRequestButton: { marginTop: 16, alignSelf: 'stretch' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  chipText: { fontSize: 11.5 },
  list: { gap: 12 },
  emptyRoot: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 13.5, textAlign: 'center' },
  emptySubtitle: { fontSize: 12, textAlign: 'center', marginTop: 4 },
  filterEmptyBox: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 16, alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24, gap: 8 },
});

const skeletonStyles = StyleSheet.create({
  summaryCard: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 15 },
  summaryTopRow: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  avgBlock: { alignItems: 'center', justifyContent: 'center', gap: 7, minWidth: 80 },
  distBlock: { flex: 1, gap: 7, justifyContent: 'center' },
  factsRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 13, paddingTop: 11, gap: 8 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', gap: 10 },
  cardHeaderText: { flex: 1, minWidth: 0, gap: 6 },
  cardHeaderLine: { marginTop: 1 },
  cardBody: { gap: 6 },
});
