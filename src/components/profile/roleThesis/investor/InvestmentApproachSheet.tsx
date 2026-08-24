import React, { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { types } from '@react-native-documents/picker';
import { AlignLeft } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateInvestorThesis, InvestorThesis } from '../../../../api/roleThesis';
import { uploadDocument } from '../../../../api/profile';
import { FileUploadButton, PickedFile } from '../../../FileUploadButton';

const DUE_DILIGENCE_OPTIONS = ['Quality of Earnings', 'Commercial DD', 'Management Assessment', 'Legal Review', 'Tech / IT DD', 'Environmental DD', 'Customer Interviews', 'R&W Insurance', 'Operations DD', 'HR/Talent DD'];
const PREFERRED_DEAL_SOURCES = ['Searchers', 'Intermediaries', 'Business Brokers', 'Direct from seller', 'Investment Banks', 'Independent Sponsors', 'PE firm referrals'];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const DOC_UPLOAD_TYPES = [types.pdf, types.doc, types.docx];

/** "Investment Approach" edit sheet — matches web's real `InvestmentApproachCard`
 * (`InvestmentThesisTab.tsx:536-704`): Investment Thesis Document upload
 * (`uploadType="investment_thesis"`), Investment Thesis Summary textarea, Due Diligence Approach
 * (multi), Preferred Deals From (multi) — all optional. */
export function InvestmentApproachSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: InvestorThesis;
  onClose: () => void;
  onSaved: (patch: Partial<InvestorThesis>) => void;
}) {
  const { colors } = useTheme();
  const [docUrl, setDocUrl] = useState('');
  const [docFile, setDocFile] = useState<PickedFile | null>(null);
  const [docUploading, setDocUploading] = useState(false);
  const [summary, setSummary] = useState('');
  const [dueDiligence, setDueDiligence] = useState<string[]>([]);
  const [preferredSources, setPreferredSources] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDocUrl(thesis.investmentCriteriaUrl);
    setDocFile(thesis.investmentCriteriaUrl ? { uri: thesis.investmentCriteriaUrl, name: 'Investment thesis document', size: null, mimeType: null } : null);
    setSummary(thesis.investmentThesisSummary);
    setDueDiligence(thesis.dueDiligenceApproach);
    setPreferredSources(thesis.preferredSelections);
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
      const { fileUrl } = await uploadDocument(file, 'investment_thesis');
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
    const patch: Partial<InvestorThesis> = {
      investmentCriteriaUrl: docUrl,
      investmentThesisSummary: summary.trim(),
      dueDiligenceApproach: dueDiligence,
      preferredSelections: preferredSources,
    };
    try {
      await updateInvestorThesis(patch);
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
      icon={<AlignLeft size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Investment Approach"
      description="How you evaluate and engage with deals"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Investment thesis document">
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

      <ThesisField label="Investment thesis summary">
        <TextInput
          value={summary}
          onChangeText={setSummary}
          placeholder="Describe your investment thesis in your own words — what types of businesses you look for, how you add value, and what makes a deal attractive to you."
          placeholderTextColor={colors.ink3}
          multiline
          textAlignVertical="top"
          style={[styles.textarea, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder, color: colors.ink }]}
        />
      </ThesisField>

      <ThesisField label="Due diligence approach">
        <ThesisPillRow options={DUE_DILIGENCE_OPTIONS} selected={dueDiligence} onToggle={o => toggle(dueDiligence, setDueDiligence, o)} />
      </ThesisField>

      <ThesisField label="Preferred deals from">
        <ThesisPillRow options={PREFERRED_DEAL_SOURCES} selected={preferredSources} onToggle={o => toggle(preferredSources, setPreferredSources, o)} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  textarea: { height: 100, padding: 13, borderWidth: 1, borderRadius: 12, fontSize: 12.5, lineHeight: 18 },
});
