import React from 'react';
import { StyleSheet } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../../theme';

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
 */
export function ThesisDropdown({
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

  return (
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
      renderRightIcon={() => <ChevronDown size={14} color={colors.ink3} strokeWidth={1.6} />}
      maxHeight={260}
    />
  );
}

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
