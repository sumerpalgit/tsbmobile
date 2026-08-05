import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../theme';
import { Icon } from '../../icons/Icon';

/** `"2026-08-19"` (date) or `"14:30"` (time) → the field's native `Date`, defaulting to now when
 * empty since the picker needs a starting point. */
function parseValue(value: string, mode: 'date' | 'time'): Date {
  if (!value) return new Date();
  if (mode === 'date') {
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  }
  const [h, min] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(h || 0, min || 0, 0, 0);
  return date;
}

function formatValue(date: Date, mode: 'date' | 'time'): string {
  if (mode === 'date') {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function formatDisplay(value: string, mode: 'date' | 'time'): string {
  if (!value) return '';
  const date = parseValue(value, mode);
  return mode === 'date'
    ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Start/end date and time fields (wizard Step 2) — the app's first use of
 * `@react-native-community/datetimepicker` (newly added dependency, no prior picker existed).
 * Closes on the native picker's own dismiss/set event rather than requiring a separate "Done"
 * button, matching how both platforms' default display already behaves.
 *
 * The mockup's time fields are a plain `<input type="time">` — a browser's native, lightweight
 * HH:MM (+AM/PM) scrollable-column wheel, not a full calendar/clock-dial widget. Both platforms'
 * `display="default"` render the wrong thing for `mode="time"`: iOS shows a big analog clock
 * face, Android shows the modern Material clock-dial picker (confirmed against a screenshot) —
 * neither matches. `"spinner"` is each platform's actual scrollable-column time picker (Android's
 * classic Hour/Minute/AM-PM spinner, iOS's UIDatePicker wheel), so time fields use that on both
 * platforms; date fields keep each platform's own default (`"inline"` on iOS, `"default"` on
 * Android) since a real calendar makes sense for picking a date, unlike time.
 *
 * Closing behavior differs by mode for the same reason: `inline` (dates) is a single discrete tap
 * — the picker can close itself the instant `onChange` fires. `spinner` (time) fires `onChange`
 * continuously as the wheel scrolls, with no built-in confirm step, so auto-closing on the first
 * tick would slam it shut before the user finishes scrolling — it needs its own explicit "Done".
 *
 * The field renders a small trailing icon (calendar/clock) on the right edge, not a leading one —
 * matching browsers' own built-in affordance for `<input type="date">`/`<input type="time">`
 * (confirmed against a photo of the rendered mockup, not just its HTML source, which doesn't
 * encode that icon explicitly since it's the browser's native chrome for those input types). */
export function DateTimeField({
  value,
  mode,
  placeholder,
  onChange,
}: {
  value: string;
  mode: 'date' | 'time';
  placeholder: string;
  onChange: (value: string) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const [open, setOpen] = useState(false);
  const isIosSpinner = Platform.OS === 'ios' && mode === 'time';
  const display = mode === 'time' ? 'spinner' : Platform.OS === 'ios' ? 'inline' : 'default';

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl },
          pressed && styles.pressed,
        ]}
      >
        <Text style={[fonts.semibold, styles.text, { fontSize: fontSize.small, color: value ? colors.ink : colors.ink3 }]}>
          {value ? formatDisplay(value, mode) : placeholder}
        </Text>
        <Icon name={mode === 'date' ? 'calendar' : 'clock'} size={14} color={colors.ink3} />
      </Pressable>
      {open && (
        <View
          // Android's `display="default"` opens its own native dialog and renders nothing inline
          // itself, so this wrapper only needs visible chrome (border/background) on iOS, where
          // the picker genuinely renders its content in-tree.
          style={Platform.OS === 'ios' ? [styles.pickerWrap, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }] : undefined}
        >
          <DateTimePicker
            value={parseValue(value, mode)}
            mode={mode}
            display={display}
            onChange={(event, selected) => {
              if (Platform.OS === 'android') setOpen(false);
              if (event.type === 'dismissed') return;
              if (selected) onChange(formatValue(selected, mode));
              if (Platform.OS === 'ios' && !isIosSpinner && event.type === 'set') setOpen(false);
            }}
          />
          {isIosSpinner && (
            <Pressable
              onPress={() => setOpen(false)}
              style={({ pressed }) => [styles.doneButton, { backgroundColor: colors.gold, borderRadius: radius.lg }, pressed && styles.pressed]}
            >
              <Text style={[fonts.bold, styles.doneText]}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.65,
  },
  field: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  text: {
    flex: 1,
  },
  pickerWrap: {
    marginTop: 8,
    padding: 10,
    alignItems: 'center',
  },
  doneButton: {
    alignSelf: 'stretch',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  doneText: {
    fontSize: 13,
    color: '#fff',
  },
});
