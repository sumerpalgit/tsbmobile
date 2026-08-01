import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../../../theme';
import { FileUploadButton, PickedFile } from '../../../components';
import {
  DEBT_STATUSES,
  EDUCATION_LEVELS,
  EQUITY_STATUSES,
  FIELDS_OF_STUDY,
  FINANCIAL_RANGES,
  FINANCING_READINESS_OPTIONS,
  PROFESSIONAL_BACKGROUNDS,
  SEARCH_STAGES,
  TIME_COMMITMENTS,
} from '../constants';
import { DualRangeSlider } from './DualRangeSlider';
import { FieldDropdown } from './FieldDropdown';

/** Step 4 body — "Education & Criteria", part 2 of the 2-part Business Details flow (Step 3 is
 * part 1). CIM upload uses the shared `FileUploadButton` (`src/components`) — a real OS
 * document/photo picker, not a UI-only mock. */
export function Step4Fields({
  edu,
  field,
  institution,
  stage,
  commitment,
  equity,
  debt,
  background,
  readiness,
  revRange,
  ebitdaRange,
  evRange,
  cimFile,
  onEduChange,
  onFieldChange,
  onInstitutionChange,
  onStageChange,
  onCommitmentChange,
  onEquityChange,
  onDebtChange,
  onBackgroundChange,
  onReadinessChange,
  onRevChange,
  onEbitdaChange,
  onEvChange,
  onCimChange,
}: {
  edu: string;
  field: string;
  institution: string;
  stage: string;
  commitment: string;
  equity: string;
  debt: string;
  background: string;
  readiness: string;
  revRange: [number, number];
  ebitdaRange: [number, number];
  evRange: [number, number];
  cimFile: PickedFile | null;
  onEduChange: (value: string) => void;
  onFieldChange: (value: string) => void;
  onInstitutionChange: (value: string) => void;
  onStageChange: (value: string) => void;
  onCommitmentChange: (value: string) => void;
  onEquityChange: (value: string) => void;
  onDebtChange: (value: string) => void;
  onBackgroundChange: (value: string) => void;
  onReadinessChange: (value: string) => void;
  onRevChange: (lo: number, hi: number) => void;
  onEbitdaChange: (lo: number, hi: number) => void;
  onEvChange: (lo: number, hi: number) => void;
  onCimChange: (file: PickedFile | null) => void;
}) {
  const { colors, fonts } = useTheme();
  const rangeHandlers = { rev: onRevChange, ebitda: onEbitdaChange, ev: onEvChange };
  const rangeValues = { rev: revRange, ebitda: ebitdaRange, ev: evRange };

  return (
    <View style={{ gap: 18 }}>
      {/* Sub-progress — 2 of 2, both segments filled since this is the last Business Details step */}
      <View style={{ gap: 7 }}>
        <View style={styles.progressRow}>
          <Text style={[fonts.semibold, styles.progressLabel, { color: colors.obInk3 }]}>
            Step 2 of 2 · Education & criteria
          </Text>
          <Text style={[fonts.semibold, styles.progressLabel, { color: colors.obGold }]}>100% complete</Text>
        </View>
        <View style={styles.progressBarRow}>
          <View style={[styles.progressSegment, { backgroundColor: colors.obGold }]} />
          <View style={[styles.progressSegment, { backgroundColor: colors.obGold }]} />
        </View>
      </View>

      {/* Education */}
      <View style={{ gap: 12 }}>
        <Text style={[fonts.bold, styles.sectionTitle, { color: colors.obInk }]}>Education</Text>

        <View style={{ gap: 7 }}>
          <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>Highest Level of Education</Text>
          <FieldDropdown value={edu} placeholder="Select education level" options={EDUCATION_LEVELS} onChange={onEduChange} />
        </View>

        <View style={{ gap: 7 }}>
          <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>Field of Study</Text>
          <FieldDropdown value={field} placeholder="Select field of study" options={FIELDS_OF_STUDY} onChange={onFieldChange} />
        </View>

        <View style={{ gap: 7 }}>
          <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
            Educational Institution <Text style={{ color: colors.obInk3 }}>(optional)</Text>
          </Text>
          <TextInput
            style={[
              styles.plainInput,
              { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk },
            ]}
            value={institution}
            onChangeText={onInstitutionChange}
            placeholder="University / Institution name"
            placeholderTextColor={colors.obInk3}
          />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.obLine2 }]} />

      {/* Search Details */}
      <View style={{ gap: 12 }}>
        <Text style={[fonts.bold, styles.sectionTitle, { color: colors.obInk }]}>Search Details</Text>

        {[
          { label: 'Stage of Search', value: stage, options: SEARCH_STAGES, onChange: onStageChange, required: true, placeholder: 'Select search stage' },
          { label: 'Time Commitment', value: commitment, options: TIME_COMMITMENTS, onChange: onCommitmentChange, required: true, placeholder: 'Select time commitment' },
          { label: 'Equity Capital Status', value: equity, options: EQUITY_STATUSES, onChange: onEquityChange, required: true, placeholder: 'Select equity status' },
          { label: 'Debt Financing Status', value: debt, options: DEBT_STATUSES, onChange: onDebtChange, required: true, placeholder: 'Select debt status' },
          { label: 'Professional Background', value: background, options: PROFESSIONAL_BACKGROUNDS, onChange: onBackgroundChange, required: false, placeholder: 'Select background' },
          { label: 'Financing Readiness', value: readiness, options: FINANCING_READINESS_OPTIONS, onChange: onReadinessChange, required: false, placeholder: 'Select readiness' },
        ].map(f => (
          <View key={f.label} style={{ gap: 7 }}>
            <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
              {f.label} {f.required && <Text style={{ color: colors.obRequired }}>*</Text>}
            </Text>
            <FieldDropdown value={f.value} placeholder={f.placeholder} options={f.options} onChange={f.onChange} />
          </View>
        ))}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.obLine2 }]} />

      {/* Financial Criteria */}
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
          />
        ))}

        <View style={{ gap: 7 }}>
          <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk }]}>
            CIM / Information Memorandum <Text style={{ color: colors.obInk3 }}>(optional)</Text>
          </Text>
          <FileUploadButton value={cimFile} onChange={onCimChange} />
        </View>
      </View>
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
