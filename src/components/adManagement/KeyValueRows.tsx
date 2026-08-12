import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';

/** Plain label/value row list — matches `Profile.html`'s `cam.targeting`/`cam.schedule` rows
 * (~line 493/504), reused for both since they're structurally identical. */
export function KeyValueRows({ rows }: { rows: { k: string; v: string }[] }) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();

  return (
    <View>
      {rows.map((row, index) => (
        <View
          key={row.k}
          style={[
            styles.row,
            index < rows.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
          ]}
        >
          <Text style={[fonts.regular, { fontSize: fontSize.caption, color: colors.ink3, flex: 1 }]}>{row.k}</Text>
          <Text style={[fonts.bold, styles.value, { fontSize: fontSize.caption, color: colors.ink }]} numberOfLines={2}>
            {row.v}
          </Text>
        </View>
      ))}
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
});
