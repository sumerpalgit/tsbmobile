import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Icon } from '../icons/Icon';

/** My Activity's own header — replaces the shared `TopBar` for this drawer screen, same template
 * as `ResourcesHeader.tsx`/`MyEventsHeader.tsx`. Plain title, no subtitle — the mockup's header
 * (`my_activities_decoded.html`) has none; the per-tab heading/subtitle live in the hero band
 * below instead (`ActivityHero.tsx`). */
export function MyActivitiesHeader({ onMenuPress }: { onMenuPress: () => void }) {
  const { colors, fonts, borderWidth, isDark, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
      ]}
    >
      <View style={styles.row}>
        <IconButton name="menu" label="Open menu" color={colors.ink} onPress={onMenuPress} />
        <Text style={[fonts.display, styles.title, { color: colors.ink, flex: 1 }]} numberOfLines={1}>
          My Activity
        </Text>
        <IconButton name={isDark ? 'sun' : 'moon'} label="Toggle theme" color={colors.ink2} onPress={toggleTheme} chip />
      </View>
    </View>
  );
}

function IconButton({
  name,
  label,
  color,
  onPress,
  chip = false,
}: {
  name: React.ComponentProps<typeof Icon>['name'];
  label: string;
  color: string;
  onPress: () => void;
  chip?: boolean;
}) {
  const { colors, radius, borderWidth } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        { borderRadius: radius.md },
        chip && { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin },
        pressed && styles.pressed,
      ]}
    >
      <Icon name={name} size={19} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.5,
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.65,
  },
});
