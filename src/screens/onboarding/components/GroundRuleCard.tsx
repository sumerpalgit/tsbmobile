import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Shield } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/** One rule card in the Step 5 "ground rules" screen. Its own file, same reasoning as
 * `RoleCard`/`EtaChapterCard` — keeps the 6-item `.map` from re-creating this JSX every render. */
export function GroundRuleCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
}) {
  const { colors, fonts } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}>
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: colors.obChip }]}>
          <Icon size={17} color={colors.obGold} strokeWidth={1.8} />
        </View>
        <Text style={[fonts.bold, styles.title, { color: colors.obInk }]}>{title}</Text>
      </View>
      <Text style={[fonts.regular, styles.description, { color: colors.obInk2 }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 14.5,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 19,
  },
});
