import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, X } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Notifications' own header — `Notifications` is a plain `AppStackParamList` push (reached from
 * the shared `TopBar`'s bell, same as `Profile`), so this is a back arrow + title, matching
 * `AdScreenHeader`'s own "pushed screen" treatment rather than a drawer screen's hamburger.
 * Includes web's "Your activity" eyebrow above the title and a search-icon toggle (mobile's
 * equivalent of web's always-visible 220px search box — there isn't room for that here). */
export function NotificationsHeader({
  onBack,
  searchOpen,
  onToggleSearch,
}: {
  onBack: () => void;
  searchOpen: boolean;
  onToggleSearch: () => void;
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
          <Text style={[fonts.bold, styles.eyebrow, { color: colors.ink3 }]}>YOUR ACTIVITY</Text>
          <Text style={[fonts.display, styles.title, { fontSize: fontSize.h3, color: colors.ink }]} numberOfLines={1}>
            Notifications
          </Text>
        </View>

        <Pressable
          onPress={onToggleSearch}
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? 'Close search' : 'Search notifications'}
          hitSlop={6}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          {searchOpen ? <X size={19} color={colors.ink2} strokeWidth={1.8} /> : <Search size={19} color={colors.ink2} strokeWidth={1.8} />}
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
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  title: {
    letterSpacing: -0.3,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.6,
  },
});
