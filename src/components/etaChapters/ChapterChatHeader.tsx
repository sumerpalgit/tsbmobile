import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { ChevronLeft, MoreVertical, UserPlus } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { CHAPTER_GRADIENTS, getChapterGradientIdx, getChapterInitials } from './etaChapterVisuals';

/** Chapter chat header — matches `ETAChapters_decoded.html`'s "CHAPTER CHAT" header row
 * (~line 745). Invite + "⋯" options are only shown to members (`isMember`), matching web's
 * `isSelectedGroupMember` gate exactly — a non-member sees just back + identity. "Active now" is
 * static chrome, not real presence data — web has none for chapter chat either (same caveat as
 * DM Messages' own header). */
export function ChapterChatHeader({
  name,
  memberCount,
  isMember,
  onBack,
  onInvite,
  onOptions,
}: {
  name: string;
  memberCount: number;
  isMember: boolean;
  onBack: () => void;
  onInvite: () => void;
  onOptions: () => void;
}) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const gradient = CHAPTER_GRADIENTS[getChapterGradientIdx(name || 'Chapter')];

  return (
    <LinearGradient
      colors={[colors.hero1, colors.hero2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top + 10 }]}
    >
      <Pressable onPress={onBack} accessibilityLabel="Back" style={styles.iconButton}>
        <ChevronLeft size={22} color="#fff" strokeWidth={1.9} />
      </Pressable>

      <View style={[styles.avatar, { backgroundColor: gradient.from, borderRadius: radius.pill }]}>
        <Text style={[fonts.display, { fontSize: 14, color: '#fff' }]}>{getChapterInitials(name || 'Chapter')}</Text>
      </View>

      <View style={styles.identity}>
        <Text numberOfLines={1} style={[fonts.display, styles.name, { color: '#fff' }]}>
          {name}
        </Text>
        <Text numberOfLines={1} style={[fonts.regular, styles.sub, { color: 'rgba(255,255,255,0.66)' }]}>
          {memberCount} members · Active now
        </Text>
      </View>

      {isMember && (
        <>
          <Pressable
            onPress={onInvite}
            accessibilityLabel="Invite"
            style={[styles.inviteButton, { borderColor: 'rgba(255,255,255,0.35)', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radius.lg }]}
          >
            <UserPlus size={12} color="#fff" strokeWidth={1.8} />
            <Text style={[fonts.semibold, { fontSize: fontSize.small, color: '#fff' }]}>Invite</Text>
          </Pressable>
          <Pressable onPress={onOptions} accessibilityLabel="Chapter options" style={styles.iconButton}>
            <MoreVertical size={18} color="rgba(255,255,255,0.9)" strokeWidth={1.8} />
          </Pressable>
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
  },
  sub: {
    fontSize: 11,
    marginTop: 1,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
});
