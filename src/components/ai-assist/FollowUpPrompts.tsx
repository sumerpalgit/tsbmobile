import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CornerDownRight } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Suggested follow-up questions shown under the latest AI reply — tapping one asks it
 * immediately, same as the mockup's `followups` list. */
export function FollowUpPrompts({
  prompts,
  onSelect,
}: {
  prompts: string[];
  onSelect: (text: string) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, spacing } = useTheme();

  if (!prompts.length) return null;

  return (
    <View>
      <Text style={[fonts.bold, styles.label, { color: colors.ink3 }]}>Follow up</Text>
      <View style={{ gap: spacing.xs + 3 }}>
        {prompts.map(p => (
          <Pressable
            key={p}
            onPress={() => onSelect(p)}
            style={({ pressed }) => [
              styles.row,
              {
                borderColor: colors.borderSoft,
                borderWidth: borderWidth.thin,
                borderRadius: radius.lg,
                backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
              },
            ]}
          >
            <CornerDownRight size={13} color={colors.gold} strokeWidth={1.6} />
            <Text style={[fonts.semibold, styles.text, { color: colors.ink, fontSize: fontSize.small + 1 }]}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 10.5,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 9,
    marginLeft: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  text: {
    flex: 1,
    lineHeight: 17,
  },
});
