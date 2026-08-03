import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { RoleField } from '../roleConfig';
import { FieldDropdown } from './FieldDropdown';

/** Renders one `select` or `text` field from a role's `ROLE_CONFIG` entry — `chips`-type
 * fields (e.g. Student's "Work Interest Areas") use `ChipMultiSelect` directly instead, since
 * their multi-select shape doesn't fit this single-value component. Also renders the
 * "Other (please specify)" free-text box beneath a `select` field when its `otherWhen` value
 * is the current selection, matching web's per-role "Other" pattern. */
export function DynamicField({
  field,
  value,
  otherValue,
  onChange,
  onOtherChange,
}: {
  field: RoleField;
  value: string;
  otherValue: string;
  onChange: (value: string) => void;
  onOtherChange: (value: string) => void;
}) {
  const { colors, fonts } = useTheme();
  const showOther = !!field.otherWhen && value === field.otherWhen;

  return (
    <View style={{ gap: 7 }}>
      <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
        {field.label} {field.required && <Text style={{ color: colors.obRequired }}>*</Text>}
      </Text>

      {field.type === 'select' ? (
        <FieldDropdown
          value={value}
          placeholder={field.placeholder ?? `Select ${field.label.toLowerCase()}`}
          options={field.options ?? []}
          onChange={onChange}
        />
      ) : (
        <TextInput
          style={[styles.plainInput, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk }]}
          value={value}
          onChangeText={onChange}
          placeholder={field.placeholder ?? field.label}
          placeholderTextColor={colors.obInk3}
        />
      )}

      {showOther && (
        <TextInput
          style={[
            styles.plainInput,
            styles.otherInput,
            { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk },
          ]}
          value={otherValue}
          onChangeText={onOtherChange}
          placeholder="Please specify"
          placeholderTextColor={colors.obInk3}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 12.5,
  },
  plainInput: {
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
    fontSize: 13.5,
  },
  otherInput: {
    marginTop: 2,
  },
});
