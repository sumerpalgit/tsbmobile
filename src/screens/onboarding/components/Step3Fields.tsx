import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { INTERESTS } from '../constants';
import { ChipMultiSelect } from './ChipMultiSelect';
import { FieldDropdown } from './FieldDropdown';

/** Step 3 body — "Organization & Profile", part 1 of the 2-part Business Details flow (Step 4 is
 * part 2). `designationOptions` comes from the selected role's `ROLE_CONFIG` entry
 * (`../roleConfig`) — this screen just renders whatever list it's given. `INTERESTS` is still
 * static, same phasing as `Step1Fields`'s `SUB_CATEGORIES` — role-scoped interest suggestions
 * replace it once role-conditional Step 4 is verified working. */
export function Step3Fields({
  designation,
  designationOptions,
  org,
  interests,
  onDesignationChange,
  onOrgChange,
  onInterestsToggle,
}: {
  designation: string;
  designationOptions: { value: string; label: string }[];
  org: string;
  interests: string[];
  onDesignationChange: (value: string) => void;
  onOrgChange: (value: string) => void;
  onInterestsToggle: (item: string) => void;
}) {
  const { colors, fonts } = useTheme();

  return (
    <View style={{ gap: 16 }}>
      {/* Sub-progress — Business Details is a 2-part flow (Step 3 = part 1, Step 4 = part 2) */}
      <View style={{ gap: 7 }}>
        <View style={styles.progressRow}>
          <Text style={[fonts.semibold, styles.progressLabel, { color: colors.obInk3 }]}>
            Step 1 of 2 · Organization
          </Text>
          <Text style={[fonts.semibold, styles.progressLabel, { color: colors.obGold }]}>50% complete</Text>
        </View>
        <View style={styles.progressBarRow}>
          <View style={[styles.progressSegment, { backgroundColor: colors.obGold }]} />
          <View style={[styles.progressSegment, { backgroundColor: colors.obSunken }]} />
        </View>
      </View>

      <Text style={[fonts.bold, styles.sectionTitle, { color: colors.obInk }]}>Organization & Profile</Text>

      {/* Role / Designation */}
      <View style={{ gap: 7 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
          Your Role / Designation <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <FieldDropdown
          value={designation}
          placeholder="Select your designation"
          options={designationOptions}
          onChange={onDesignationChange}
        />
      </View>

      {/* Organization / Company Name */}
      <View style={{ gap: 7 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
          Organization / Company Name <Text style={{ color: colors.obRequired }}>*</Text>
        </Text>
        <TextInput
          style={[styles.plainInput, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk }]}
          value={org}
          onChangeText={onOrgChange}
          placeholder="Enter organization name"
          placeholderTextColor={colors.obInk3}
        />
      </View>

      {/* Suggested Interests */}
      <ChipMultiSelect
        label="Suggested Interests"
        required
        options={INTERESTS}
        selected={interests}
        onToggle={onInterestsToggle}
        emptyHint="Tap a suggestion below to add your first interest."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  progressLabel: {
    fontSize: 11,
  },
  progressBarRow: {
    flexDirection: 'row',
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 13,
  },
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
});
