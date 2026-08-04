import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';
import { Avatar } from '../../Avatar';
import { Icon } from '../../icons/Icon';
import type { FeedProfile } from '../../../api/feed';
import { formatRelativeTime } from '../../../utils/formatRelativeTime';

/**
 * Avatar, name, role chip, meta line, plus the "quick profile" and save buttons — copied
 * exactly from the feed-card examples hand-authored in `TSB Home FV.html` (avatar `background:
 * var(--fill)`/`--onfill`, meta line `"{org} · {city} · {time}"`, both trailing buttons in the
 * header row, NOT in the actions row below like an earlier, wrong first pass had them).
 * Identical across every `feed_type`, so built once and reused by all 8 `PostCard` variants.
 *
 * `onQuickProfile` is optional — the mockup's tap target opens a profile-preview overlay that
 * doesn't exist yet, so the button still renders (matching the design) but is a no-op until
 * that overlay is built.
 */
export function PostCardHeader({
  profile,
  createdAt,
  isAnonymous,
  saved = false,
  onSave,
  onQuickProfile,
}: {
  profile: FeedProfile;
  createdAt: string;
  isAnonymous: boolean;
  saved?: boolean;
  onSave?: () => void;
  onQuickProfile?: () => void;
}) {
  const { colors, fonts, fontSize, spacing, radius } = useTheme();

  const displayName = isAnonymous ? 'Anonymous' : profile.name;
  const roleLabel = isAnonymous ? null : profile.role_type ?? profile.sub_category;
  // First segment is `sub_category` if present, else `organization`, else "Independent" — same
  // fallback confirmed on the quick-profile overlay (`PostCardQuickProfile.tsx`): a searcher's
  // second identity line is their `sub_category`, an employer's is their `organization`, not one
  // fixed field.
  const metaLine = [
    isAnonymous ? null : profile.sub_category ?? profile.organization ?? 'Independent',
    profile.city,
    formatRelativeTime(createdAt),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <Avatar
        name={isAnonymous ? undefined : displayName}
        imageUri={isAnonymous ? null : profile.profile_img}
        size={44}
        fallbackColor={colors.feedFill}
        textColor={colors.feedOnFill}
      />

      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text style={[fonts.bold, { fontSize: fontSize.subtitle, color: colors.ink }]} numberOfLines={1}>
            {displayName}
          </Text>
          {!!roleLabel && (
            <View style={[styles.roleBadge, { backgroundColor: colors.chip, borderRadius: radius.sm }]}>
              <Text style={[fonts.bold, { fontSize: 9, color: colors.goldDark, letterSpacing: 0.4 }]}>
                {roleLabel.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        {!!metaLine && (
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, marginTop: 2 }]} numberOfLines={1}>
            {metaLine}
          </Text>
        )}
      </View>

      <Pressable
        onPress={onQuickProfile}
        accessibilityRole="button"
        accessibilityLabel="Quick profile"
        style={[styles.iconButton, { backgroundColor: colors.chip, borderRadius: radius.md }]}
      >
        <Icon name="idCard" size={15} color={colors.goldDark} />
      </Pressable>

      <Pressable onPress={onSave} accessibilityRole="button" accessibilityLabel="Save" style={styles.iconButton}>
        <Icon name="bookmark" size={16} filled={saved} color={saved ? colors.gold : colors.ink3} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  meta: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  iconButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
