import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronDown, Quote, Star } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';
import type { Testimonial } from '../../../api/testimonials';
import { fetchProfileByUsername } from '../../../api/profile';
import type { AppStackParamList } from '../../../navigation/types';

const TRUNCATE_AT = 220;

/**
 * Matches the mockup's testimonial card (avatar/name/stars/role badge, quote body with
 * Read-more, gold-bordered "FEATURED" treatment, date + Feature toggle footer) and web's real
 * field set (`rating`, `is_featured`, `known_duration`, `reviewer.designation`/`organization`/
 * `role_type` — all confirmed real). Two things intentionally NOT built, both confirmed via
 * direct research rather than assumed:
 * - No "verified" checkmark next to the name — web's card shows one, but it's not backed by any
 *   real field on `Reviewer` (same reasoning as View Profile's own header dropping the mockup's
 *   fabricated "Top Investor" badge) — decorative-only on web, not ported here.
 * - Feature/Unfeature is session-only local state, NOT a real API call — confirmed web's own
 *   `setFeatured(!featured)` is local component state with no backend endpoint behind it, and
 *   the "···" overflow button web renders has no `onClick` handler at all (dead UI on web
 *   itself) — omitted here rather than building a fake menu with nothing in it.
 */
export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const { colors, fonts, elevation } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [expanded, setExpanded] = useState(false);
  const [featured, setFeatured] = useState(testimonial.is_featured);
  const [opening, setOpening] = useState(false);

  const { reviewer } = testimonial;
  const filledStars = Math.round(testimonial.rating);
  const isLong = testimonial.testimonial.length > TRUNCATE_AT;
  const displayText = expanded || !isLong ? testimonial.testimonial : `${testimonial.testimonial.slice(0, TRUNCATE_AT)}…`;
  const subtitle = [reviewer.designation, reviewer.organization].filter(Boolean).join(' · ');
  const dateLabel = testimonial.created_at
    ? new Date(testimonial.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '';

  const handleOpenReviewer = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const profile = await fetchProfileByUsername(reviewer.username);
      navigation.navigate('MemberProfile', { profile, initialSaved: false });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open profile' });
    } finally {
      setOpening(false);
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        featured && { borderLeftWidth: 3, borderLeftColor: colors.gold },
        elevation('sm'),
      ]}
    >
      {featured && (
        <View style={[styles.featuredBadge, { backgroundColor: colors.chip }]}>
          <Star size={9} color={colors.goldDark} fill={colors.goldDark} strokeWidth={0} />
          <Text style={[fonts.bold, styles.featuredBadgeText, { color: colors.goldDark }]}>FEATURED</Text>
        </View>
      )}

      <Pressable onPress={handleOpenReviewer} disabled={opening} style={styles.headerRow}>
        <Avatar name={reviewer.name} imageUri={reviewer.profile_img} size={38} />
        <View style={styles.headerMeta}>
          <Text style={[fonts.bold, styles.name, { color: colors.ink }]} numberOfLines={1}>{reviewer.name}</Text>
          {!!subtitle && (
            <Text style={[fonts.regular, styles.subtitle, { color: colors.ink3 }]} numberOfLines={1}>{subtitle}</Text>
          )}
          <View style={styles.statsLine}>
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={11} color={colors.gold} fill={i < filledStars ? colors.gold : 'transparent'} strokeWidth={1.2} />
              ))}
            </View>
            {!!reviewer.role_type && (
              <View style={[styles.roleBadge, { backgroundColor: colors.surfaceSunken }]}>
                <Text style={[fonts.bold, styles.roleBadgeText, { color: colors.ink2 }]}>{reviewer.role_type.toUpperCase()}</Text>
              </View>
            )}
          </View>
          {!!testimonial.known_duration && (
            <Text style={[fonts.regular, styles.knownText, { color: colors.ink3 }]}>Known {testimonial.known_duration}</Text>
          )}
        </View>
        {opening && <ActivityIndicator size="small" color={colors.ink3} />}
      </Pressable>

      <View style={styles.bodyRow}>
        <Quote size={13} color={colors.borderSoft} strokeWidth={2} style={styles.quoteIcon} />
        <Text style={[fonts.regular, styles.body, { color: colors.ink2 }]}>{displayText}</Text>
      </View>

      {isLong && (
        <Pressable onPress={() => setExpanded(v => !v)} style={styles.readMore}>
          <ChevronDown size={13} color={colors.gold} strokeWidth={2} style={expanded ? styles.chevronUp : undefined} />
          <Text style={[fonts.bold, styles.readMoreText, { color: colors.gold }]}>{expanded ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      )}

      <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
        <Text style={[fonts.regular, styles.dateText, { color: colors.ink3 }]}>{dateLabel}</Text>
        <Pressable
          onPress={() => setFeatured(v => !v)}
          style={[styles.featureButton, { borderColor: featured ? colors.border : colors.authFieldBorder, backgroundColor: featured ? colors.chip : colors.authField }]}
        >
          <Star size={12} color={colors.goldDark} fill={featured ? colors.goldDark : 'transparent'} strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.featureButtonText, { color: colors.goldDark }]}>
            {featured ? 'Unfeature' : 'Feature'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, marginBottom: 9 },
  featuredBadgeText: { fontSize: 9, letterSpacing: 0.5 },
  headerRow: { flexDirection: 'row', gap: 10 },
  headerMeta: { flex: 1, minWidth: 0 },
  name: { fontSize: 13.5 },
  subtitle: { fontSize: 11.5, marginTop: 1 },
  statsLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  starsRow: { flexDirection: 'row', gap: 1.5 },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  roleBadgeText: { fontSize: 8.5, letterSpacing: 0.5 },
  knownText: { fontSize: 10.5, marginTop: 3 },
  bodyRow: { flexDirection: 'row', gap: 7, marginTop: 12 },
  quoteIcon: { marginTop: 2 },
  body: { flex: 1, fontSize: 12.5, lineHeight: 20 },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, marginLeft: 20 },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  readMoreText: { fontSize: 11.5 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    paddingTop: 11,
  },
  dateText: { fontSize: 11 },
  featureButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, borderWidth: 1 },
  featureButtonText: { fontSize: 11 },
});
