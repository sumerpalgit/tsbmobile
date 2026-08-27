import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Notifications' own header — `Notifications` is a plain `AppStackParamList` push (reached from
 * the shared `TopBar`'s bell, same as `Profile`), so this is a back arrow + title, matching
 * `AdScreenHeader`'s own "pushed screen" treatment rather than a drawer screen's hamburger. Web's
 * "Your activity" eyebrow above the title was dropped — on mobile's tighter width it read as
 * breaking the flow above the real title, not adding context. The search box (web's own
 * always-visible 220px input) now lives permanently in the page body instead of behind a header
 * toggle; this trailing button opens the "Mark all as read"/"Clear all" menu instead — those used
 * to be an inline action row in the body, relocated here per user request, same as any other
 * screen's overflow menu (`AiHeader`'s "More", `ConversationOptionsSheet`, etc.). */
export function NotificationsHeader({
  onBack,
  onMorePress,
}: {
  onBack: () => void;
  onMorePress: () => void;
}) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
      ]}
    >
      <View style={styles.row}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" hitSlop={6} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <ChevronLeft size={22} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[fonts.display, styles.title, { fontSize: fontSize.h3, color: colors.ink }]} numberOfLines={1}>
            Notifications
          </Text>
        </View>

        <Pressable
          onPress={onMorePress}
          accessibilityRole="button"
          accessibilityLabel="Notification options"
          hitSlop={6}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <MoreHorizontal size={20} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    letterSpacing: -0.3,
  },
  pressed: {
    opacity: 0.6,
  },
});
