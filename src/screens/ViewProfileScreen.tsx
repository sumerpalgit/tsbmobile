import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { ChevronLeft, ExternalLink, MapPin, Pencil, RefreshCw, Star, Users2 } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useMe } from '../hooks/useMe';
import { ME_QUERY_KEY } from '../api/queryKeys';
import { normalizeProfile } from '../api/directory';
import { normalizeLinkedInUrl } from '../types/directory';
import { switchDualProfile } from '../api/dual-profile';
import type { AppStackParamList } from '../navigation/types';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'roleThesis', label: '' }, // label filled in per-role at render time
  { key: 'posts', label: 'Posts' },
  { key: 'testimonial', label: 'Testimonial' },
  { key: 'resources', label: 'Resources' },
  { key: 'analytics', label: 'Analytics' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/**
 * View Profile — Phase 1 of the plan at `delightful-seeking-snowglobe.md` ("See how others view
 * you"). Matches the decoded mockup's `vpOpen` overlay directly (`standalone/TSB ProfileLast.html`
 * — cover-with-online-dot identity block, a Followers/Following/Member Since stat strip, a
 * 3-button action row, a 6-tab bar), NOT `MemberProfileView.tsx` — that component was tried first
 * (an `isOwnProfile` mode) before this mockup screen had actually been checked closely; reverted
 * once it was, since the two layouts genuinely diverge (that view has no stat strip, no
 * Dual-Profile button, no tabs — none of which make sense on Directory's *other-member* view
 * anyway).
 *
 * "Screen owns data" split, same as `ProfileScreen.tsx` — `useMe()` → `normalizeProfile
 * (user.profile)`, no new API call.
 *
 * Only the Overview tab has real content this phase; the other 5 (Role Thesis last of all — see
 * the plan's Phase 8 note on why, it's the one tab whose content is entirely role-dependent)
 * switch the active tab visually but show a "coming soon" placeholder body, matching every other
 * partially-built feature's stub convention in this app.
 *
 * Followers/Following/Member Since — corrected 2026-08-20: these ARE real backend fields (web's
 * `my-profile` page reads `profile.followers`/`profile.followings`/`profile.created_at` off the
 * same `/api/profile/me` response), an earlier pass wrongly assumed they were fabricated because
 * it only checked Directory's slimmer `Profile` type. Now wired via `User.followers`/`followings`/
 * `created_at` (`src/api/profile.ts`'s `mapProfileToUser`), read straight from `useMe()` — not
 * `normalizeProfile`'s `Profile`, which is Directory-scoped and still doesn't carry these fields.
 *
 * Action row's 3rd button mirrors web's own conditional (`my-profile/page.tsx:5038-5059`): "Dual
 * Profile" → `CreateDualProfile` wizard when `profile.dual_id` is unset, "Switch Profile" →
 * `switchDualProfile()` (already-built API wrapper, previously unused) when it's set. "Edit
 * Profile" is temporarily disabled (dimmed, no-op) — see its own inline TODO.
 *
 * One mockup element is still deliberately NOT copied — it's fabricated in the mockup itself, not
 * real data:
 * - The "Top Investor"-style badge next to the rating has no real backing field (no "top
 *   performer" flag anywhere in `Profile`) — dropped rather than fabricated. The 5-star row IS
 *   real, computed from `avg_rating` (rounded to the nearest whole star), not the mockup's static
 *   "5 filled stars regardless of score" (its one demo profile just happens to have a 5.0).
 */
function ViewProfileScreen() {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const { data: user, isLoading } = useMe();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [switching, setSwitching] = useState(false);

  const profile = user?.profile ? normalizeProfile(user.profile) : null;

  if (!user || !profile) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}>
        {isLoading && <ActivityIndicator size="small" color={colors.ink3} />}
      </View>
    );
  }

  const locationLine = [profile.city, profile.state_code].filter(Boolean).join(', ');
  const hasRating = (profile.total_reviews ?? 0) > 0;
  const filledStars = Math.round(profile.avg_rating ?? 0);
  const initials = profile.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const roleTabLabel = profile.role_type ? profile.role_type : 'Role Thesis';
  const memberSince = user.created_at ? new Date(user.created_at).getFullYear() : null;

  const handleLinkedIn = () => {
    if (!profile.linkedin_url) return;
    Linking.openURL(normalizeLinkedInUrl(profile.linkedin_url)).catch(() =>
      Toast.show({ type: 'error', text1: 'Could not open LinkedIn link' }),
    );
  };

  /** Mirrors web's `handleSwitchProfile` (`my-profile/page.tsx:4644-4655`) — web does a full
   * `window.location.reload()` after switching since the response rotates the JWT; the RN
   * equivalent is invalidating `ME_QUERY_KEY` so `useMe()` refetches under the new token
   * everywhere it's used (this screen, TopBar avatar, etc.), no app-wide reload needed. */
  const handleSwitchProfile = async () => {
    setSwitching(true);
    try {
      await switchDualProfile();
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to switch profile' });
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Back" style={styles.headerButton}>
          <ChevronLeft size={22} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
        <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>View Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
        <View style={{ backgroundColor: colors.surface }}>
          <LinearGradient colors={[colors.hero1, colors.hero2, colors.goldDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1.2 }} style={styles.cover}>
            <View style={[styles.avatarWrap, { borderColor: colors.surface }]}>
              {profile.profile_img ? (
                <Image source={{ uri: profile.profile_img }} style={styles.avatarImage} />
              ) : (
                <Text style={[fonts.display, styles.avatarInitials]}>{initials}</Text>
              )}
            </View>
            {/* This is the user's own profile — they're definitionally online while viewing it,
                unlike a real-time presence claim about someone else. */}
            <View style={[styles.onlineDot, { backgroundColor: colors.success, borderColor: colors.surface }]} />
          </LinearGradient>

          <View style={styles.identityBody}>
            <View style={styles.nameRow}>
              <Text style={[fonts.display, styles.name, { color: colors.ink }]}>{profile.name}</Text>
              {!!profile.role_type && (
                <View style={[styles.roleBadge, { backgroundColor: colors.gold }]}>
                  <Text style={[fonts.bold, styles.roleBadgeText]}>{profile.role_type.toUpperCase()}</Text>
                </View>
              )}
            </View>

            <View style={styles.subRow}>
              {!!profile.sub_category && (
                <Text style={[fonts.regular, styles.subText, { color: colors.ink2 }]}>{profile.sub_category}</Text>
              )}
              {hasRating && (
                <>
                  <View style={styles.starsRow}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={13}
                        color={colors.gold}
                        fill={i < filledStars ? colors.gold : 'transparent'}
                        strokeWidth={1.1}
                      />
                    ))}
                  </View>
                  <Text style={[fonts.bold, styles.ratingValue, { color: colors.ink }]}>
                    {(profile.avg_rating ?? 0).toFixed(1)}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.metaRow}>
              {!!locationLine && (
                <View style={styles.metaGroup}>
                  <MapPin size={11} color={colors.ink3} strokeWidth={1.6} />
                  <Text style={[fonts.regular, styles.metaText, { color: colors.ink3 }]}>{locationLine}</Text>
                </View>
              )}
              {!!profile.linkedin_url && (
                <Pressable onPress={handleLinkedIn} style={styles.metaGroup}>
                  <ExternalLink size={11} color={colors.gold} strokeWidth={1.6} />
                  <Text style={[fonts.regular, styles.metaLink, { color: colors.gold }]}>linkedin.com</Text>
                </Pressable>
              )}
            </View>

            <View style={[styles.statStrip, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
              {[
                { label: 'Followers', value: String(user.followers ?? 0) },
                { label: 'Following', value: String(user.followings ?? 0) },
                { label: 'Member Since', value: memberSince ? String(memberSince) : '—' },
              ].map((s, i) => (
                <View
                  key={s.label}
                  style={[styles.statCell, i < 2 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border }]}
                >
                  <Text style={[fonts.display, styles.statValue, { color: colors.ink }]}>{s.value}</Text>
                  <Text style={[fonts.bold, styles.statLabel, { color: colors.ink3 }]}>{s.label.toUpperCase()}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleLinkedIn}
                disabled={!profile.linkedin_url}
                style={[styles.linkedinButton, { opacity: profile.linkedin_url ? 1 : 0.4 }]}
                accessibilityLabel="LinkedIn"
              >
                <Text style={styles.linkedinGlyph}>in</Text>
              </Pressable>
              <Pressable
                onPress={() => navigation.navigate('SettingsProfile')}
                disabled // TODO: re-enable Edit Profile once its flow is ready for this screen
                style={({ pressed }) => [styles.actionButton, { borderColor: colors.border, backgroundColor: colors.surface, opacity: 0.4 }, pressed && styles.pressed]}
              >
                <Pencil size={13} color={colors.ink} strokeWidth={1.8} />
                <Text style={[fonts.bold, styles.actionButtonText, { color: colors.ink }]}>Edit Profile</Text>
              </Pressable>
              {profile.dual_id ? (
                <Pressable
                  onPress={handleSwitchProfile}
                  disabled={switching}
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: '#182E43', opacity: switching ? 0.6 : 1 }, pressed && styles.pressed]}
                >
                  {switching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <RefreshCw size={14} color="#fff" strokeWidth={1.8} />
                  )}
                  <Text style={[fonts.bold, styles.actionButtonText, { color: '#fff' }]}>Switch Profile</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => navigation.navigate('CreateDualProfile')}
                  style={({ pressed }) => [styles.actionButton, { backgroundColor: '#182E43' }, pressed && styles.pressed]}
                >
                  <Users2 size={14} color="#fff" strokeWidth={1.8} />
                  <Text style={[fonts.bold, styles.actionButtonText, { color: '#fff' }]}>Dual Profile</Text>
                </Pressable>
              )}
            </View>
          </View>

          <View style={[styles.tabBarWrap, { borderTopColor: colors.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBar}>
              {TABS.map(tab => {
                const active = tab.key === activeTab;
                const label = tab.key === 'roleThesis' ? roleTabLabel : tab.label;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => setActiveTab(tab.key)}
                    style={[styles.tab, active && { borderBottomColor: colors.gold, borderBottomWidth: 2.5 }]}
                  >
                    <Text style={[active ? fonts.bold : fonts.semibold, styles.tabLabel, { color: active ? colors.gold : colors.ink3 }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {activeTab === 'overview' ? (
          <View style={styles.body}>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>About</Text>
              <Text style={[fonts.regular, styles.cardBody, { color: profile.bio ? colors.ink2 : colors.ink3 }, !profile.bio && styles.italic]}>
                {profile.bio || 'Add a bio from Edit Profile so others know a bit about you.'}
              </Text>
            </View>

            {(!!profile.designation || !!profile.organization) && (
              <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Current Organization</Text>
                {!!profile.designation && (
                  <Text style={[fonts.semibold, styles.orgLine, { color: colors.ink }]}>{profile.designation}</Text>
                )}
                {!!profile.organization && (
                  <Text style={[fonts.regular, styles.orgLine, { color: colors.ink2 }]}>{profile.organization}</Text>
                )}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.comingSoon}>
            <Text style={[fonts.semibold, { color: colors.ink3 }]}>More is coming here in a future update.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 21, letterSpacing: -0.4 },
  cover: { height: 104 },
  avatarWrap: {
    position: 'absolute',
    left: 16,
    bottom: -26,
    width: 66,
    height: 66,
    borderRadius: 16,
    backgroundColor: '#0b0f14',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitials: { fontSize: 22, color: '#fff' },
  onlineDot: {
    position: 'absolute',
    left: 70,
    bottom: -22,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2.5,
  },
  identityBody: { paddingTop: 34, paddingHorizontal: 16, paddingBottom: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  name: { fontSize: 22, letterSpacing: -0.3 },
  roleBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  roleBadgeText: { fontSize: 9.5, letterSpacing: 0.6, color: '#fff' },
  subRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  subText: { fontSize: 12.5 },
  starsRow: { flexDirection: 'row', gap: 1.5 },
  ratingValue: { fontSize: 12.5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 13, marginTop: 8 },
  metaGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11.5 },
  metaLink: { fontSize: 11.5 },
  statStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 13,
    paddingVertical: 9,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 3 },
  statValue: { fontSize: 17 },
  statLabel: { fontSize: 10.5, letterSpacing: 0.5 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 13 },
  linkedinButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0A66C2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkedinGlyph: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  actionButtonText: { fontSize: 13 },
  pressed: { opacity: 0.7 },
  tabBarWrap: { borderTopWidth: StyleSheet.hairlineWidth },
  tabBar: { paddingHorizontal: 10 },
  tab: { height: 46, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 13 },
  body: { padding: 16, gap: 13, paddingBottom: 28 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  cardTitle: { fontSize: 16 },
  cardBody: { fontSize: 12.5, lineHeight: 19, marginTop: 7 },
  italic: { fontStyle: 'italic' },
  orgLine: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  comingSoon: { paddingVertical: 60, alignItems: 'center', paddingHorizontal: 30 },
});

export default ViewProfileScreen;
