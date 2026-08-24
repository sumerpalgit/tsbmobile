import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';
import type { Profile } from '../../../types/directory';

/** Matches web's real `AVATAR_COLORS` (`thesis-shared.tsx:458`) — a rotating fallback-avatar
 * palette (`AVATAR_COLORS[idx % AVATAR_COLORS.length]`), not the single flat fallback color
 * `Avatar` normally uses everywhere else in this app. This was missed on the first pass (every
 * card rendered with the same fallback color) until caught against a real web screenshot. */
function avatarColorAt(colors: ReturnType<typeof useTheme>['colors'], index: number): string {
  const palette = [colors.hero1, colors.goldDark, '#1A5C35', '#4A2060', '#1A4060'];
  return palette[index % palette.length];
}

/** Same opacity-pulse shimmer pattern as `ResourceCardSkeleton.tsx`/Analytics' own skeleton —
 * matches web's own `animate-pulse` 3-card loading state (`thesis-shared.tsx:548-558`), which was
 * also missing on the first pass (the whole row silently stayed empty/hidden while loading instead
 * of showing this). */
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

/**
 * "Similar {role}s you may know" horizontal row — card look matches the mockup's `imSimilar`
 * cards (decoded `profilelast_decoded_role.html:2627-2639`: avatar, name, role/location meta,
 * "View profile" button), but two real web BEHAVIORS were missing on the first pass and are now
 * matched: the whole section shows a 3-card skeleton while the similar-profiles fetch is in
 * flight (previously just silently rendered nothing until data arrived, since `profiles.length
 * === 0` looked identical to "still loading" and "genuinely none found"), and the fallback avatar
 * uses a rotating color palette per card index (previously every card used the same flat fallback
 * color). Built generic (profiles + heading text as props) since every future Role Thesis phase
 * needs the same shape with a different heading and role filter, not just Intermediary — same
 * reasoning as `RoleThesisCompleteness`/`RoleThesisSectionCard`.
 */
export function SimilarProfilesRow({
  heading,
  profiles,
  loading,
  onViewProfile,
}: {
  heading: string;
  profiles: Profile[];
  loading: boolean;
  onViewProfile: (profile: Profile) => void;
}) {
  const { colors, fonts } = useTheme();

  if (!loading && profiles.length === 0) return null;

  return (
    <View>
      <Text style={[fonts.bold, styles.heading, { color: colors.ink3 }]}>{heading}</Text>
      {loading ? (
        <View style={styles.row}>
          {[0, 1, 2].map(i => (
            <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder }]}>
              <Shimmer width={48} height={48} radius={24} />
              <View style={styles.skeletonLine}>
                <Shimmer width="70%" height={12} />
              </View>
              <View style={styles.skeletonLine}>
                <Shimmer width="50%" height={10} />
              </View>
              <View style={styles.skeletonButton}>
                <Shimmer width="100%" height={32} radius={10} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {profiles.map((profile, index) => {
            const meta = [profile.designation || profile.role_type, profile.city].filter(Boolean).join(' · ');
            return (
              <View key={profile.username} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder }]}>
                <Avatar name={profile.name} imageUri={profile.profile_img} size={48} fallbackColor={avatarColorAt(colors, index)} textColor="#fff" />
                <Text style={[fonts.bold, styles.name, { color: colors.ink }]} numberOfLines={1}>{profile.name}</Text>
                {!!meta && <Text style={[fonts.regular, styles.meta, { color: colors.ink3 }]} numberOfLines={1}>{meta}</Text>}
                <Pressable
                  onPress={() => onViewProfile(profile)}
                  style={[styles.viewButton, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}
                >
                  <Text style={[fonts.bold, styles.viewButtonText, { color: colors.ink2 }]}>View profile</Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 10.5, letterSpacing: 0.6, textTransform: 'uppercase', marginHorizontal: 2, marginBottom: 8 },
  row: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  card: { width: 150, borderRadius: 15, borderWidth: 1, padding: 14, alignItems: 'center' },
  name: { fontSize: 12.5, marginTop: 9, alignSelf: 'stretch', textAlign: 'center' },
  meta: { fontSize: 10.5, marginTop: 2, alignSelf: 'stretch', textAlign: 'center' },
  viewButton: { alignSelf: 'stretch', height: 36, marginTop: 11, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  viewButtonText: { fontSize: 11.5 },
  skeletonLine: { alignSelf: 'stretch', alignItems: 'center', marginTop: 9 },
  skeletonButton: { alignSelf: 'stretch', marginTop: 11 },
});
