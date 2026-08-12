import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

export type KeyValueRow = { k: string; v: string; onPress?: () => void };

/** Plain label/value row list — matches `Profile.html`'s `cam.targeting`/`cam.schedule` rows
 * (~line 493/504), reused for both since they're structurally identical. A row with `onPress`
 * (the Destination row, matching web's tappable "Open link" anchor) renders its value as a gold
 * link instead of plain text. */
export function KeyValueRows({ rows }: { rows: KeyValueRow[] }) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();

  return (
    <View>
      {rows.map((row, index) => {
        return (
          <Pressable
            key={row.k}
            onPress={row.onPress}
            disabled={!row.onPress}
            style={[
              styles.row,
              index < rows.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
            ]}
          >
            <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, flex: 1 }]}>{row.k}</Text>
            <Text
              style={[
                fonts.bold,
                styles.value,
                { fontSize: fontSize.caption, color: row.onPress ? colors.goldDark : colors.ink },
                row.onPress && styles.link,
              ]}
              numberOfLines={2}
            >
              {row.v}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 9,
  },
  value: {
    flex: 1,
    textAlign: 'right',
  },
  link: {
    textDecorationLine: 'underline',
  },
});
