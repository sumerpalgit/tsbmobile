import React, { useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../../theme';

const DEFAULT_MAX_HEIGHT = 260;
const MIN_HEIGHT = 140;
/** The wizard's fixed footer (Back/Next row): `paddingTop:11 + button height:48 + paddingBottom:16`
 * (`CreateEventWizard.tsx`'s `footer` style). */
const FOOTER_RESERVE = 75;
const SAFETY_MARGIN = 12;

type Layout = { left: number; width: number; top?: number; bottom?: number; maxHeight: number };

/**
 * Wizard's dropdown field (Event type / Visibility / Timezone) — previously built on
 * `react-native-element-dropdown`, replaced with a fully custom popup after three rounds of
 * positioning bugs traced back to the same root cause: that library computes the popup's
 * position from its *own* internal measurement inside its *own* separately-mounted `Modal`, and
 * that measurement keeps drifting from this field's real on-screen position once there's more
 * than one `Modal` nested in the tree (this wizard's own outer `Modal` + the library's popup
 * Modal). Clamping `maxHeight`, forcing an explicit flip direction, and matching
 * `statusBarTranslucent` each fixed one symptom and left the underlying coordinate mismatch
 * (most recently: a large empty gap between the field and its open popup) to resurface in a new
 * form. This measures the field itself with the exact same `measureInWindow` call already proven
 * reliable elsewhere in this codebase (`ConfirmDialog`/`EventDetailView`, both plain `Modal` +
 * `Pressable` with no positioning library involved) and renders the options list as a plain
 * absolutely-positioned `View` at that measured coordinate — no second library-owned Modal, no
 * separate internal position calculation to drift out of sync with.
 */
export function FieldSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();
  const wrapRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<Layout | null>(null);

  const selected = options.find(o => o.value === value);

  const openDropdown = () => {
    wrapRef.current?.measureInWindow((x, y, width, height) => {
      const windowHeight = Dimensions.get('window').height;
      const spaceBelow = windowHeight - (y + height) - (FOOTER_RESERVE + SAFETY_MARGIN);
      const spaceAbove = y - SAFETY_MARGIN;
      const openUp = spaceBelow < MIN_HEIGHT && spaceBelow < spaceAbove;
      const maxHeight = Math.min(DEFAULT_MAX_HEIGHT, Math.max(MIN_HEIGHT, openUp ? spaceAbove : spaceBelow));

      setLayout({
        left: x,
        width,
        top: openUp ? undefined : y + height + 6,
        bottom: openUp ? windowHeight - y + 6 : undefined,
        maxHeight,
      });
      setOpen(true);
    });
  };

  return (
    <View ref={wrapRef} collapsable={false}>
      <Pressable
        onPress={openDropdown}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl },
          pressed && styles.pressed,
        ]}
      >
        <Text
          numberOfLines={1}
          style={[fonts.semibold, styles.fieldText, { fontSize: fontSize.ui, color: selected ? colors.ink : colors.ink3 }]}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <ChevronDown size={14} color={colors.ink3} strokeWidth={1.6} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
          {layout && (
            <Pressable
              onPress={e => e.stopPropagation()}
              style={[
                styles.popup,
                elevation('lg'),
                {
                  left: layout.left,
                  width: layout.width,
                  top: layout.top,
                  bottom: layout.bottom,
                  maxHeight: layout.maxHeight,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: borderWidth.thin,
                  borderRadius: radius.xl,
                },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
                {options.map(opt => {
                  const active = opt.value === value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => {
                        onChange(opt.value);
                        setOpen(false);
                      }}
                      style={({ pressed }) => [
                        styles.item,
                        { borderRadius: radius.md },
                        active && { backgroundColor: colors.chip },
                        pressed && !active && { backgroundColor: colors.surfaceSunken },
                      ]}
                    >
                      <Text style={[fonts.medium, styles.itemText, { fontSize: fontSize.ui, color: colors.ink }]}>{opt.label}</Text>
                      {active && <Check size={15} color={colors.gold} strokeWidth={2} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.65,
  },
  field: {
    height: 50,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  fieldText: {
    flex: 1,
    minWidth: 0,
  },
  popup: {
    position: 'absolute',
    padding: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
});
