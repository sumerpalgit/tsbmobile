import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Dropdown, IDropdownRef } from 'react-native-element-dropdown';
import { ChevronDown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../theme';
import { Measurable } from '../constants';

const DEFAULT_MAX_HEIGHT = 260;
/** Fixed footer's own height (paddingTop + button + paddingBottom + border), excluding the
 * safe-area inset already added separately — see OnboardingScreen's `footer` style. */
const FOOTER_RESERVE = 73;
const SAFETY_MARGIN = 12;

/** Inline dropdown for Sub Category / City — matches the design's native `<select>`s.
 * Clamps its own popup height to the space actually left below the field, above the screen's
 * fixed footer.
 *
 * A field that sits too close to the bottom (e.g. Create Dual Profile's "Sub category" — the
 * last field after a long 8-card role grid, so it lands right above the footer once scrolled
 * into view) doesn't leave room for a usable list below it. Two things were tried and made it
 * worse instead of better: flipping the popup to open upward (it can end up covering the field
 * itself), and letting the library open immediately then repositioning a moment later (the
 * popup renders at the stale, wrong position for a beat before snapping — same visible bug,
 * just delayed). Both failed because the library opens its own `Modal` immediately on tap,
 * using whatever position it measures *at that instant* — no way to fix it up after the fact
 * once that Modal is already visible and anchored.
 *
 * The reliable fix: when `onFieldFocus` is provided, a full-size transparent `Pressable`
 * intercepts the tap *before* the library's own touch handling ever sees it, `await`s the
 * caller's scroll-into-view (same `Measurable`-ref pattern `OnboardingScreen.tsx` uses for its
 * keyboard-hidden text fields, but returning a Promise here so this can wait for the scroll to
 * actually finish, not just guess at a timeout), and only then calls the library's own
 * imperative `dropdownRef.open()` — so by the time the Modal actually measures/opens, the field
 * is already in its final, scrolled-into-view position. An earlier version tried a fixed delay
 * instead of awaiting the real scroll completion, which raced the caller's own async
 * `measureInWindow` → `scrollTo` chain and still opened at the stale position. Callers that
 * don't pass `onFieldFocus` get the exact same direct-tap-opens behavior as before — nothing
 * changes for them. */
export function FieldDropdown({
  value,
  placeholder,
  options,
  onChange,
  disabled,
  onFieldFocus,
  onFieldBlur,
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Scrolls this field into view before the popup opens — see the doc comment above. Returns a
   * Promise that resolves once the scroll has actually been applied (not just requested) —
   * `handleInterceptedPress` awaits it before opening, so this must not resolve early. Omit if
   * the field is never expected to land close to the bottom of its scroll container. */
  onFieldFocus?: (ref: React.RefObject<Measurable | null>) => Promise<void>;
  /** Fires when the popup closes — pairs with `onFieldFocus` so a caller that temporarily grows
   * its scroll container's bottom padding to make room to scroll into (see
   * `CreateDualProfileWizard.tsx`'s `handleFieldFocus`/`handleFieldBlur`) can shrink it back down
   * afterward, instead of leaving that extra space showing on every ordinary scroll. */
  onFieldBlur?: () => void;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const wrapRef = useRef<View>(null);
  const dropdownRef = useRef<IDropdownRef>(null);
  const [maxHeight, setMaxHeight] = useState(DEFAULT_MAX_HEIGHT);

  const measureAvailableHeight = () => {
    wrapRef.current?.measureInWindow((_x, y, _width, height) => {
      const windowHeight = Dimensions.get('window').height;
      const available = windowHeight - (y + height) - (FOOTER_RESERVE + insets.bottom + SAFETY_MARGIN);
      setMaxHeight(Math.min(DEFAULT_MAX_HEIGHT, Math.max(0, available)));
    });
  };

  const handleInterceptedPress = async () => {
    if (onFieldFocus) await onFieldFocus(wrapRef);
    dropdownRef.current?.open();
  };

  return (
    <View ref={wrapRef} collapsable={false} style={styles.wrap}>
      <Dropdown
        ref={dropdownRef}
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
        onBlur={onFieldBlur}
        renderRightIcon={() => <ChevronDown size={14} color={colors.obInk3} strokeWidth={1.6} />}
        maxHeight={maxHeight}
        disable={disabled}
      />
      {!disabled && onFieldFocus && (
        <Pressable style={StyleSheet.absoluteFill} onPress={handleInterceptedPress} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
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
