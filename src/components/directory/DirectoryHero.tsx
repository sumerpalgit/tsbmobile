import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Bookmark } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Compact hero band — matches `Directory.html`'s "COMPACT HERO" (~line 183): eyebrow + serif
 * title, total member count, and a saved-members toggle button with a badge showing how many are
 * currently saved. The mockup's segmented All/Saved/New tab row underneath is `display:none` in
 * the mockup itself (dead) — this bookmark button is the only real, reachable way in to "saved
 * members" browsing, wired to `onToggleSaved` toggling the screen's own saved-only filter. */
export function DirectoryHero({
  totalCount,
  savedCount,
  showingSaved,
  onToggleSaved,
  chapterName,
  onClearChapter,
}: {
  totalCount: number | null;
  savedCount: number;
  showingSaved: boolean;
  onToggleSaved: () => void;
  chapterName?: string | null;
  onClearChapter?: () => void;
}) {
  const { colors, fonts, radius } = useTheme();

  return (
    <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.wrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <View style={styles.row}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowDash, { backgroundColor: colors.goldLight }]} />
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldLight }]}>MEMBER DIRECTORY</Text>
          </View>
          <Text style={[fonts.display, styles.title]}>The TSB community</Text>
        </View>

        <View style={styles.trailing}>
          <Pressable
            onPress={onToggleSaved}
            accessibilityLabel="Saved members"
            style={[
              styles.saveButton,
              { borderRadius: radius.lg },
              showingSaved
                ? { backgroundColor: colors.goldLight, borderColor: colors.goldLight }
                : { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.22)' },
            ]}
          >
            <Bookmark
              size={17}
              color={showingSaved ? colors.hero1 : savedCount > 0 ? colors.goldLight : 'rgba(255,255,255,0.85)'}
              fill={showingSaved ? colors.hero1 : 'transparent'}
              strokeWidth={1.8}
            />
            {savedCount > 0 && (
              <View style={[styles.badge, { backgroundColor: showingSaved ? colors.hero1 : colors.goldLight, borderColor: colors.hero1 }]}>
                <Text style={[fonts.bold, styles.badgeText, { color: showingSaved ? colors.goldLight : colors.hero1 }]}>{savedCount}</Text>
              </View>
            )}
          </Pressable>

          {totalCount != null && (
            <View style={styles.countWrap}>
              <Text style={[fonts.display, styles.countNumber, { color: colors.goldLight }]}>{totalCount}</Text>
              <Text style={styles.countLabel}>MEMBERS</Text>
            </View>
          )}
        </View>
      </View>

      {!!chapterName && (
        <Pressable onPress={onClearChapter} style={[styles.chapterChip, { backgroundColor: 'rgba(255,255,255,0.10)', borderRadius: radius.lg }]}>
          <Text style={[fonts.semibold, styles.chapterChipText]}>Filtered to {chapterName} · tap to clear</Text>
        </Pressable>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 15,
    gap: 11,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyebrowDash: {
    width: 14,
    height: 2,
    borderRadius: 2,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.3,
  },
  title: {
    fontSize: 23,
    color: '#fff',
    marginTop: 8,
    letterSpacing: -0.2,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
  },
  countWrap: {
    alignItems: 'flex-end',
  },
  countNumber: {
    fontSize: 26,
  },
  countLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  chapterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  chapterChipText: {
    fontSize: 11.5,
    color: '#fff',
  },
});
