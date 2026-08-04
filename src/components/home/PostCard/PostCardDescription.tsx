import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../../theme';

const COLLAPSED_LINES = 3;

/**
 * Body text with a "Read more"/"Read less" toggle — copied from the mockup's `{{descText}}` +
 * `{{moreLabel}}` pattern, shared by every type with a description field (ATC's
 * `question_description`, Find My Match's `post_description`, ...).
 *
 * RN ignores `numberOfLines` on a `Text` nested inside another `Text` — only the outermost one
 * actually truncates natively — so a single-pass version (measuring the same, already-clamped
 * `Text` that's on screen) can't detect real overflow: once `numberOfLines` is applied,
 * `onTextLayout` only ever reports the clamped line count, never the true one. This measures
 * the full, unclamped text once in an invisible pass first, then switches to the real clamped
 * `Text` only if that came back over `COLLAPSED_LINES` — the standard two-pass fix for this RN
 * limitation.
 */
export function PostCardDescription({ text }: { text: string }) {
  const { colors, fonts, fontSize } = useTheme();
  const [fullLineCount, setFullLineCount] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const textStyle = [fonts.regular, styles.text, { fontSize: fontSize.body, color: colors.ink2 }];
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
            <Text
              onPress={() => setExpanded(prev => !prev)}
              style={[fonts.bold, styles.toggle, { color: colors.gold }]}
            >
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
    lineHeight: 20,
  },
  /** Invisible measurement pass — `absolute`+`opacity:0` keeps it out of the visible layout
   * flow/flow height while still laying out at the real width, so its line count is accurate. */
  measure: {
    position: 'absolute',
    opacity: 0,
  },
  toggle: {
    fontSize: 12.5,
    marginTop: 2,
  },
});
