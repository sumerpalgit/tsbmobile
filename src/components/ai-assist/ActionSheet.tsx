import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export type ActionSheetItem = {
  key: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onPress: () => void;
};

/** Shared bottom-sheet chrome for `MoreSheet`/`ChatOptionsSheet`/`ReplyActionsSheet` — the
 * mockup renders all three as the same drag-handle + icon/label row list, just with different
 * item sets, so the chrome lives once here rather than being copy-pasted three times. Same
 * `Modal` + `Pressable`-backdrop pattern as `ConfirmDialog.tsx`/`EventsCalendarPopover.tsx` (no
 * bottom-sheet library in this app). */
export function ActionSheet({
  visible,
  onClose,
  title,
  subtitle,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  items: ActionSheetItem[];
}) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: 'rgba(10,16,24,0.5)' }]} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.xxl + 6,
              borderTopRightRadius: radius.xxl + 6,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          {title ? (
            <Text numberOfLines={1} style={[fonts.bold, styles.title, { color: colors.ink }]}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text style={[fonts.regular, styles.subtitle, { color: colors.ink3 }]}>{subtitle}</Text>
          ) : null}

          <View style={{ gap: 2 }}>
            {items.map((item, i) => (
              <React.Fragment key={item.key}>
                {/* A destructive item that isn't the sheet's only item gets a divider above it —
                    matches the reference design's separation of "Leave chapter"/etc. from the
                    regular actions above it. A separate hairline (not border-on-the-row) since
                    the row's fixed `height` would otherwise clip extra top padding. */}
                {item.danger && i > 0 && <View style={[styles.dangerDivider, { backgroundColor: colors.border }]} />}
                <Pressable
                  onPress={() => {
                    onClose();
                    item.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.row,
                    { borderRadius: radius.xl, backgroundColor: pressed ? colors.surfaceSunken : 'transparent' },
                  ]}
                >
                  <View style={styles.rowIcon}>{item.icon}</View>
                  <Text
                    style={[
                      fonts.semibold,
                      { fontSize: fontSize.ui, color: item.danger ? colors.danger : colors.ink },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              </React.Fragment>
            ))}
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
  },
  sheet: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  subtitle: {
    fontSize: 11.5,
    marginHorizontal: 4,
    marginTop: 2,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 50,
    paddingHorizontal: 14,
  },
  rowIcon: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerDivider: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 4,
  },
});
