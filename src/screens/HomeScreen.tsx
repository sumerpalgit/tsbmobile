import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme, ThemeMode } from '../theme';

/**
 * Home — Phase 3 builds the real feed here.
 *
 * Until then this doubles as the Phase 0 verification surface: it renders the
 * palette and both type families so "light and dark mode work" can actually be
 * eyeballed on device, and exposes the light / dark / system selector.
 */

const THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

function Card({ children }: { children: React.ReactNode }) {
  const { colors, radius, spacing, borderWidth, elevation } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderWidth: borderWidth.hairline,
          borderColor: colors.border,
          padding: spacing.xl,
        },
        elevation('sm'),
      ]}
    >
      {children}
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { colors, fonts, spacing } = useTheme();

  return (
    <Text
      style={[
        fonts.bold,
        styles.sectionLabel,
        { color: colors.ink3, marginBottom: spacing.md },
      ]}
    >
      {children}
    </Text>
  );
}

function HomeScreen() {
  const {
    colors,
    fonts,
    fontSize,
    spacing,
    radius,
    borderWidth,
    mode,
    resolvedTheme,
    setMode,
  } = useTheme();

  const swatches: Array<{ label: string; value: string }> = [
    { label: 'navy', value: colors.navy },
    { label: 'gold', value: colors.gold },
    { label: 'goldLight', value: colors.goldLight },
    { label: 'cream', value: colors.cream },
    { label: 'surface', value: colors.surface },
    { label: 'pageBg', value: colors.pageBg },
    { label: 'ink2', value: colors.ink2 },
    { label: 'danger', value: colors.danger },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.pageBg }}
      contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }}
    >
      <Card>
        <Text
          style={[fonts.display, { fontSize: fontSize.h3, color: colors.ink }]}
        >
          Phase 0 · Setup
        </Text>
        <Text
          style={[
            fonts.regular,
            styles.cardBody,
            { fontSize: fontSize.body, color: colors.ink3 },
          ]}
        >
          Theme, fonts and the app menu are in place. The feed lands in Phase 3.
        </Text>
      </Card>

      <Card>
        <SectionLabel>Theme</SectionLabel>
        <View style={styles.modeRow}>
          {THEME_MODES.map(option => {
            const isSelected = mode === option;
            return (
              <Pressable
                key={option}
                onPress={() => setMode(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.modeButton,
                  {
                    paddingVertical: spacing.sm + 2,
                    borderRadius: radius.lg,
                    borderWidth: borderWidth.thin,
                    borderColor: isSelected ? colors.gold : colors.border,
                    backgroundColor: isSelected
                      ? colors.goldExtraLight
                      : colors.surfaceSunken,
                  },
                ]}
              >
                <Text
                  style={[
                    isSelected ? fonts.semibold : fonts.medium,
                    styles.modeLabel,
                    {
                      fontSize: fontSize.small,
                      color: isSelected ? colors.goldDark : colors.ink2,
                    },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text
          style={[
            fonts.regular,
            styles.resolvedNote,
            { fontSize: fontSize.caption, color: colors.ink3 },
          ]}
        >
          Resolved: {resolvedTheme}
          {mode === 'system' ? ' (following the device)' : ''}
        </Text>
      </Card>

      <Card>
        <SectionLabel>Palette</SectionLabel>
        <View style={styles.swatchGrid}>
          {swatches.map(swatch => (
            <View key={swatch.label} style={styles.swatch}>
              <View
                style={[
                  styles.swatchChip,
                  {
                    borderRadius: radius.md,
                    backgroundColor: swatch.value,
                    borderWidth: borderWidth.thin,
                    borderColor: colors.border,
                  },
                ]}
              />
              <Text
                style={[fonts.medium, styles.swatchLabel, { color: colors.ink3 }]}
                numberOfLines={1}
              >
                {swatch.label}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <SectionLabel>Type</SectionLabel>
        <Text style={[fonts.display, styles.specimenDisplay, { color: colors.ink }]}>
          DM Serif Display
        </Text>
        <Text
          style={[
            fonts.regular,
            styles.specimenFirst,
            { fontSize: fontSize.ui, color: colors.ink2 },
          ]}
        >
          DM Sans Regular 400
        </Text>
        <Text style={[fonts.medium, { fontSize: fontSize.ui, color: colors.ink2 }]}>
          DM Sans Medium 500
        </Text>
        <Text
          style={[fonts.semibold, { fontSize: fontSize.ui, color: colors.ink2 }]}
        >
          DM Sans SemiBold 600
        </Text>
        <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink2 }]}>
          DM Sans Bold 700
        </Text>
      </Card>

      <View style={styles.footerSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  cardBody: {
    marginTop: 4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
  },
  modeLabel: {
    textTransform: 'capitalize',
  },
  resolvedNote: {
    marginTop: 10,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  swatch: {
    width: '25%',
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  swatchChip: {
    height: 40,
  },
  swatchLabel: {
    fontSize: 9.5,
    marginTop: 5,
  },
  specimenDisplay: {
    fontSize: 22,
  },
  specimenFirst: {
    marginTop: 6,
  },
  footerSpacer: {
    height: 16,
  },
});

export default HomeScreen;
