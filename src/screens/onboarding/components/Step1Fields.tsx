import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { SUB_CATEGORIES } from '../constants';
import { CategoryTrigger } from './CategoryTrigger';
import { CitySearchField, CitySelection } from './CitySearchField';
import { FieldDropdown } from './FieldDropdown';
import { LinkedInGlyph } from './LinkedInGlyph';

export type LinkedinStatus = {
  checking: boolean;
  valid: boolean | null;
  message: string;
};

/** Step 1 body — category, sub category, LinkedIn, city. Pulled out of `OnboardingScreen` so that
 * file doesn't keep growing into one giant render as Steps 3-4 get filled in; parent still owns
 * all the values/state, this just renders and forwards onChange. City is a live search
 * (`CitySearchField`) rather than a fixed list, and LinkedIn shows the parent's debounced
 * `check-linkedin` result — both match webSrc's real `complete-profile` behavior now. */
export function Step1Fields({
  role,
  sub,
  linkedin,
  linkedinStatus,
  onRolePress,
  onSubChange,
  onLinkedinChange,
  onCitySelect,
}: {
  role: string;
  sub: string;
  linkedin: string;
  linkedinStatus: LinkedinStatus;
  onRolePress: () => void;
  onSubChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onCitySelect: (city: CitySelection) => void;
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
          {linkedinStatus.checking && <ActivityIndicator size="small" color={colors.obInk3} />}
        </View>
        {!linkedinStatus.checking && linkedinStatus.message ? (
          <Text
            style={[
              fonts.medium,
              styles.statusText,
              { color: linkedinStatus.valid ? colors.obSuccess : colors.obRequired },
            ]}
          >
            {linkedinStatus.message}
          </Text>
        ) : null}
      </View>

      {/* City */}
      <View style={{ gap: 8 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
          City <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <CitySearchField placeholder="Search for your city" onSelect={onCitySelect} />
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
  statusText: {
    fontSize: 11.5,
    marginTop: 5,
  },
});
