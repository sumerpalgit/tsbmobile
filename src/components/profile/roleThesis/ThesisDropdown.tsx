import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/** The popup's own preferred `maxHeight` when there's enough room below the field — `handleFocus`
 * shrinks this per-instance when there isn't (see its own doc comment). */
const LIST_MAX_HEIGHT = 260;
/** Floor so a very tight fit still shows a few rows instead of collapsing toward zero height. */
const LIST_MIN_HEIGHT = 120;
/** Gap kept between the popup's bottom edge and the screen edge. */
const SCREEN_MARGIN = 12;

/**
 * Native `<select>`-equivalent dropdown for Role Thesis fields that are genuinely a dropdown on
 * web (e.g. Searcher's Search Type) rather than a chip picker — per explicit user direction, not
 * every single-select field in this tab should default to `ThesisPillRow`. Built on
 * `react-native-element-dropdown`'s `Dropdown` (already a dependency — onboarding's
 * `FieldDropdown.tsx` uses the same library), but re-themed to this tab's main-theme tokens
 * (`colors.authField`/`colors.authFieldBorder`/`colors.ink`) instead of reusing `FieldDropdown`
 * directly — that component hardcodes onboarding's own distinct `ob*` palette, which would
 * visually mismatch View Profile's real theme, same reasoning as `ThesisSearchableChips`'s own
 * doc comment on why it isn't a re-themed `ChipMultiSelect`. Options are plain strings (not
 * label/value pairs) since every Role Thesis field so far only ever needs the string itself.
 *
 * `maxHeight` is measured ourselves rather than left fixed at `LIST_MAX_HEIGHT` — confirmed via the
 * library's source (`Dropdown/index.tsx`'s `onAutoPosition`) that its own `'auto'` position only
 * flips the popup upward when there's LESS THAN 100px of space below the field, regardless of the
 * popup's actual height, so a field with e.g. 150px of room still renders downward and overflows
 * past the screen edge — confirmed on-device (a bottom-sheet field like "SBA-Backed Financing"
 * sitting low in the sheet). Forcing `dropdownPosition="top"` instead was tried and reverted: the
 * library renders that mode's list `inverted` by default (`_renderList`'s `isInverted`), which
 * visually reverses the option order, and its positioning doesn't tightly hug the field either —
 * both confirmed on-device as new, worse breakage. Shrinking `maxHeight` to the real available space
 * keeps the popup always opening downward (unchanged, working behavior) while guaranteeing it can't
 * run past the screen.
 *
 * Memoized — see `ThesisPillRow`'s own doc comment on why. */
export const ThesisDropdown = React.memo(function ThesisDropdownImpl({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const { colors, fonts } = useTheme();
  const wrapperRef = useRef<View>(null);
  const [maxHeight, setMaxHeight] = useState(LIST_MAX_HEIGHT);

  const handleFocus = () => {
    wrapperRef.current?.measureInWindow((_x, y, _width, height) => {
      const spaceBelow = Dimensions.get('window').height - (y + height) - SCREEN_MARGIN;
      setMaxHeight(Math.max(LIST_MIN_HEIGHT, Math.min(LIST_MAX_HEIGHT, spaceBelow)));
    });
  };

  return (
    <View ref={wrapperRef}>
      <Dropdown
        style={[styles.field, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}
        containerStyle={[styles.list, { backgroundColor: colors.surface, borderColor: colors.authFieldBorder }]}
        itemContainerStyle={styles.item}
        activeColor={colors.chip}
        placeholderStyle={[fonts.regular, styles.text, { color: colors.ink3 }]}
        selectedTextStyle={[fonts.regular, styles.text, { color: colors.ink }]}
        itemTextStyle={[fonts.medium, styles.text, { color: colors.ink }]}
        data={options.map(option => ({ label: option, value: option }))}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value || null}
        onChange={item => onChange(item.value)}
        onFocus={handleFocus}
        renderRightIcon={() => <ChevronDown size={14} color={colors.ink3} strokeWidth={1.6} />}
        maxHeight={maxHeight}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  field: { height: 44, paddingHorizontal: 13, borderRadius: 12, borderWidth: 1 },
  // The library positions its popup at `fieldHeight + fieldY + 2` (a near-zero built-in offset) —
  // the visible gap users actually see comes from measurement/shadow slack around the field
  // rather than that hardcoded `+2`, so it's pulled in here instead, the only spacing lever this
  // library actually exposes (`containerStyle`).
  list: { borderRadius: 12, borderWidth: 1, paddingVertical: 4, marginTop: -8 },
  item: { paddingHorizontal: 10, borderRadius: 9 },
  text: { fontSize: 13 },
});
