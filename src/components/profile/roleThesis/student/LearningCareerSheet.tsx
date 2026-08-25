import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateStudentThesis, StudentThesis } from '../../../../api/roleThesis';
import Toast from 'react-native-toast-message';
import { GraduationCap } from 'lucide-react-native';

const ACADEMIC_STAGE_OPTIONS = [
  'Undergraduate student (current)',
  'Graduate / MBA student (current)',
  'Recently graduated (within last 12 months)',
  'Early career professional (1 – 3 years out)',
  'Professional course (CPA / CFA / etc.)',
  'Other (please specify)',
];
const ETA_INTEREST_OPTIONS = [
  'Becoming a searcher / acquirer',
  'Working with a search fund',
  'Investing in ETA deals',
  'Advisory / Professional services for ETA',
  'Research & academia',
  'Other (please specify)',
];
const LOOKING_FOR_OPTIONS = [
  'Internship / summer role', 'Part-time project work', 'Mentorship from ETA practitioners',
  'Full-time role post-graduation', 'Co-searcher opportunity', 'Deal sourcing support',
  'Financial modelling projects', 'Research collaboration', 'Networking & community',
];
const WORK_INTERESTED_OPTIONS = [
  'Deal sourcing & pipeline building',
  'Financial modeling & valuation',
  'Due diligence support',
  'Market & industry research',
  'Operational improvement projects',
  'Sales & business development',
  'Marketing & growth initiatives',
  'Technology & systems implementation',
  'Administrative & deal coordination',
  'Content creation & thought leadership',
  'General search fund support (broad / varied)',
  'Legal & Compliance',
  'Flexible to requirements',
  'Other (please specify)',
];

/** "Learning & Career Intent" edit sheet — matches web's real Card 1 (`StudentThesisTab.tsx:239-331`).
 * `academicStage`/`primaryInterest` are the ONE exception to this role's "always pills" rule — web
 * genuinely uses `<select>` dropdowns for these two fields specifically. */
export function LearningCareerSheet({
  visible,
  thesis,
  onClose,
  onSaved,
}: {
  visible: boolean;
  thesis: StudentThesis;
  onClose: () => void;
  onSaved: (patch: Partial<StudentThesis>) => void;
}) {
  const { colors } = useTheme();
  const [academicStage, setAcademicStage] = useState('');
  const [primaryInterest, setPrimaryInterest] = useState('');
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [workInterestedIn, setWorkInterestedIn] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAcademicStage(thesis.academicStage);
    setPrimaryInterest(thesis.primaryInterest);
    setLookingFor(thesis.lookingFor);
    setWorkInterestedIn(thesis.workInterestedIn);
  }, [visible, thesis]);

  const toggleLookingFor = useCallback((option: string) => setLookingFor(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleWorkInterested = useCallback((option: string) => setWorkInterestedIn(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<StudentThesis> = {
      academicStage,
      primaryInterest,
      lookingFor,
      workInterestedIn,
    };
    try {
      await updateStudentThesis(patch);
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
      icon={<GraduationCap size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Learning & career intent"
      description="Where they are and what they want"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Where Are You in Your Academic Journey?" required>
        <ThesisDropdown options={ACADEMIC_STAGE_OPTIONS} value={academicStage} onChange={setAcademicStage} placeholder="Select your stage" />
      </ThesisField>

      <ThesisField label="What Is Your Primary Interest in ETA?">
        <ThesisDropdown options={ETA_INTEREST_OPTIONS} value={primaryInterest} onChange={setPrimaryInterest} placeholder="Select your primary interest" />
      </ThesisField>

      <ThesisField label="What Are You Looking For?">
        <ThesisPillRow options={LOOKING_FOR_OPTIONS} selected={lookingFor} onToggle={toggleLookingFor} />
      </ThesisField>

      <ThesisField label="Type of Work You Are Interested In">
        <ThesisPillRow options={WORK_INTERESTED_OPTIONS} selected={workInterestedIn} onToggle={toggleWorkInterested} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
