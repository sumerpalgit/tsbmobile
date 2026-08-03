import React, { useRef } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputKeyPressEventData, View } from 'react-native';
import { useTheme } from '../theme';

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
};

/**
 * Boxed numeric code entry, one digit per box — auto-advances focus forward as digits are
 * typed and backward on backspace-into-empty. Also absorbs a multi-digit paste/autofill
 * (e.g. iOS's SMS/email one-time-code suggestion) landing in a single box, distributing it
 * across the remaining boxes instead of only keeping its first character.
 */
export function OtpInput({ length = 6, value, onChange, error }: OtpInputProps) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(''));
  };

  const onChangeDigit = (index: number, text: string) => {
    const digitsOnly = text.replace(/[^0-9]/g, '');

    if (digitsOnly.length > 1) {
      const next = digits.slice();
      for (let i = 0; i < digitsOnly.length && index + i < length; i++) {
        next[index + i] = digitsOnly[i];
      }
      onChange(next.join(''));
      inputRefs.current[Math.min(index + digitsOnly.length, length) - 1]?.focus();
      return;
    }

    setDigit(index, digitsOnly);
    if (digitsOnly && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const onKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={ref => {
            inputRefs.current[index] = ref;
          }}
          style={[
            fonts.bold,
            styles.box,
            {
              color: colors.ink,
              fontSize: fontSize.subtitle,
              backgroundColor: colors.authField,
              borderColor: error ? colors.authFieldBorderError : colors.authFieldBorder,
              borderWidth: borderWidth.thin,
              textAlign: 'center',
            },
          ]}
          value={digit}
          onChangeText={text => onChangeDigit(index, text)}
          onKeyPress={e => onKeyPress(index, e)}
          keyboardType="number-pad"
          textContentType={index === 0 ? 'oneTimeCode' : undefined}
          maxLength={length}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  box: {
    width: 46,
    height: 46,
    borderRadius: 12,
  },
});
