import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fontSize, fonts, radius, spacing, useTheme } from '../../theme';

/**
 * One item from a My Matches endpoint, rendered raw.
 *
 * This is the entire presentation layer of the current My Matches phase, and it is intentionally
 * design-free: the real UI is being redesigned, so anything card-shaped built now would be thrown
 * away. What survives is knowing exactly what each endpoint returns — hence a one-line summary
 * plus the full untouched JSON on tap.
 *
 * The JSON is `selectable` and horizontally scrollable so long values (ids, AI match summaries,
 * URLs) can be read and copied off the device rather than being clipped.
 */

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

export type RawRowProps = {
  /** Row index within its section, 1-based — shown so a specific row can be referred to. */
  index: number;
  /** The one-line summary. Keep it to identifiers and scalars; no formatting or prettifying. */
  summary: string;
  /** Second summary line, for the status flags that decide web's pipeline stage. */
  detail?: string;
  /** The item itself — serialised verbatim when expanded. */
  value: unknown;
  /** Optional action rendered on the right of the summary (e.g. "matches ›" to open a pipeline). */
  onPress?: () => void;
  pressLabel?: string;
};

export function RawRow({ index, summary, detail, value, onPress, pressLabel }: RawRowProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  // A value with a circular reference or a BigInt would throw here and take the screen with it.
  // Falling back to the error text keeps the rest of the list readable and says what happened.
  let json: string;
  try {
    json = JSON.stringify(value, null, 2) ?? String(value);
  } catch (err) {
    json = `<could not serialise: ${err instanceof Error ? err.message : String(err)}>`;
  }

  return (
    <View style={[styles.row, { borderColor: colors.borderSoft }]}>
      <Pressable
        onPress={() => setExpanded(prev => !prev)}
        style={({ pressed }) => [styles.head, pressed && { opacity: 0.6 }]}>
        <Text style={[styles.index, { color: colors.ink3 }]}>{index}</Text>
        <View style={styles.headText}>
          <Text style={[styles.summary, { color: colors.ink }]}>{summary}</Text>
          {detail ? (
            <Text style={[styles.detail, { color: colors.ink3 }]}>{detail}</Text>
          ) : null}
        </View>
        <Text style={[styles.chevron, { color: colors.gold }]}>{expanded ? '▾' : '▸'}</Text>
      </Pressable>

      {onPress ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.action,
            { borderColor: colors.gold },
            pressed && { opacity: 0.6 },
          ]}>
          <Text style={[styles.actionText, { color: colors.gold }]}>{pressLabel ?? 'Open'}</Text>
        </Pressable>
      ) : null}

      {expanded ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={[styles.jsonWrap, { backgroundColor: colors.surfaceSunken }]}>
          <Text selectable style={[styles.json, { color: colors.ink2 }]}>
            {json}
          </Text>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  index: {
    ...fonts.medium,
    fontSize: fontSize.caption,
    minWidth: 20,
    paddingTop: 1,
  },
  headText: { flex: 1 },
  summary: {
    ...fonts.medium,
    fontSize: fontSize.body,
  },
  detail: {
    fontFamily: MONO,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  chevron: {
    ...fonts.bold,
    fontSize: fontSize.body,
  },
  action: {
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    marginLeft: 28,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.sm,
  },
  actionText: {
    ...fonts.medium,
    fontSize: fontSize.caption,
  },
  jsonWrap: {
    marginTop: spacing.sm,
    marginLeft: 28,
    borderRadius: radius.sm,
  },
  json: {
    fontFamily: MONO,
    fontSize: fontSize.caption,
    lineHeight: 15,
    padding: spacing.sm,
  },
});
