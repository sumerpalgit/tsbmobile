import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { PickedFile } from '../../../components';
import { Measurable } from '../../../screens/onboarding/constants';
import { ROLE_CONFIG } from '../../../screens/onboarding/roleConfig';
import { ChipMultiSelect } from '../../../screens/onboarding/components/ChipMultiSelect';
import { FieldDropdown } from '../../../screens/onboarding/components/FieldDropdown';
import { Step4Fields } from '../../../screens/onboarding/components/Step4Fields';

/**
 * Business Details — two internal sub-steps under one wizard step ("STEP 4 OF 5" stays fixed
 * throughout both), matching the real mockup's `dpIs4a`/`dpIs4b` split exactly (decoded source):
 * Part A = Bio (new, no onboarding equivalent — a second profile gets its own bio) + role/
 * designation + organization name + Suggested Interests; Part B = the role-specific fields.
 *
 * Part B reuses onboarding's `Step4Fields` wholesale (`showProgress={false}` — its own baked-in
 * "Step 2 of 2" sub-progress header doesn't exist in this mockup) rather than hand-building
 * education/search-detail fields from the mockup's own dp4b markup: that markup is static
 * generic filler (verified against `ROLE_CONFIG.Searcher` — it's literally the Searcher config's
 * Education + Search Details sections, not real per-role branching), and real web's own
 * `create-dual-profile/page.tsx` renders this step with the exact same `UnifiedRoleForm`
 * component its regular onboarding flow uses. Per this build's "web wins for functionality"
 * decision, `Step4Fields`'s config-driven per-role rendering is used as-is instead.
 *
 * Part A is NOT a `Step3Fields` reuse — that component bakes in its own "Step 1 of 2" progress
 * header (also absent from this mockup) and has no Bio field, so this builds the small mockup-
 * matched layout directly from `FieldDropdown`/`ChipMultiSelect` primitives instead.
 *
 * "Suggested Interests" opts into `ChipMultiSelect`'s `searchable` mode (user-requested,
 * matching real web's `InterestDropdown` search — `webSrc/components/onboarding/
 * InterestDropdown.tsx`) — onboarding's own Step 3 "Suggested Interests" deliberately keeps its
 * existing non-searchable layout, since this was scoped to Dual Profile only.
 */
export function StepBusinessDetails({
  subStep,
  roleLabel,
  bio,
  onBioChange,
  designation,
  onDesignationChange,
  onDesignationFieldFocus,
  onDesignationFieldBlur,
  orgName,
  onOrgNameChange,
  interests,
  interestOptions,
  interestsLoading,
  onInterestsToggle,
  fieldValues,
  onFieldChange,
  chipValues,
  onChipToggle,
  industries,
  industryGrouped,
  onIndustriesToggle,
  geographyFocus,
  geographyGrouped,
  onGeographyToggle,
  lookupLoading,
  orgWebsite,
  onOrgWebsiteChange,
  revRange,
  ebitdaRange,
  evRange,
  onRevChange,
  onEbitdaChange,
  onEvChange,
  uploads,
  onUploadChange,
  uploadingKey,
  rangeErrors,
}: {
  subStep: 'a' | 'b';
  roleLabel: string;
  bio: string;
  onBioChange: (value: string) => void;
  designation: string;
  onDesignationChange: (value: string) => void;
  /** Scrolls the field into view before its popup opens — see `FieldDropdown.tsx`'s
   * `onFieldFocus` doc comment. */
  onDesignationFieldFocus?: (ref: React.RefObject<Measurable | null>) => Promise<void>;
  /** Fires when the popup closes, so the wizard can shrink the extra scroll space it grew back
   * down. See `FieldDropdown.tsx`'s `onFieldBlur` doc comment. */
  onDesignationFieldBlur?: () => void;
  orgName: string;
  onOrgNameChange: (value: string) => void;
  interests: string[];
  interestOptions: string[];
  interestsLoading: boolean;
  onInterestsToggle: (item: string) => void;
  fieldValues: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
  chipValues: Record<string, string[]>;
  onChipToggle: (key: string, option: string) => void;
  industries: string[];
  industryGrouped: Record<string, string[]>;
  onIndustriesToggle: (option: string) => void;
  geographyFocus: string[];
  geographyGrouped: Record<string, string[]>;
  onGeographyToggle: (option: string) => void;
  lookupLoading: boolean;
  orgWebsite: string;
  onOrgWebsiteChange: (value: string) => void;
  revRange: [number, number];
  ebitdaRange: [number, number];
  evRange: [number, number];
  onRevChange: (lo: number, hi: number) => void;
  onEbitdaChange: (lo: number, hi: number) => void;
  onEvChange: (lo: number, hi: number) => void;
  uploads: Record<string, PickedFile | null>;
  onUploadChange: (key: string, file: PickedFile | null) => void;
  uploadingKey: string | null;
  /** Per-slider "X range is required" text — see `Step4Fields.tsx`'s `rangeErrors` doc comment
   * and the wizard's own header comment for why this exists now. */
  rangeErrors?: Partial<Record<'rev' | 'ebitda' | 'ev', string>>;
}) {
  const { colors, fonts } = useTheme();
  const designationOptions = ROLE_CONFIG[roleLabel]?.designationOptions ?? [];

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Text style={[fonts.display, styles.headline, { color: colors.obInk }]}>{roleLabel}&apos;s details</Text>
        <Text style={[fonts.regular, styles.body, { color: colors.obInk3 }]}>
          {subStep === 'a'
            ? 'Tell us about your second profile — this only affects the new role.'
            : 'A few education, search and financial details to finish up.'}
        </Text>
      </View>

      {subStep === 'a' ? (
        <>
          <View style={{ gap: 6 }}>
            <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>
              Bio <Text style={{ color: colors.obInk3, fontWeight: '600' }}>(optional)</Text>
            </Text>
            <TextInput
              value={bio}
              onChangeText={onBioChange}
              multiline
              numberOfLines={4}
              placeholder="This bio appears only on your new profile. Your current bio is unchanged."
              placeholderTextColor={colors.obInk3}
              style={[
                styles.textarea,
                { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk },
              ]}
            />
          </View>

          <Text style={[fonts.bold, styles.eyebrow, { color: colors.obInk3 }]}>ORGANIZATION &amp; PROFILE</Text>

          <View style={{ gap: 6 }}>
            <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>
              Your role / designation <Text style={{ color: colors.obRequired }}>*</Text>
            </Text>
            <FieldDropdown
              value={designation}
              placeholder="Select your designation"
              options={designationOptions}
              onChange={onDesignationChange}
              onFieldFocus={onDesignationFieldFocus}
              onFieldBlur={onDesignationFieldBlur}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>
              Organization / company name <Text style={{ color: colors.obRequired }}>*</Text>
            </Text>
            <TextInput
              value={orgName}
              onChangeText={onOrgNameChange}
              placeholder="e.g. Strivedge"
              placeholderTextColor={colors.obInk3}
              style={[
                styles.plainInput,
                { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk },
              ]}
            />
          </View>

          <ChipMultiSelect
            label="Suggested Interests"
            required
            options={interestOptions}
            selected={interests}
            onToggle={onInterestsToggle}
            emptyHint="Tap a suggestion below to add your first interest."
            loading={interestsLoading}
            searchable
            searchPlaceholder="Search interests..."
          />
        </>
      ) : (
        <Step4Fields
          role={roleLabel}
          fieldValues={fieldValues}
          onFieldChange={onFieldChange}
          chipValues={chipValues}
          onChipToggle={onChipToggle}
          industries={industries}
          industryGrouped={industryGrouped}
          onIndustriesToggle={onIndustriesToggle}
          geographyFocus={geographyFocus}
          geographyGrouped={geographyGrouped}
          onGeographyToggle={onGeographyToggle}
          lookupLoading={lookupLoading}
          orgWebsite={orgWebsite}
          onOrgWebsiteChange={onOrgWebsiteChange}
          revRange={revRange}
          ebitdaRange={ebitdaRange}
          evRange={evRange}
          onRevChange={onRevChange}
          onEbitdaChange={onEbitdaChange}
          onEvChange={onEvChange}
          uploads={uploads}
          onUploadChange={onUploadChange}
          uploadingKey={uploadingKey}
          showProgress={false}
          rangeErrors={rangeErrors}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 12.5, lineHeight: 18 },
  fieldLabel: { fontSize: 11 },
  eyebrow: { fontSize: 10, letterSpacing: 0.7, marginTop: 2 },
  textarea: {
    height: 84,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  plainInput: {
    height: 46,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 13.5,
  },
});
