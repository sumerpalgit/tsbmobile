import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { Bookmark, MapPin, MessageSquare, Star, UserRound } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import { avatarColor } from '../../types/messages';
import { LinkedInIcon } from '../../screens/auth/authShared';
import { normalizeLinkedInUrl } from '../../types/directory';
import type { Profile } from '../../types/directory';

/** One directory member card — matches `Directory.html`'s "MEMBER CARDS" (~line 262) for
 * layout/visual language, minus the mockup's fabricated match-score badge / mutual-connections
 * line (no real backing field, see the plan's mismatch #3). Footer buttons are the real ones
 * `webSrc/.../directory/page.tsx:661-688` actually renders — "View Profile", "Message", and a
 * LinkedIn icon button — **not** the mockup's own "Connect" button, which doesn't exist anywhere
 * on real web's Directory cards (confirmed by reading the real footer directly, not just the
 * mockup); "View Profile" takes that same visually-primary slot instead, styled the same way the
 * mockup styles its own primary card action. */
export function MemberCard({
  profile,
  saved,
  onOpen,
  onToggleSave,
  onMessage,
}: {
  profile: Profile;
  saved: boolean;
  onOpen: () => void;
  onToggleSave: () => void;
  onMessage: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  const locationLine = [profile.city, profile.state_code].filter(Boolean).join(', ');
  const hasRating = (profile.total_reviews ?? 0) > 0;

  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <Avatar name={profile.name} imageUri={profile.profile_img} size={46} fallbackColor={avatarColor(profile.name)} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[fonts.bold, styles.name, { color: colors.ink }]} numberOfLines={1}>
            {profile.name}
          </Text>
          <View style={styles.roleRow}>
            {!!profile.role_type && (
              <View style={[styles.roleBadge, { backgroundColor: colors.feedFill, borderRadius: radius.sm }]}>
                <Text style={[fonts.bold, styles.roleBadgeText, { color: colors.feedOnFill }]}>{profile.role_type.toUpperCase()}</Text>
              </View>
            )}
            {!!profile.sub_category && (
              <Text style={[fonts.regular, styles.sub, { color: colors.ink2 }]} numberOfLines={1}>
                {profile.sub_category}
              </Text>
            )}
          </View>
          <View style={styles.locRow}>
            {!!locationLine && (
              <View style={styles.locGroup}>
                <MapPin size={11} color={colors.ink3} strokeWidth={1.6} />
                <Text style={[fonts.regular, styles.loc, { color: colors.ink3 }]} numberOfLines={1}>
                  {locationLine}
                </Text>
              </View>
            )}
            {hasRating ? (
              <View style={styles.ratingGroup}>
                {!!locationLine && <View style={[styles.dot, { backgroundColor: colors.border }]} />}
                <Star size={11} color={colors.gold} fill={colors.gold} strokeWidth={1.1} />
                <Text style={[fonts.bold, styles.ratingValue, { color: colors.ink }]}>{(profile.avg_rating ?? 0).toFixed(1)}</Text>
                <Text style={[fonts.regular, styles.ratingCount, { color: colors.ink3 }]}>({profile.total_reviews})</Text>
              </View>
            ) : (
              /* Matches web exactly (`page.tsx:625-644`) — "New" here means "no reviews yet"
               * (`total_reviews === 0`), real backend data, not the mockup's fabricated
               * joined-date `isNew` field dropped elsewhere in this build. */
              <View style={[styles.newBadge, { backgroundColor: colors.chip, borderColor: colors.goldLight, borderRadius: radius.sm }]}>
                <Text style={[fonts.semibold, styles.newBadgeText, { color: colors.goldDark }]}>New</Text>
              </View>
            )}
          </View>
        </View>
        <Pressable
          onPress={onToggleSave}
          accessibilityLabel="Save member"
          hitSlop={8}
          style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
        >
          <Bookmark size={16} color={saved ? colors.gold : colors.ink3} fill={saved ? colors.gold : 'transparent'} strokeWidth={1.6} />
        </Pressable>
      </View>

      <Text
        style={[fonts.regular, styles.bio, { color: profile.bio ? colors.ink2 : colors.ink3 }, !profile.bio && styles.bioEmpty]}
        numberOfLines={2}
      >
        {profile.bio || 'No bio provided yet.'}
      </Text>

      {!!profile.sub_category && (
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { backgroundColor: colors.chip, borderRadius: radius.md }]}>
            <Text style={[fonts.semibold, styles.tagText, { color: colors.goldDark }]}>{profile.sub_category}</Text>
          </View>
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
        <Pressable
          onPress={onOpen}
          style={({ pressed }) => [
            styles.viewProfileButton,
            { backgroundColor: colors.feedFill, borderRadius: radius.lg },
            pressed && styles.pressed,
          ]}
        >
          <UserRound size={15} color={colors.feedOnFill} strokeWidth={1.6} />
          <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.feedOnFill }]}>View Profile</Text>
        </Pressable>
        <Pressable
          onPress={onMessage}
          style={({ pressed }) => [
            styles.messageButton,
            { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin },
            pressed && styles.pressed,
          ]}
        >
          <MessageSquare size={15} color={colors.ink} strokeWidth={1.6} />
          <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>Message</Text>
        </Pressable>
        {!!profile.linkedin_url && (
          <Pressable
            onPress={() =>
              Linking.openURL(normalizeLinkedInUrl(profile.linkedin_url!)).catch(() =>
                Toast.show({ type: 'error', text1: 'Could not open LinkedIn link' }),
              )
            }
            accessibilityLabel="View LinkedIn profile"
            style={({ pressed }) => [styles.linkedinButton, pressed && styles.pressed]}
          >
            <View style={[styles.linkedinWell, { backgroundColor: colors.linkedinIconSurface }]}>
              <LinkedInIcon />
            </View>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 11,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
  },
  name: {
    fontSize: 15,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  roleBadgeText: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  sub: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  locGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  loc: {
    fontSize: 11.5,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  ratingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingValue: {
    fontSize: 11.5,
  },
  ratingCount: {
    fontSize: 10.5,
  },
  newBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  newBadgeText: {
    fontSize: 10,
  },
  saveButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bio: {
    fontSize: 13,
    lineHeight: 19,
  },
  bioEmpty: {
    fontStyle: 'italic',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 11,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 11,
  },
  viewProfileButton: {
    flex: 1.3,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  messageButton: {
    flex: 1,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  linkedinButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedinWell: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});
