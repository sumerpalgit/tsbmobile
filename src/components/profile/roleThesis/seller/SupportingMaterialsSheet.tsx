import React, { useCallback, useEffect, useState } from 'react';
import { FileText } from 'lucide-react-native';
import { types } from '@react-native-documents/picker';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisField } from '../ThesisField';
import { updateBusinessOwnerThesis, BusinessOwnerThesis } from '../../../../api/roleThesis';
import { uploadDocument } from '../../../../api/profile';
import { FileUploadButton, PickedFile } from '../../../FileUploadButton';
import { PrivacyNote } from './PrivacyNote';

const DOC_UPLOAD_TYPES = [types.pdf, types.doc, types.docx];
/** Web's own helper text says "PDF or Word · Max 20MB" (`IntermediaryThesisTab.tsx:424`) — DOUBLE
 * Operator's 10MB CIM-adjacent limit, a genuinely different real max for this role, not copied from
 * elsewhere. */
const MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;

/** "Supporting Materials" edit sheet — matches web's real Card 6
 * (`IntermediaryThesisTab.tsx:958-1040`). Single field: the CIM/teaser document. */
export function SupportingMaterialsSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: BusinessOwnerThesis;
  onClose: () => void;
  onSaved: (patch: Partial<BusinessOwnerThesis>) => void;
}) {
  const { colors } = useTheme();
  const [cimDocumentUrl, setCimDocumentUrl] = useState('');
  const [cimFile, setCimFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setCimDocumentUrl(thesis.cimDocumentUrl);
    setCimFile(thesis.cimDocumentUrl ? { uri: thesis.cimDocumentUrl, name: 'CIM Document', size: null, mimeType: null } : null);
  }, [visible, thesis]);

  const handleCimChange = useCallback(async (file: PickedFile | null) => {
    setCimFile(file);
    if (!file) {
      setCimDocumentUrl('');
      return;
    }
    setUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'cim');
      setCimDocumentUrl(fileUrl);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
      setCimFile(null);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<BusinessOwnerThesis> = { cimDocumentUrl };
    try {
      await updateBusinessOwnerThesis(patch);
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
      iconBg={colors.hero1}
      iconColor="#fff"
      title="Supporting materials"
      description="CIM and documents for matched buyers"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="CIM / Teaser Document">
        <FileUploadButton
          value={cimFile}
          onChange={handleCimChange}
          loading={uploading}
          variant="dropzone"
          acceptedTypes={DOC_UPLOAD_TYPES}
          maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
          placeholder="PDF or Word · Max 20MB · Shared only with matched, NDA-signed buyers"
          uploadedCaption="Tap to replace"
        />
      </ThesisField>

      <PrivacyNote>
        Your CIM is gated behind NDA acceptance. Only buyers you approve can access it. If you don&rsquo;t have one yet, you can upload a teaser or executive summary to start.
      </PrivacyNote>
    </RoleThesisEditSheet>
  );
}
