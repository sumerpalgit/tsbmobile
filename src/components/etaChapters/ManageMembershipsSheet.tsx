import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { getChapterInitials, getChapterPlace } from './etaChapterVisuals';
import { MAX_ACTIVE_ETA_CHAPTERS } from './PrimaryMembershipsBanner';
import type { EtaGroup } from '../../types/etaChapters';

/** "Primary memberships" bottom sheet — matches `ETAChapters_decoded.html`'s "MANAGE SHEET"
 * (~line 482). Web's mockup gives only the *first* row a "Switch" button and every other row a
 * disabled "Cooldown" label (`i === 0 ? 'Switch' : 'Cooldown'`) — that's an arbitrary demo-data
 * artifact, not a real constraint (any of a user's 3 chapters can be left/replaced at any time),
 * so every row here gets the same real "Switch" action. Per the plan's decision #5, "Switch"
 * doesn't open a second competing replace-flow — it closes this sheet and drops the user back
 * on the All Chapters browse list, where tapping Join on any chapter (while still at the cap)
 * naturally triggers the real `ChapterReplacePicker`. */
type ManageMembershipsSheetProps = {
  visible: boolean;
  chapters: EtaGroup[];
  onSwitch: (chapter: EtaGroup) => void;
  onClose: () => void;
};

/** Nests its own `SafeAreaProvider` inside the `Modal` rather than trusting the app-root one —
 * `Modal` renders in a separate native window on Android, so insets measured against the main
 * window aren't guaranteed to apply there too (same root cause fixed in `DirectoryFiltersPanel`).
 * The insets-consuming content is split into `ManageMembershipsSheetContent` because a component
 * can't read a `Provider` it renders itself later in the same return — `useSafeAreaInsets()` has
 * to be called from *inside* the new nested provider's subtree. */
export function ManageMembershipsSheet({ visible, chapters, onSwitch, onClose }: ManageMembershipsSheetProps) {
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaProvider>
        <ManageMembershipsSheetContent chapters={chapters} onSwitch={onSwitch} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

function ManageMembershipsSheetContent({ chapters, onSwitch, onClose }: Omit<ManageMembershipsSheetProps, 'visible'>) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable
        onPress={e => e.stopPropagation()}
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingBottom: insets.bottom + 18 },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />

        <View style={[styles.headerRow, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
          <View style={styles.headerText}>
            <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Primary memberships</Text>
            <Text style={[fonts.regular, styles.subtitle, { color: colors.ink3 }]}>
              {chapters.length} of {MAX_ACTIVE_ETA_CHAPTERS} in use. Switching starts a 30-day cooldown on the slot.
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            style={[styles.closeButton, { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}
          >
            <Text style={[fonts.bold, { color: colors.ink2 }]}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.rows}>
          {chapters.map(chapter => (
            <View key={chapter.id} style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
              <View style={[styles.avatar, { backgroundColor: colors.feedFill, borderRadius: radius.lg }]}>
                <Text style={[fonts.display, { fontSize: fontSize.body, color: colors.feedOnFill }]}>{getChapterInitials(chapter.name)}</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={[fonts.bold, styles.rowName, { color: colors.ink }]} numberOfLines={1}>
                  {chapter.name}
                </Text>
                <Text style={[fonts.regular, styles.rowPlace, { color: colors.ink3 }]} numberOfLines={1}>
                  {getChapterPlace(chapter, 'Chapter')}
                </Text>
              </View>
              <Pressable
                onPress={() => onSwitch(chapter)}
                style={[styles.switchButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}
              >
                <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.ink2 }]}>Switch</Text>
              </Pressable>
            </View>
          ))}
        </View>

        <Pressable onPress={onClose} style={[styles.doneButton, { backgroundColor: colors.gold, borderRadius: radius.xl }]}>
          <Text style={[fonts.bold, { fontSize: fontSize.title, color: '#fff' }]}>Done</Text>
        </Pressable>
      </Pressable>
    </Pressable>
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
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 4,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rows: {
    paddingHorizontal: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 11,
  },
  avatar: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
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
  switchButton: {
    height: 32,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    height: 48,
    marginHorizontal: 18,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
