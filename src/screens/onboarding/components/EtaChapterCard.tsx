import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import { Building2, MapPin, Users } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { EtaChapter } from '../../../api/eta';

/** One suggested ETA chapter row in Step 2. Its own file, same reasoning as `RoleCard` — keeps
 * the chapter `.map` from re-creating this JSX inline on every render.
 *
 * The design's thumbnail is a diagonal-striped placeholder photo (`repeating-linear-gradient`)
 * with a "{NAME} PHOTO" caption — RN has no built-in gradient, and pulling in a gradient library
 * for a placeholder swatch isn't worth it, so this falls back to a flat, muted icon tile whenever
 * `chapter.groupImageUrl` is empty. Renders via `FastImage` (disk/memory caching) instead of RN's
 * plain `Image` when a real photo URL is present — this list is now backed by the real, possibly
 * large, chapter set from `getSuggestedEtaChapters`/`searchEtaChapters`. */
export function EtaChapterCard({
  chapter,
  joined,
  onToggle,
}: {
  chapter: EtaChapter;
  joined: boolean;
  onToggle: () => void;
}) {
  const { colors, fonts, fontSize } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: joined ? colors.obGoldLight : colors.obLine2 },
      ]}
    >
      <View style={[styles.thumb, { backgroundColor: colors.obSunken }]}>
        {chapter.groupImageUrl ? (
          <FastImage
            source={{ uri: chapter.groupImageUrl, priority: FastImage.priority.normal }}
            style={styles.thumbImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        ) : (
          <Building2 size={24} color={colors.obInk3} strokeWidth={1.5} />
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[fonts.authDisplay, styles.name, { color: colors.obInk }]}>{chapter.name}</Text>
        {chapter.location ? (
          <View style={styles.metaRow}>
            <MapPin size={11} color={colors.obInk3} strokeWidth={1.6} />
            <Text style={[fonts.regular, styles.metaText, { color: colors.obInk3 }]}>{chapter.location}</Text>
          </View>
        ) : null}
        <View style={styles.metaRow}>
          <Users size={11} color={colors.obInk3} strokeWidth={1.6} />
          <Text style={[fonts.regular, styles.metaText, { color: colors.obInk3 }]}>{chapter.memberCount} members</Text>
        </View>
      </View>
      <Pressable
        onPress={onToggle}
        style={[
          styles.joinButton,
          joined
            ? { backgroundColor: colors.obSuccess, borderColor: colors.obSuccess }
            : { backgroundColor: colors.obChip, borderColor: colors.obGoldLight },
        ]}
      >
        <Text
          style={[fonts.bold, { fontSize: fontSize.small, color: joined ? colors.onAccent : colors.obGold }]}
        >
          {joined ? 'Joined' : 'Join'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  thumb: {
    flex: 0,
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 11,
  },
  joinButton: {
    flex: 0,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
