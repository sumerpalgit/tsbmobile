import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { CITIES, SUB_CATEGORIES } from '../constants';
import { CategoryTrigger } from './CategoryTrigger';
import { FieldDropdown } from './FieldDropdown';
import { LinkedInGlyph } from './LinkedInGlyph';

/** Step 1 body — category, sub category, LinkedIn, city. Pulled out of `OnboardingScreen` so that
 * file doesn't keep growing into one giant render as Steps 3-4 get filled in; parent still owns
 * all the values/state, this just renders and forwards onChange. */
export function Step1Fields({
  role,
  sub,
  linkedin,
  city,
  onRolePress,
  onSubChange,
  onLinkedinChange,
  onCityChange,
}: {
  role: string;
  sub: string;
  linkedin: string;
  city: string;
  onRolePress: () => void;
  onSubChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onCityChange: (value: string) => void;
}) {
  const { colors, fonts } = useTheme();

  return (
    <View style={{ gap: 16 }}>
      {/* Category */}
      <View style={{ gap: 8 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
          Category <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <CategoryTrigger role={role} onPress={onRolePress} />
      </View>

      {/* Sub Category */}
      <View style={{ gap: 8 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
          Sub Category <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <FieldDropdown value={sub} placeholder="Select sub category" options={SUB_CATEGORIES} onChange={onSubChange} />
      </View>

      {/* LinkedIn */}
      <View style={{ gap: 7 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
          LinkedIn <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <View style={[styles.inputWrap, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
          <LinkedInGlyph />
          <TextInput
            style={[styles.plainInput, { color: colors.obInk }]}
            value={linkedin}
            onChangeText={onLinkedinChange}
            placeholder="https://www.linkedin.com/in/…"
            placeholderTextColor={colors.obInk3}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
      </View>

      {/* City */}
      <View style={{ gap: 8 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
          City <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <FieldDropdown value={city} placeholder="Select your city" options={CITIES} onChange={onCityChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 12.5,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
  plainInput: {
    flex: 1,
    padding: 0,
    fontSize: 13.5,
  },
});
