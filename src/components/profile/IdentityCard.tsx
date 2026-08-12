import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import type { Profile } from '../../types/directory';

/** Same opacity-pulse shimmer as `MemberCardSkeleton.tsx` — kept local per that file's own
 * convention (not shared/exported across skeleton files). */
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

/** Top card on the Profile screen — avatar, name, role badge, city. Matches `Profile.html`'s
 * "IDENTITY CARD" (~line 199) exactly, except the avatar is the shared `Avatar` component (real
 * photo with initials fallback, matching the mockup's flat navy/white look when there's none)
 * instead of the mockup's own hardcoded "NM" div, and every field comes from the logged-in user's
 * real profile instead of the mockup's fixture data. */
export function IdentityCard({ profile, loading }: { profile: Profile | null; loading: boolean }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  if (loading && !profile) {
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
        <View style={styles.topRow}>
          <Shimmer width={52} height={52} radius={26} />
          <View style={styles.info}>
            <Shimmer width="60%" height={16} />
            <Shimmer width="45%" height={13} />
          </View>
        </View>
      </View>
    );
  }

  const locationLine = [profile?.city, profile?.state_code].filter(Boolean).join(', ');

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
      <View style={styles.topRow}>
        <Avatar name={profile?.name} imageUri={profile?.profile_img} size={52} fallbackColor={colors.feedFill} textColor={colors.feedOnFill} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[fonts.display, styles.name, { color: colors.ink }]} numberOfLines={1}>
            {profile?.name || 'Your profile'}
          </Text>
          <View style={styles.metaRow}>
            {!!profile?.role_type && (
              <View style={[styles.roleBadge, { backgroundColor: colors.gold, borderRadius: radius.sm }]}>
                <Text style={[fonts.bold, styles.roleBadgeText, { color: colors.onGold }]}>{profile.role_type}</Text>
              </View>
            )}
            {!!locationLine && (
              <View style={styles.locGroup}>
                <MapPin size={11} color={colors.ink3} strokeWidth={1.6} />
                <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3 }]} numberOfLines={1}>
                  {locationLine}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  name: {
    fontSize: 18,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 9.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
