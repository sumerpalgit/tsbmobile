import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { Icon, IconName } from '../components/icons/Icon';

/**
 * Blank screen used for every menu destination that has not been built yet.
 *
 * Phase 0's exit criterion is "every menu item opens a blank screen" — this is
 * that screen. Each real screen replaces one usage as its phase lands, so the
 * navigation graph is complete and walkable from day 1.
 */

type PlaceholderScreenProps = {
  title: string;
  icon?: IconName;
  /** Which plan phase builds this screen for real. */
  phase?: string;
};

export function PlaceholderScreen({
  title,
  icon = 'suggest',
  phase,
}: PlaceholderScreenProps) {
  const { colors, fonts, fontSize, spacing, radius, borderWidth } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.pageBg }]}>
      <View
        style={[
          styles.iconWell,
          {
            backgroundColor: colors.cream,
            borderColor: colors.borderSoft,
            borderWidth: borderWidth.thin,
            borderRadius: radius.xl,
            marginBottom: spacing.xl,
          },
        ]}
      >
        <Icon name={icon} size={28} color={colors.gold} />
      </View>

      <Text
        style={[
          fonts.display,
          { fontSize: fontSize.h3, color: colors.ink, marginBottom: spacing.sm },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          fonts.regular,
          styles.body,
          { fontSize: fontSize.body, color: colors.ink3 },
        ]}
      >
        Coming soon.
      </Text>

      {phase ? (
        <View
          style={[
            styles.phasePill,
            {
              backgroundColor: colors.goldExtraLight,
              borderRadius: radius.sm,
              marginTop: spacing.xl,
            },
          ]}
        >
          <Text
            style={[
              fonts.bold,
              styles.phaseText,
              { color: colors.goldDark },
            ]}
          >
            {phase}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Builds a screen component for a placeholder route. */
export function createPlaceholderScreen(
  props: PlaceholderScreenProps,
): React.ComponentType {
  const Screen = () => <PlaceholderScreen {...props} />;
  Screen.displayName = `Placeholder(${props.title})`;
  return Screen;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconWell: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    textAlign: 'center',
  },
  phasePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  phaseText: {
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
