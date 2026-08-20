import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Users } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';
import { Avatar } from '../Avatar';
import { BottomSheet } from '../BottomSheet';
import { fetchFollowers, fetchFollowings, Follower } from '../../api/follow';
import { fetchProfileByUsername } from '../../api/profile';
import type { AppStackParamList } from '../../navigation/types';

const PAGE_LIMIT = 20;

/**
 * Followers/Following list — Phase 6. No mockup design exists for this at all (confirmed via
 * direct research: the mockup's stat strip has no tap handler on these cells whatsoever, and no
 * followers/following list markup exists anywhere in the decoded file), so this borrows the row
 * pattern already established in this same feature (`RequestTestimonialSheet.tsx`'s avatar+name
 * row) rather than inventing a new visual language.
 *
 * Functionality matches web's real (inline, non-modal-component) implementation exactly, not
 * over-built: web calls both lists ONCE with `page=1, limit=20` on load and never paginates
 * further despite the endpoint accepting `page`/`limit` — matched here rather than adding
 * infinite scroll web itself doesn't have. Rows are PURE NAVIGATION, no follow/unfollow button —
 * confirmed web's own real follow/unfollow toggle (`POST`/`DELETE /follow/:username`) exists but
 * is used elsewhere (another profile's own page, the feed's 3-dot menu), never inside this
 * specific list — this page is always the signed-in user's own profile, so "who follows me" /
 * "who I follow" is display-only here, matching web's own scope exactly. No search box either
 * (web doesn't have one).
 */
export function FollowListSheet({
  visible,
  mode,
  username,
  onClose,
}: {
  visible: boolean;
  mode: 'followers' | 'following';
  username: string;
  onClose: () => void;
}) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Follower[]>([]);
  const [openingUsername, setOpeningUsername] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    const fetcher = mode === 'followers' ? fetchFollowers : fetchFollowings;
    fetcher(username, 1, PAGE_LIMIT)
      .then(res => setItems(res.items))
      .finally(() => setLoading(false));
  }, [visible, mode, username]);

  const title = mode === 'followers' ? 'Followers' : 'Following';
  const emptyText = mode === 'followers' ? 'No followers yet.' : 'Not following anyone yet.';

  const handleOpenProfile = async (person: Follower) => {
    if (openingUsername) return;
    setOpeningUsername(person.username);
    try {
      const profile = await fetchProfileByUsername(person.username);
      onClose();
      navigation.navigate('MemberProfile', { profile, initialSaved: false });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not open profile' });
    } finally {
      setOpeningUsername(null);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{title}</Text>

      {loading ? (
        <ActivityIndicator size="small" color={colors.ink3} style={styles.loading} />
      ) : items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Users size={22} color={colors.ink3} strokeWidth={1.6} />
          <Text style={[fonts.semibold, styles.emptyText, { color: colors.ink3 }]}>{emptyText}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {items.map(person => (
            <Pressable
              key={person.id}
              onPress={() => handleOpenProfile(person)}
              disabled={!!openingUsername}
              style={[styles.row, openingUsername === person.username && { opacity: 0.5 }]}
            >
              <Avatar name={person.name} imageUri={person.profile_img} size={42} />
              <View style={styles.rowMeta}>
                <Text style={[fonts.semibold, styles.rowName, { color: colors.ink }]} numberOfLines={1}>{person.name}</Text>
                <Text style={[fonts.regular, styles.rowSub, { color: colors.ink3 }]} numberOfLines={1}>
                  {[`@${person.username}`, person.role_type].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {openingUsername === person.username && <ActivityIndicator size="small" color={colors.ink3} />}
            </Pressable>
          ))}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, letterSpacing: -0.2, marginBottom: 12 },
  loading: { paddingVertical: 30 },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 30 },
  emptyText: { fontSize: 12.5 },
  list: { gap: 4, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 8 },
  rowMeta: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 13.5 },
  rowSub: { fontSize: 11.5, marginTop: 1 },
});
