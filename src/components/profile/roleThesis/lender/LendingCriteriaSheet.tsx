import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { types } from '@react-native-documents/picker';
import { FileText } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisSearchableChips } from '../ThesisSearchableChips';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateLenderThesis, LenderThesis } from '../../../../api/roleThesis';
import { uploadDocument } from '../../../../api/profile';
import { FileUploadButton, PickedFile } from '../../../FileUploadButton';
import { getIndustriesGrouped, getGeographiesGrouped } from '../../../../api/lookup';

const DOC_UPLOAD_TYPES = [types.pdf, types.doc, types.docx, types.ppt, types.pptx];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

/** "Lending Criteria" edit sheet — matches web's real `LendingCriteriaCard`
 * (`LenderThesisTab.tsx`, Card 2): document upload (`lendingCriteriaUrl`, accepts PDF/Word/
 * PowerPoint unlike Investor/Searcher's PDF/Word-only doc fields), Industry Focus/Avoided
 * Industries/Geography Focus (search-gated, same `ThesisSearchableChips` pattern as every other
 * role), then 3 `$min–$max` range pairs. */
export function LendingCriteriaSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: LenderThesis;
  onClose: () => void;
  onSaved: (patch: Partial<LenderThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [docUrl, setDocUrl] = useState('');
  const [docFile, setDocFile] = useState<PickedFile | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [geographies, setGeographies] = useState<string[]>([]);
  const [minRevenue, setMinRevenue] = useState('');
  const [maxRevenue, setMaxRevenue] = useState('');
  const [minEbitda, setMinEbitda] = useState('');
  const [maxEbitda, setMaxEbitda] = useState('');
  const [minDeal, setMinDeal] = useState('');
  const [maxDeal, setMaxDeal] = useState('');
  const [saving, setSaving] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDocUrl(thesis.lendingCriteriaDocumentUrl);
    setDocFile(thesis.lendingCriteriaDocumentUrl ? { uri: thesis.lendingCriteriaDocumentUrl, name: 'Lending criteria document', size: null, mimeType: null } : null);
    setIndustries(thesis.industries);
    setExcluded(thesis.excludedIndustries);
    setGeographies(thesis.geographies);
    setMinRevenue(thesis.targetRevenueMin);
    setMaxRevenue(thesis.targetRevenueMax);
    setMinEbitda(thesis.targetEbitdaMin);
    setMaxEbitda(thesis.targetEbitdaMax);
    setMinDeal(thesis.targetDealSizeMin);
    setMaxDeal(thesis.targetDealSizeMax);
    setOptionsLoading(true);
    Promise.all([getIndustriesGrouped(), getGeographiesGrouped()])
      .then(([industryGrouped, geoGrouped]) => {
        setIndustryOptions(Object.values(industryGrouped).flat());
        setGeoOptions(Object.values(geoGrouped).flat());
      })
      .finally(() => setOptionsLoading(false));
  }, [visible, thesis]);

  // Stable callback identity (functional `setState`) so `ThesisSearchableChips`'s memoization
  // actually takes effect — see `ThesisPillRow`'s own doc comment for why.
  const toggleIndustries = useCallback((option: string) => setIndustries(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleExcluded = useCallback((option: string) => setExcluded(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleGeographies = useCallback((option: string) => setGeographies(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleDocChange = async (file: PickedFile | null) => {
    setDocFile(file);
    if (!file) {
      setDocUrl('');
      return;
    }
    setDocUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'lending_criteria');
      setDocUrl(fileUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      setDocFile(null);
    } finally {
      setDocUploading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<LenderThesis> = {
      lendingCriteriaDocumentUrl: docUrl,
      industries,
      excludedIndustries: excluded,
      geographies,
      targetRevenueMin: minRevenue.trim(),
      targetRevenueMax: maxRevenue.trim(),
      targetEbitdaMin: minEbitda.trim(),
      targetEbitdaMax: maxEbitda.trim(),
      targetDealSizeMin: minDeal.trim(),
      targetDealSizeMax: maxDeal.trim(),
    };
    try {
      await updateLenderThesis(patch);
      onSaved(patch);
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not save', text2: 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleThesisEditSheet
      visible={visible}
      onClose={onClose}
      icon={<FileText size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Lending Criteria"
      description="What businesses you will lend against"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Lending criteria document">
        <FileUploadButton
          value={docFile}
          onChange={handleDocChange}
          loading={docUploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF, Word or PowerPoint · Max 10MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <ThesisField label="Industry focus">
        <ThesisSearchableChips
          selected={industries}
          onToggle={toggleIndustries}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Search industries…"
        />
      </ThesisField>

      <ThesisField label="Avoided industries">
        <ThesisSearchableChips
          selected={excluded}
          onToggle={toggleExcluded}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Select industries you will not lend against"
          tone="danger"
        />
      </ThesisField>

      <ThesisField label="Geography focus">
        <ThesisSearchableChips
          selected={geographies}
          onToggle={toggleGeographies}
          options={optionsLoading ? [] : geoOptions}
          placeholder="Search regions…"
        />
      </ThesisField>

      <ThesisField label="Business preferred revenue">
        <ThesisRangeInput minValue={minRevenue} maxValue={maxRevenue} onMinChange={setMinRevenue} onMaxChange={setMaxRevenue} minPlaceholder="1,000,000" maxPlaceholder="20,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Annual revenue, USD</Text>
      </ThesisField>

      <ThesisField label="Business preferred EBITDA">
        <ThesisRangeInput minValue={minEbitda} maxValue={maxEbitda} onMinChange={setMinEbitda} onMaxChange={setMaxEbitda} minPlaceholder="300,000" maxPlaceholder="5,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Normalised EBITDA, USD</Text>
      </ThesisField>

      <ThesisField label="Preferred deal size">
        <ThesisRangeInput minValue={minDeal} maxValue={maxDeal} onMinChange={setMinDeal} onMaxChange={setMaxDeal} minPlaceholder="2,000,000" maxPlaceholder="25,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Enterprise value, USD</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 10.5, marginTop: 6 },
});
