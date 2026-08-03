import React, { useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';

const DEFAULT_MAX_HEIGHT = 260;
const MIN_HEIGHT = 140;
/** Fixed footer's own height (paddingTop + button + paddingBottom + border), excluding the
 * safe-area inset already added separately — see OnboardingScreen's `footer` style. */
const FOOTER_RESERVE = 73;
const SAFETY_MARGIN = 12;

/** Inline dropdown for Sub Category / City — matches the design's native `<select>`s.
 * Clamps its own popup height to the space actually left above the screen's fixed footer,
 * since the library's built-in position="auto" flip only checks a small fixed threshold and
 * doesn't know our `maxHeight`, which let the popup render past the bottom of the screen for
 * fields (like City) that sit close to the footer. */
export function FieldDropdown({
  value,
  placeholder,
  options,
  onChange,
  disabled,
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const wrapRef = useRef<View>(null);
  const [maxHeight, setMaxHeight] = useState(DEFAULT_MAX_HEIGHT);

  const measureAvailableHeight = () => {
    wrapRef.current?.measureInWindow((_x, y, _width, height) => {
      const windowHeight = Dimensions.get('window').height;
      const reserved = FOOTER_RESERVE + insets.bottom + SAFETY_MARGIN;
      const available = windowHeight - (y + height) - reserved;
      setMaxHeight(Math.min(DEFAULT_MAX_HEIGHT, Math.max(MIN_HEIGHT, available)));
    });
  };

  return (
    <View ref={wrapRef} collapsable={false}>
      <Dropdown
        style={[styles.field, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}
        containerStyle={[styles.list, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}
        itemContainerStyle={styles.item}
        activeColor={colors.obChip}
        placeholderStyle={[fonts.regular, { color: colors.obInk3, fontSize: fontSize.ui }]}
        selectedTextStyle={[fonts.regular, { color: colors.obInk, fontSize: fontSize.ui }]}
        itemTextStyle={[fonts.medium, { color: colors.obInk, fontSize: fontSize.ui }]}
        data={options}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value || null}
        onChange={item => onChange(item.value)}
        onFocus={measureAvailableHeight}
        renderRightIcon={() => <ChevronDown size={14} color={colors.obInk3} strokeWidth={1.6} />}
        maxHeight={maxHeight}
        disable={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
  list: {
    borderRadius: 13,
    borderWidth: 1,
    paddingVertical: 4,
  },
  item: {
    paddingHorizontal: 10,
    borderRadius: 9,
  },
});
