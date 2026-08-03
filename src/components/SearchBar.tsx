import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon } from './icons/Icon';

/**
 * Search input + optional filter button — matches the app bar/drawer/home reference
 * (`TSB Home FV.html`)'s Home tab search row. Generic (not Home-specific) so any screen that
 * needs the same search bar (Directory, etc.) can reuse it instead of building its own.
 *
 * `onFilterPress` is optional — omit it to render just the plain search input with no filter
 * button, for screens that don't need one.
 */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search…',
  onFilterPress,
  filtersActive = false,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  filtersActive?: boolean;
}) {
  const { colors, fontSize, radius, borderWidth, spacing, elevation } = useTheme();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.inputWrap,
          {
            borderRadius: radius.xl,
            borderWidth: borderWidth.thin,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          },
          elevation('sm'),
        ]}
      >
        <Icon name="search" size={16} color={colors.ink3} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.ink3}
          style={[styles.input, { fontSize: fontSize.ui, color: colors.ink }]}
        />
      </View>

      {onFilterPress && (
        <Pressable
          onPress={onFilterPress}
          accessibilityRole="button"
          accessibilityLabel="Filters"
          style={[
            styles.filterButton,
            { borderRadius: radius.xl, backgroundColor: colors.accentSolid },
            elevation('md'),
          ]}
        >
          <Icon name="filter" size={17} color={colors.onAccent} />
          {filtersActive && (
            <View
              style={[
                styles.activeDot,
                { backgroundColor: colors.gold, borderColor: colors.surface },
              ]}
            />
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
  },
  input: {
    flex: 1,
    padding: 0,
  },
  filterButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
});
