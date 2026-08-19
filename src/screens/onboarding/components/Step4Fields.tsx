import React, { Fragment } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { types } from '@react-native-documents/picker';
import { useTheme } from '../../../theme';
import { FileUploadButton, PickedFile } from '../../../components';
import { FINANCIAL_RANGES } from '../constants';
import { ROLE_CONFIG } from '../roleConfig';
import { ChipMultiSelect } from './ChipMultiSelect';
import { DualRangeSlider } from './DualRangeSlider';
import { DynamicField } from './DynamicField';
import { SearchableMultiSelect } from './SearchableMultiSelect';

/**
 * Step 4 body — "Business Details", part 2 of the 2-part flow (Step 3 is part 1). Fully
 * config-driven off the selected role's `ROLE_CONFIG` entry (`../roleConfig`), same
 * architecture as web's `UnifiedRoleForm`: one component reads a per-role config instead of 8
 * hand-built forms. Renders, per role: its own field sections (`config.sections`), the shared
 * Industries/Geography multi-selects (every role), Organization Website (3 roles), Financial
 * Criteria sliders (7 of 8 roles — not Student), and its declared file uploads (varies by role,
 * several roles have none).
 */
// `POST /api/upload/document` (`src/api/profile.ts`'s `uploadDocument`) only accepts these three
// MIME types server-side (confirmed by backend, 2026-08-13) — a few of web's own forms let users
// pick .ppt/.pptx and the backend 400s, a real web inconsistency deliberately NOT replicated here.
const DOCUMENT_UPLOAD_TYPES = [types.pdf, types.doc, types.docx];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export function Step4Fields({
  role,
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
  showProgress = true,
  rangeErrors,
}: {
  role: string;
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
  /** Key currently mid-upload (network call in flight after pick), or null — shows a
   * loading state on that upload's button, mirroring web's `uploadingField`. */
  uploadingKey: string | null;
  /** Onboarding's own "Step 2 of 2 · Business Details" sub-progress header — `false` for reuse
   * sites (e.g. Create Dual Profile's Business Details step) whose own mockup has no such
   * element, so it doesn't render chrome the reused site's real design doesn't call for. */
  showProgress?: boolean;
  /** Per-slider "X range is required" text (matches real web's `UnifiedRoleForm` validation) —
   * opt-in and keyed the same as `FINANCIAL_RANGES`/`rangeValues` above. Onboarding's own call
   * site doesn't pass this (it shows one generic banner instead, via `isStep4Complete`), so this
   * defaults to no errors and changes nothing there. */
  rangeErrors?: Partial<Record<'rev' | 'ebitda' | 'ev', string>>;
}) {
  const { colors, fonts } = useTheme();
  const config = ROLE_CONFIG[role];
  const rangeHandlers = { rev: onRevChange, ebitda: onEbitdaChange, ev: onEvChange };
  const rangeValues = { rev: revRange, ebitda: ebitdaRange, ev: evRange };

  if (!config) return null;

  return (
    <View style={{ gap: 18 }}>
      {showProgress && (
        <View style={{ gap: 7 }}>
          <View style={styles.progressRow}>
            <Text style={[fonts.semibold, styles.progressLabel, { color: colors.obInk3 }]}>Step 2 of 2 · Business Details</Text>
            <Text style={[fonts.semibold, styles.progressLabel, { color: colors.obGold }]}>100% complete</Text>
          </View>
          <View style={styles.progressBarRow}>
            <View style={[styles.progressSegment, { backgroundColor: colors.obGold }]} />
            <View style={[styles.progressSegment, { backgroundColor: colors.obGold }]} />
          </View>
        </View>
      )}

      {config.sections.map((section, i) => (
        <Fragment key={section.title}>
          {i > 0 && <View style={[styles.divider, { backgroundColor: colors.obLine2 }]} />}
          <View style={{ gap: 12 }}>
            <Text style={[fonts.bold, styles.sectionTitle, { color: colors.obInk }]}>{section.title}</Text>

            {section.fields.map(field =>
              field.type === 'chips' ? (
                <ChipMultiSelect
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  options={field.chipOptions ?? []}
                  selected={chipValues[field.key] ?? []}
                  onToggle={option => onChipToggle(field.key, option)}
                />
              ) : (
                <DynamicField
                  key={field.key}
                  field={field}
                  value={fieldValues[field.key] ?? ''}
                  otherValue={fieldValues[`${field.key}Other`] ?? ''}
                  onChange={value => onFieldChange(field.key, value)}
                  onOtherChange={value => onFieldChange(`${field.key}Other`, value)}
                />
              ),
            )}
          </View>
        </Fragment>
      ))}

      <View style={[styles.divider, { backgroundColor: colors.obLine2 }]} />

      {/* Shared by every role — web's role-agnostic `useIndustries()`/`useGeographies()`, both
          searchable (matches real web's `SearchableMultiSelect`, not a flat chip wall). */}
      <View style={{ gap: 16 }}>
        <SearchableMultiSelect
          label="Industries of Interest"
          required
          grouped={industryGrouped}
          selected={industries}
          onToggle={onIndustriesToggle}
          loading={lookupLoading}
          placeholder="Search and select industries"
        />
        <SearchableMultiSelect
          label="Geography Focus"
          required
          grouped={geographyGrouped}
          selected={geographyFocus}
          onToggle={onGeographyToggle}
          loading={lookupLoading}
          placeholder="Search and select regions"
        />
      </View>

      {config.hasOrgWebsite && (
        <View style={{ gap: 7 }}>
          <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
            Organization Website <Text style={{ color: colors.obInk3 }}>(optional)</Text>
          </Text>
          <TextInput
            style={[styles.plainInput, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk }]}
            value={orgWebsite}
            onChangeText={onOrgWebsiteChange}
            placeholder="https://example.com"
            placeholderTextColor={colors.obInk3}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>
      )}

      {config.hasDealRange && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.obLine2 }]} />
          <View style={{ gap: 16 }}>
            <Text style={[fonts.bold, styles.sectionTitle, { color: colors.obInk }]}>Financial Criteria</Text>
            {FINANCIAL_RANGES.map(r => (
              <DualRangeSlider
                key={r.key}
                label={r.label}
                required
                min={r.min}
                max={r.max}
                step={r.step}
                unit={r.unit}
                lo={rangeValues[r.key][0]}
                hi={rangeValues[r.key][1]}
                onChange={rangeHandlers[r.key]}
                error={rangeErrors?.[r.key]}
              />
            ))}
          </View>
        </>
      )}

      {config.uploads.length > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.obLine2 }]} />
          <View style={{ gap: 12 }}>
            {config.uploads.map(upload => (
              <View key={upload.key} style={{ gap: 7 }}>
                <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
                  {upload.label} <Text style={{ color: colors.obInk3 }}>(optional)</Text>
                </Text>
                <FileUploadButton
                  value={uploads[upload.key] ?? null}
                  onChange={file => onUploadChange(upload.key, file)}
                  loading={uploadingKey === upload.key}
                  acceptedTypes={DOCUMENT_UPLOAD_TYPES}
                  maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
                  placeholder="Tap to upload (PDF, DOC, DOCX)"
                />
              </View>
            ))}
          </View>
        </>
      )}
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
  divider: {
    height: 1,
  },
});
