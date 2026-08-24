import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
import { FileText } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisSearchableChips } from '../ThesisSearchableChips';
import { ThesisRangeInput } from '../ThesisRangeInput';
import { ThesisField } from '../ThesisField';
import { updateSearcherThesis, SearcherThesis } from '../../../../api/roleThesis';
import { getIndustriesGrouped, getGeographiesGrouped } from '../../../../api/lookup';
import { uploadDocument } from '../../../../api/profile';
import { FileUploadButton, PickedFile } from '../../../FileUploadButton';
import { types } from '@react-native-documents/picker';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const DOC_UPLOAD_TYPES = [types.pdf, types.doc, types.docx];

/** "Search Thesis" edit sheet — matches web's real `SearchThesisCard` field set
 * (`SearcherThesisTab.tsx:213-438`): Search Thesis Document upload (`uploadType="search_thesis"`),
 * Industry Focus/Geography Focus (searchable, search-gated per the Deal Coverage precedent),
 * Business Preferred Revenue/EBITDA/Preferred Deal Size (ranges), Ownership Preference. Note
 * `searchThesis` (the summary paragraph) has NO input anywhere in web's edit mode — it's
 * read-only/set elsewhere, so it isn't editable here either. */
export function SearchThesisSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: SearcherThesis;
  onClose: () => void;
  onSaved: (patch: Partial<SearcherThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [docUrl, setDocUrl] = useState('');
  const [docFile, setDocFile] = useState<PickedFile | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [industries, setIndustries] = useState<string[]>([]);
  const [geographies, setGeographies] = useState<string[]>([]);
  const [revMin, setRevMin] = useState('');
  const [revMax, setRevMax] = useState('');
  const [ebitdaMin, setEbitdaMin] = useState('');
  const [ebitdaMax, setEbitdaMax] = useState('');
  const [dealMin, setDealMin] = useState('');
  const [dealMax, setDealMax] = useState('');
  const [ownership, setOwnership] = useState('');
  const [saving, setSaving] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);
  const [geoOptions, setGeoOptions] = useState<string[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDocUrl(thesis.searchThesisDocumentUrl);
    setDocFile(thesis.searchThesisDocumentUrl ? { uri: thesis.searchThesisDocumentUrl, name: 'Search thesis document', size: null, mimeType: null } : null);
    setIndustries(thesis.industries);
    setGeographies(thesis.geographies);
    setRevMin(thesis.targetRevenueMin);
    setRevMax(thesis.targetRevenueMax);
    setEbitdaMin(thesis.targetEbitdaMin);
    setEbitdaMax(thesis.targetEbitdaMax);
    setDealMin(thesis.targetDealSizeMin);
    setDealMax(thesis.targetDealSizeMax);
    setOwnership(thesis.ownershipPreference);
    setOptionsLoading(true);
    Promise.all([getIndustriesGrouped(), getGeographiesGrouped()])
      .then(([industryGrouped, geoGrouped]) => {
        setIndustryOptions(Object.values(industryGrouped).flat());
        setGeoOptions(Object.values(geoGrouped).flat());
      })
      .finally(() => setOptionsLoading(false));
  }, [visible, thesis]);

  const toggle = (list: string[], setList: (v: string[]) => void, option: string) => {
    setList(list.includes(option) ? list.filter(o => o !== option) : [...list, option]);
  };

  const handleDocChange = async (file: PickedFile | null) => {
    setDocFile(file);
    if (!file) {
      setDocUrl('');
      return;
    }
    setDocUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'search_thesis');
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
    const patch: Partial<SearcherThesis> = {
      searchThesisDocumentUrl: docUrl,
      industries,
      geographies,
      targetRevenueMin: revMin.trim(),
      targetRevenueMax: revMax.trim(),
      targetEbitdaMin: ebitdaMin.trim(),
      targetEbitdaMax: ebitdaMax.trim(),
      targetDealSizeMin: dealMin.trim(),
      targetDealSizeMax: dealMax.trim(),
      ownershipPreference: ownership.trim(),
    };
    try {
      await updateSearcherThesis(patch);
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
      title="Search Thesis"
      description="What you are looking to acquire"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Search thesis document">
        <FileUploadButton
          value={docFile}
          onChange={handleDocChange}
          loading={docUploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF, DOC or DOCX · Max 10MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <ThesisField label="Industry focus">
        <ThesisSearchableChips
          selected={industries}
          onToggle={o => toggle(industries, setIndustries, o)}
          options={optionsLoading ? [] : industryOptions}
          placeholder="Search industries…"
        />
      </ThesisField>

      <ThesisField label="Geography focus">
        <ThesisSearchableChips
          selected={geographies}
          onToggle={o => toggle(geographies, setGeographies, o)}
          options={optionsLoading ? [] : geoOptions}
          placeholder="Search regions…"
        />
      </ThesisField>

      <ThesisField label="Business preferred revenue">
        <ThesisRangeInput minValue={revMin} maxValue={revMax} onMinChange={setRevMin} onMaxChange={setRevMax} minPlaceholder="2,000,000" maxPlaceholder="15,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Annual revenue, in USD</Text>
      </ThesisField>

      <ThesisField label="Business preferred EBITDA">
        <ThesisRangeInput minValue={ebitdaMin} maxValue={ebitdaMax} onMinChange={setEbitdaMin} onMaxChange={setEbitdaMax} minPlaceholder="500,000" maxPlaceholder="3,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Normalised EBITDA, in USD</Text>
      </ThesisField>

      <ThesisField label="Preferred deal size">
        <ThesisRangeInput minValue={dealMin} maxValue={dealMax} onMinChange={setDealMin} onMaxChange={setDealMax} minPlaceholder="3,000,000" maxPlaceholder="20,000,000" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Enterprise value, in USD</Text>
      </ThesisField>

      <ThesisField label="Ownership preference">
        <TextInput
          value={ownership}
          onChangeText={setOwnership}
          placeholderTextColor={colors.ink3}
          style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  hint: { fontSize: 10.5, marginTop: 6 },
});
