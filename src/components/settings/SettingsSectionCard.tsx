import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

/** Card chrome shared by every Settings section screen — eyebrow + title + description +
 * content, modeled on `AdCampaignEditScreen.tsx`'s local `SectionCard` with an eyebrow/
 * description added on top (the mockup's own card header shape — e.g. "Identity" eyebrow above
 * "Personal information"). */
export function SettingsSectionCard({
  eyebrow,
  title,
  description,
  children,
  rightAction,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}>
      <View style={styles.header}>
        <View style={{ flex: 1, minWidth: 0 }}>
          {!!eyebrow && <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>{eyebrow.toUpperCase()}</Text>}
          <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{title}</Text>
          {!!description && (
            <Text style={[fonts.regular, styles.description, { fontSize: fontSize.caption + 1, color: colors.ink3 }]}>{description}</Text>
          )}
        </View>
        {rightAction}
      </View>
      <View style={[styles.divider, { backgroundColor: colors.borderSoft }]} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.7,
  },
  title: {
    fontSize: 17,
    marginTop: 3,
  },
  description: {
    lineHeight: 17,
    marginTop: 5,
  },
  // Bleeds out to the card's own edges (cancels `card`'s 16px `padding`) instead of sitting
  // inset within it — matches the reference screenshot's full-width separator.
  divider: {
    height: 1,
    marginTop: 14,
    marginHorizontal: -16,
  },
  body: {
    marginTop: 14,
  },
});
