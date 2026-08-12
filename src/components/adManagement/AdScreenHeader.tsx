import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { useTheme } from '../../theme';

/**
 * Shared header for all 4 Ad Management screens (dashboard/detail/insights/edit) — each is a
 * plain `AppStackParamList` push (see the plan's decision #2), so this is a back arrow + title
 * + optional trailing action, matching `EventDetailScreen`/`CreateEventScreen`'s own pushed-screen
 * header treatment rather than the drawer-screen hamburger pattern (`MyEventsHeader` etc.).
 */
export function AdScreenHeader({
  title,
  onBack,
  rightAction,
}: {
  title: string;
  onBack: () => void;
  rightAction?: React.ReactNode;
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
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={6}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <ChevronLeft size={22} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>
        <Text style={[fonts.display, styles.title, { fontSize: fontSize.h3, color: colors.ink }]} numberOfLines={1}>
          {title}
        </Text>
        {rightAction}
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
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
    letterSpacing: -0.3,
  },
  pressed: {
    opacity: 0.6,
  },
});
