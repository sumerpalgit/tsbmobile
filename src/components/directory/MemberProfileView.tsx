import React from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { ArrowLeft, Bookmark, ExternalLink, MapPin, MessageSquare, Share2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { avatarColor } from '../../types/messages';
import { normalizeLinkedInUrl } from '../../types/directory';
import type { Profile } from '../../types/directory';

/** Lightweight Member Profile screen content — matches `Directory.html`'s "MEMBER PROFILE"
 * overlay (~line 341) for layout, structural template borrowed from `components/etaChapters/
 * ChapterDetailView.tsx` (hero band, stat/fact grid, footer CTA). Drops the mockup's fabricated
 * "Why this match" panel and mutual-connections line (no real backing field) and its "Connect"
 * button (real web has no Follow affordance on this lightweight view — only on the separate,
 * out-of-scope full profile page). Share uses RN's real `Share.share`, matching
 * `ChapterDetailView.tsx`'s own precedent for upgrading a mockup's toast-stub share button.
 *
 * Screen content only, not a `Modal` — same reasoning as `EventDetailView.tsx`'s own conversion:
 * this used to be its own `Modal` overlay (`MemberDetailSheet.tsx`), moved to a real pushed
 * screen (`MemberProfileScreen.tsx`, registered in `AppNavigator.tsx`) so "View Profile"
 * genuinely navigates (native push transition, back gesture) instead of opening a sheet — same
 * `useSafeAreaInsets()`-inside-`Modal` unreliability class of issue `EventDetailView.tsx`
 * documents, and matching real web's own `router.push('/dashboard/profiles/:username')`. */
export function MemberProfileView({
  profile,
  saved,
  onBack,
  onToggleSave,
  onMessage,
}: {
  profile: Profile;
  saved: boolean;
  onBack: () => void;
  onToggleSave: () => void;
  onMessage: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const locationLine = [profile.city, profile.state_code].filter(Boolean).join(', ');
  const facts: { k: string; v: string }[] = [];
  if (profile.role_type) facts.push({ k: 'Role', v: profile.role_type });
  if (profile.sub_category) facts.push({ k: 'Sub role', v: profile.sub_category });
  if (profile.designation) facts.push({ k: 'Designation', v: profile.designation });
  if (profile.organization) facts.push({ k: 'Organization', v: profile.organization });
  if (locationLine) facts.push({ k: 'Location', v: locationLine });

  const handleShare = () => {
    Share.share({ message: `Check out ${profile.name}'s profile on TSB.` }).catch(() => {});
  };

  const handleLinkedIn = () => {
    if (!profile.linkedin_url) return;
    Linking.openURL(normalizeLinkedInUrl(profile.linkedin_url)).catch(() =>
      Toast.show({ type: 'error', text1: 'Could not open LinkedIn link' }),
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
        <Pressable onPress={onBack} accessibilityLabel="Back" style={styles.headerButton}>
          <ArrowLeft size={18} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
        <Text style={[fonts.semibold, styles.headerTitle, { color: colors.ink2 }]}>Member profile</Text>
        <Pressable
          onPress={onToggleSave}
          accessibilityLabel="Save"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <Bookmark size={17} color={saved ? colors.gold : colors.ink2} fill={saved ? colors.gold : 'transparent'} strokeWidth={1.6} />
        </Pressable>
        <Pressable
          onPress={handleShare}
          accessibilityLabel="Share"
          style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}
        >
          <Share2 size={16} color={colors.ink2} strokeWidth={1.6} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.heroRow}>
            <View style={[styles.avatar, { backgroundColor: avatarColor(profile.name), borderRadius: radius.pill }]}>
              <Text style={[fonts.bold, { fontSize: 22, color: '#fff' }]}>
                {profile.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[fonts.bold, styles.heroName]} numberOfLines={1}>
                {profile.name}
              </Text>
              {!!profile.sub_category && (
                <Text style={[fonts.regular, styles.heroSub]} numberOfLines={1}>
                  {profile.sub_category}
                </Text>
              )}
              {!!locationLine && (
                <View style={styles.heroLocRow}>
                  <MapPin size={11} color="rgba(255,255,255,0.6)" strokeWidth={1.6} />
                  <Text style={styles.heroLoc}>{locationLine}</Text>
                </View>
              )}
            </View>
          </View>
          {!!profile.role_type && (
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroBadge, { backgroundColor: colors.goldLight }]}>
                <Text style={[fonts.semibold, styles.heroBadgeText, { color: '#182E43' }]}>{profile.role_type}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <View style={styles.body}>
          <View style={styles.section}>
            <View style={styles.sectionLabelRow}>
              <View style={[styles.accentBar, { backgroundColor: colors.gold }]} />
              <Text style={[fonts.bold, styles.sectionLabelText, { color: colors.goldDark }]}>ABOUT</Text>
            </View>
            <Text style={[fonts.regular, styles.cardBody, { color: profile.bio ? colors.ink2 : colors.ink3 }, !profile.bio && styles.italic]}>
              {profile.bio || 'This member has not added a bio yet.'}
            </Text>
          </View>

          {facts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <View style={[styles.accentBar, { backgroundColor: colors.gold }]} />
                <Text style={[fonts.bold, styles.sectionLabelText, { color: colors.goldDark }]}>SNAPSHOT</Text>
              </View>
              <View style={styles.factsGrid}>
                {facts.map(f => (
                  <View key={f.k} style={[styles.factCell, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}>
                    <Text style={[fonts.bold, styles.factKey, { color: colors.ink3 }]}>{f.k.toUpperCase()}</Text>
                    <Text style={[fonts.bold, styles.factValue, { color: colors.ink }]} numberOfLines={2}>
                      {f.v}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Mockup's "Focus areas" section shows multiple fabricated demo tags with no real
           * backing field — the real `Profile` type only has the single `sub_category` string
           * (already the same field the card's own tag chip uses), so this renders that as one
           * chip instead of inventing extra tags. */}
          {!!profile.sub_category && (
            <View style={styles.section}>
              <View style={styles.sectionLabelRow}>
                <View style={[styles.accentBar, { backgroundColor: colors.gold }]} />
                <Text style={[fonts.bold, styles.sectionLabelText, { color: colors.goldDark }]}>FOCUS AREAS</Text>
              </View>
              <View style={styles.tagsRow}>
                <View style={[styles.tag, { backgroundColor: colors.chip, borderColor: colors.border, borderRadius: radius.md, borderWidth: borderWidth.thin }]}>
                  <Text style={[fonts.semibold, styles.tagText, { color: colors.goldDark }]}>{profile.sub_category}</Text>
                </View>
              </View>
            </View>
          )}

          {!!profile.linkedin_url && (
            <Pressable
              onPress={handleLinkedIn}
              style={({ pressed }) => [
                styles.linkedinRow,
                { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg, borderWidth: borderWidth.thin },
                pressed && styles.pressed,
              ]}
            >
              <ExternalLink size={15} color={colors.goldDark} strokeWidth={1.6} />
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>View LinkedIn profile</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: 16 + insets.bottom }]}>
        <Pressable
          onPress={onMessage}
          style={({ pressed }) => [
            styles.messageButton,
            { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: borderWidth.thin },
            pressed && styles.pressed,
          ]}
        >
          <MessageSquare size={17} color={colors.ink} strokeWidth={1.8} />
          <Text style={[fonts.bold, { fontSize: fontSize.title, color: colors.ink }]}>Message</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 13,
    textAlign: 'center',
  },
  hero: {
    padding: 20,
    paddingBottom: 22,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  avatar: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  heroName: {
    fontSize: 19,
    color: '#fff',
    letterSpacing: -0.2,
  },
  heroSub: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.72)',
    marginTop: 4,
  },
  heroLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  heroLoc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 15,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  heroBadgeText: {
    fontSize: 11,
  },
  body: {
    padding: 16,
    gap: 18,
  },
  section: {},
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  accentBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  sectionLabelText: {
    fontSize: 11,
    letterSpacing: 0.8,
  },
  cardBody: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  italic: {
    fontStyle: 'italic',
  },
  factsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  factCell: {
    width: '47.5%',
    padding: 11,
  },
  factKey: {
    fontSize: 9.5,
    letterSpacing: 0.5,
  },
  factValue: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 17,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    fontSize: 11.5,
  },
  linkedinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  footer: {
    padding: 16,
  },
  messageButton: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
