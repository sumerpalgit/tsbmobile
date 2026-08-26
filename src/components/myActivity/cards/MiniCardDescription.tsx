import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

const COLLAPSED_LINES = 3;

/** 3-line-clamped description with a "Read more"/"Read less" toggle, added back on request across
 * every My Activity tab's cards — same two-pass measurement approach as Home feed's
 * `PostCardDescription.tsx` (RN only honors `numberOfLines` on the outermost `Text`, so an
 * invisible unclamped pass measures the real line count first, then the toggle only shows if that
 * came back over `COLLAPSED_LINES`). Web's own mini-cards have no such toggle (plain 3-line clamp,
 * confirmed via source) — this is a deliberate mobile-only product decision, not a web-parity
 * port. */
export function MiniCardDescription({ text }: { text: string }) {
  const { colors, fonts } = useTheme();
  const [fullLineCount, setFullLineCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const textStyle = [fonts.regular, styles.text, { color: colors.ink2 }];
  const isTruncated = fullLineCount !== null && fullLineCount > COLLAPSED_LINES;

  return (
    <View>
      {fullLineCount === null && (
        <Text style={[textStyle, styles.measure]} onTextLayout={e => setFullLineCount(e.nativeEvent.lines.length)}>
          {text}
        </Text>
      )}

      {fullLineCount !== null && (
        <>
          <Text style={textStyle} numberOfLines={expanded ? undefined : COLLAPSED_LINES}>
            {text}
          </Text>
          {isTruncated && (
            <Text onPress={() => setExpanded(prev => !prev)} style={[fonts.bold, styles.toggle, { color: colors.gold }]}>
              {expanded ? 'Read less' : 'Read more'}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    lineHeight: 19,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
  },
  toggle: {
    fontSize: 11.5,
    marginTop: 2,
  },
});
