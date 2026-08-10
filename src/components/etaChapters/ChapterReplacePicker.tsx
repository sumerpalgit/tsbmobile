import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock, Star } from 'lucide-react-native';
import FastImage from '@d11/react-native-fast-image';
import { useTheme } from '../../theme';
import { getChapterInitials } from './etaChapterVisuals';
import type { EtaGroup } from '../../types/etaChapters';

/** The real cap-replace flow — matches web's `JoinChapterModal` replace-picker
 * (`my-eta-chapters/page.tsx:confirmJoinGroup`): shown when the user is already at the 3-chapter
 * cap and taps Join on a new chapter. Picking a chapter here and confirming does
 * `leaveEtaGroup(replaceId)` then `joinEtaGroup(targetChapter.id)` sequentially (wired in
 * `EtaChaptersScreen`), same real business rule as web — not a fabricated mobile-only flow. */
export function ChapterReplacePicker({
  visible,
  targetChapter,
  myChapters,
  isSubmitting,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  targetChapter: EtaGroup | null;
  myChapters: EtaGroup[];
  isSubmitting: boolean;
  onConfirm: (replaceChapterId: string) => void;
  onCancel: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) setSelectedId(null);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingBottom: insets.bottom + 18 },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <View style={styles.headerText}>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Join {targetChapter?.name ?? 'this chapter'}?</Text>
            <Text style={[fonts.regular, styles.subtitle, { color: colors.ink3 }]}>
              You currently have <Text style={[fonts.bold, { color: colors.ink }]}>{myChapters.length} of {myChapters.length}</Text> primary
              memberships active. To add this chapter as primary, you'll need to replace one of your existing chapters.
            </Text>
          </View>

          <View style={[styles.cooldownBox, { backgroundColor: colors.chip, borderColor: colors.goldLight, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
            <View style={[styles.cooldownIcon, { backgroundColor: colors.goldDark, borderRadius: radius.md }]}>
              <Clock size={12} color="#fff" strokeWidth={2} />
            </View>
            <View style={styles.cooldownTextWrap}>
              <Text style={[fonts.bold, styles.cooldownTitle, { color: colors.goldDark }]}>30-Day Cooldown Period</Text>
              <Text style={[fonts.regular, styles.cooldownBody, { color: colors.goldDark }]}>
                After switching, you cannot change this chapter for 30 days. The replaced chapter will become view-only.
              </Text>
            </View>
          </View>

          <Text style={[fonts.bold, styles.selectLabel, { color: colors.ink }]}>Select a chapter to replace:</Text>

          <View style={styles.rows}>
            {myChapters.map(chapter => {
              const selected = chapter.id === selectedId;
              return (
                <Pressable
                  key={chapter.id}
                  onPress={() => setSelectedId(chapter.id)}
                  style={[
                    styles.row,
                    { borderColor: selected ? colors.navy : colors.border, backgroundColor: selected ? colors.chip : colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin },
                  ]}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.navy, borderRadius: radius.md }]}>
                    {chapter.groupImageUrl ? (
                      <FastImage source={{ uri: chapter.groupImageUrl, priority: FastImage.priority.normal }} style={StyleSheet.absoluteFillObject} resizeMode={FastImage.resizeMode.cover} />
                    ) : (
                      <Text style={[fonts.display, { fontSize: fontSize.body, color: colors.goldLight }]}>{getChapterInitials(chapter.name)}</Text>
                    )}
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={[fonts.semibold, styles.rowName, { color: colors.ink }]} numberOfLines={1}>
                      {chapter.name}
                    </Text>
                    <Text style={[fonts.regular, styles.rowPlace, { color: colors.ink3 }]} numberOfLines={1}>
                      {chapter.memberCount ? `${chapter.memberCount.toLocaleString()} members` : 'Chapter member'}
                    </Text>
                  </View>
                  <View style={[styles.checkCircle, { borderColor: selected ? colors.navy : colors.border, backgroundColor: selected ? colors.navy : 'transparent' }]}>
                    {selected && <View style={[styles.checkDot, { backgroundColor: colors.surface }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.orDivider}>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
            <Text style={[fonts.semibold, styles.orText, { color: colors.ink3 }]}>or</Text>
            <View style={[styles.orLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={[styles.upgradeCard, { backgroundColor: colors.chip, borderColor: colors.goldLight, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
            <View style={[styles.upgradeIcon, { backgroundColor: colors.gold, borderRadius: radius.md }]}>
              <Star size={15} color="#fff" strokeWidth={1.6} fill="rgba(255,255,255,0.25)" />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[fonts.semibold, styles.upgradeTitle, { color: colors.goldDark }]}>Upgrade to add a 4th chapter</Text>
              <Text style={[fonts.regular, styles.upgradeBody, { color: colors.goldDark }]}>Pro plan · $19/mo — no cooldown required</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => selectedId && onConfirm(selectedId)}
              disabled={!selectedId || isSubmitting}
              style={[styles.confirmButton, { backgroundColor: colors.navy, borderRadius: radius.xl, opacity: !selectedId || isSubmitting ? 0.5 : 1 }]}
            >
              <Text style={[fonts.bold, { fontSize: fontSize.title, color: '#fff' }]}>{isSubmitting ? 'Switching…' : 'Switch Chapter'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,16,24,0.5)',
  },
  sheet: {
    paddingTop: 8,
    paddingHorizontal: 18,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerText: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  cooldownBox: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    marginBottom: 14,
  },
  cooldownIcon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cooldownTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  cooldownTitle: {
    fontSize: 12,
    marginBottom: 2,
  },
  cooldownBody: {
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.85,
  },
  selectLabel: {
    fontSize: 11.5,
    marginBottom: 8,
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  rowName: {
    fontSize: 13.5,
  },
  rowPlace: {
    fontSize: 11,
    marginTop: 3,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  orDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  orLine: {
    flex: 1,
    height: 0.5,
  },
  orText: {
    fontSize: 11,
  },
  upgradeCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    alignItems: 'center',
  },
  upgradeIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeTitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  upgradeBody: {
    fontSize: 11,
    opacity: 0.85,
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },
  cancelButton: {
    flex: 0,
    height: 48,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
