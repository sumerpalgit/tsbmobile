import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

/**
 * Tag chips — copied exactly from `TSB Home FV.html`'s feed cards, where the first 3 tags each
 * get a different tier of emphasis rather than one uniform chip style: 1st tag solid gold, 2nd
 * solid navy fill, 3rd+ outlined. Confirmed across every card example in the mockup (Search
 * Capital's "Self-Funded"/"Actively Searching"/"SBA Eligible", Investor Corner's tag rows, ...).
 * Caps at 3 visible with no "+N" overflow indicator — the mockup renders a hidden 4th tag
 * (`display:none`) rather than showing a count, so extra tags are just dropped here too.
 */
export function PostCardTags({ tags }: { tags: string[] | undefined }) {
  const { colors, fonts } = useTheme();

  const shown = (tags ?? []).filter(Boolean).slice(0, 3);
  if (shown.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {shown.map((tag, index) => {
        const tier = index === 0 ? 'gold' : index === 1 ? 'fill' : 'outline';
        const backgroundColor = tier === 'gold' ? colors.gold : tier === 'fill' ? colors.feedFill : 'transparent';
        const textColor = tier === 'gold' ? '#fff' : tier === 'fill' ? colors.feedOnFill : colors.ink2;

        return (
          <View
            key={tag}
            style={[
              styles.chip,
              {
                backgroundColor,
                borderWidth: tier === 'outline' ? 1 : 0,
                borderColor: colors.homeCardBorder,
              },
            ]}
          >
            <Text style={[fonts.semibold, styles.label, { color: textColor }]} numberOfLines={1}>
              {tag}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderRadius: 7,
    paddingVertical: 4,
    paddingHorizontal: 9,
  },
  label: {
    fontSize: 11,
  },
});
