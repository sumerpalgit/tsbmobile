import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { types } from '@react-native-documents/picker';
import { Star } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateIntermediaryThesis, IntermediaryThesis } from '../../../../api/roleThesis';
import { uploadDocument } from '../../../../api/profile';
import { FileUploadButton, PickedFile } from '../../../FileUploadButton';

const DIFFERENTIATION_TAGS = [
  'Recurring revenue', 'Strong management team', 'Proprietary technology / IP', 'Brand & reputation',
  'Long-term customer contracts', 'Owner-independent operations', 'Trained & retained staff', 'Real estate included',
  'Digital / scalable model', 'Strong supplier relationships', 'High margins', 'Fragmented market opportunity',
];
const PITCH_MAX = 500;
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
// `POST /upload/document` only accepts these three MIME types server-side (confirmed by backend,
// see `Step4Fields.tsx`'s own doc comment) — the mockup's "PDF, Word or PowerPoint" copy isn't
// followed literally here since PowerPoint would 400, same real web/backend inconsistency
// Step4Fields already found and deliberately didn't replicate.
const CIM_UPLOAD_TYPES = [types.pdf, types.doc, types.docx];

/** "Track record & credibility" edit sheet — matches the mockup's Track Record & Credibility
 * sheet exactly (decoded `profilelast_decoded_role.html:3283-3348`): a Deals Closed/Total Deal
 * Value 2-col grid, a CIM/Credentials document upload, an optional Differentiation & Value Add
 * multi-select, and an optional 500-char About/Written Pitch. CIM upload reuses
 * `FileUploadButton`'s `variant="dropzone"` + `uploadDocument(file, 'seller_cim')`
 * (`src/api/profile.ts`) — the same components View Profile's own Overview tab already uses for
 * its Current Organization credentials deck — rather than hand-rolling a new upload widget; its
 * hardcoded "Click to upload or drag and drop" line is a minor copy difference from the mockup's
 * own "Upload CIM or offering document" wording, accepted rather than forking the shared component
 * for one line of copy. Persists `dealsClosed`/`totalDealValue`/`cimUrl`/`differentiationTags`/
 * `differentiationBio`, matching web's real `SellerData` field names. */
export function TrackRecordSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: IntermediaryThesis;
  onClose: () => void;
  onSaved: (patch: Partial<IntermediaryThesis>) => void;
}) {
  const { colors, fonts } = useTheme();
  const [deals, setDeals] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [cimUrl, setCimUrl] = useState('');
  const [cimFile, setCimFile] = useState<PickedFile | null>(null);
  const [cimUploading, setCimUploading] = useState(false);
  const [diffs, setDiffs] = useState<string[]>([]);
  const [pitch, setPitch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDeals(thesis.dealsClosed);
    setDealValue(thesis.totalDealValue);
    setCimUrl(thesis.cimUrl);
    setCimFile(thesis.cimUrl ? { uri: thesis.cimUrl, name: 'CIM document', size: null, mimeType: null } : null);
    setDiffs(thesis.differentiationTags);
    setPitch(thesis.differentiationBio);
  }, [visible, thesis]);

  const toggleDiff = (option: string) => {
    setDiffs(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]));
  };

  const handleCimChange = async (file: PickedFile | null) => {
    setCimFile(file);
    if (!file) {
      setCimUrl('');
      return;
    }
    setCimUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'seller_cim');
      setCimUrl(fileUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      setCimFile(null);
    } finally {
      setCimUploading(false);
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<IntermediaryThesis> = {
      dealsClosed: deals.trim(),
      totalDealValue: dealValue.trim(),
      cimUrl,
      differentiationTags: diffs,
      differentiationBio: pitch.trim(),
    };
    try {
      await updateIntermediaryThesis(patch);
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
      icon={<Star size={16} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Track record & credibility"
      description="Your deal history and credentials"
      saving={saving}
      onSave={handleSave}
    >
      <View style={styles.row}>
        <ThesisField label="Deals closed" style={styles.flexField}>
          <TextInput
            value={deals}
            onChangeText={setDeals}
            placeholder="e.g. 3"
            placeholderTextColor={colors.ink3}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
          />
          <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Total completed transactions</Text>
        </ThesisField>
        <ThesisField label="Total deal value facilitated" style={styles.flexField}>
          <View style={[styles.dollarBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}>
            <Text style={[styles.dollar, { color: colors.ink3 }]}>$</Text>
            <TextInput
              value={dealValue}
              onChangeText={setDealValue}
              placeholder="180,000,000"
              placeholderTextColor={colors.ink3}
              keyboardType="number-pad"
              style={[styles.dollarInput, { color: colors.ink }]}
            />
          </View>
          <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Cumulative transaction value, USD</Text>
        </ThesisField>
      </View>

      <ThesisField label="CIM / Credentials & Firm Profile">
        <FileUploadButton
          value={cimFile}
          onChange={handleCimChange}
          loading={cimUploading}
          variant="dropzone"
          acceptedTypes={CIM_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF, DOC or DOCX · Max 10MB"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <ThesisField label="Differentiation & value add (optional)">
        <ThesisPillRow options={DIFFERENTIATION_TAGS} selected={diffs} onToggle={toggleDiff} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>What makes your business stand out?</Text>
      </ThesisField>

      <ThesisField label="About / written pitch (optional)">
        <TextInput
          value={pitch}
          onChangeText={t => setPitch(t.slice(0, PITCH_MAX))}
          placeholder="Tell buyers what makes your business unique — recurring revenue, strong team, proprietary processes, brand reputation, customer retention, etc."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
        <Text style={[fonts.regular, styles.count, { color: colors.ink3 }]}>{pitch.length}/{PITCH_MAX}</Text>
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  flexField: { flex: 1, minWidth: 0 },
  input: { height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12, fontSize: 13 },
  dollarBox: { flexDirection: 'row', alignItems: 'center', height: 44, paddingHorizontal: 13, borderWidth: 1, borderRadius: 12 },
  dollar: { fontSize: 13, marginRight: 4 },
  dollarInput: { flex: 1, minWidth: 0, fontSize: 13, padding: 0 },
  hint: { fontSize: 10.5, marginTop: 6 },
  textarea: { height: 100, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
  count: { fontSize: 10.5, alignSelf: 'flex-end', marginTop: 4 },
});
