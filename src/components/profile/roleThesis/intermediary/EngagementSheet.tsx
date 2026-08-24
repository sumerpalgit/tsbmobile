import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateIntermediaryThesis, IntermediaryThesis } from '../../../../api/roleThesis';

const INVOLVEMENT = ['Fully involved post-sale', 'Consulting role (part-time)', 'Advisory board seat', 'Training & transition period only', 'Available for Q&A only', 'Full handover / No involvement'];
const DEAL_STAGES = ['Pre-LOI preparation', 'Due diligence support', 'Legal & contract review', 'Management presentations', 'Post-signing transition', 'Full process support'];
const SUPPORT_TYPES = ['Document preparation', 'Team introductions', 'Customer handover', 'Operational training', 'Supplier / vendor introductions', 'Staff retention planning'];
const OPEN_TO_ADVISOR = ['Yes — open to broker / advisor', 'No — direct buyer only', 'Case by case'];
const BUYER_TYPES = ['Individual buyer / Searcher (ETA)', 'Strategic buyer (competitor or industry player)', 'Private equity / Institutional buyer', 'Family office', 'Employee / Management team (MBO)', 'No preference — best offer wins', 'Open to discussion / Flexible'];

/** "Engagement & execution" edit sheet — the mockup itself has no real edit sheet for this card
 * (`IM_DEFS`'s status is hardcoded `'inc'` and its `onCta` just shows a generic toast, decoded
 * `profilelast_decoded_role.html:4314`), but web's `EngagementExecutionCard` has 5 real, fully
 * editable fields. Built here as a real functional sheet (not another toast stub) since this is
 * real web functionality even though the mockup never demonstrates its UI — layout inferred from
 * the other 4 sheets' own established pattern (label + `ThesisPillRow`, one field per group).
 * Persists `operationalInvolvement`/`dealStageInvolvement`/`transitionSupportTypes`/
 * `openToAdvisor`/`preferredBuyer`, matching web's real `SellerData` field names. */
export function EngagementSheet({
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
  const { colors } = useTheme();
  const [involvement, setInvolvement] = useState('');
  const [dealStages, setDealStages] = useState<string[]>([]);
  const [support, setSupport] = useState<string[]>([]);
  const [openToAdvisor, setOpenToAdvisor] = useState('');
  const [buyer, setBuyer] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setInvolvement(thesis.operationalInvolvement);
    setDealStages(thesis.dealStageInvolvement);
    setSupport(thesis.transitionSupportTypes);
    setOpenToAdvisor(thesis.openToAdvisor);
    setBuyer(thesis.preferredBuyer);
  }, [visible, thesis]);

  const toggle = (list: string[], setList: (v: string[]) => void, option: string) => {
    setList(list.includes(option) ? list.filter(o => o !== option) : [...list, option]);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<IntermediaryThesis> = {
      operationalInvolvement: involvement,
      dealStageInvolvement: dealStages,
      transitionSupportTypes: support,
      openToAdvisor,
      preferredBuyer: buyer,
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
      icon={<FileText size={16} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Engagement & execution"
      description="How you work with buyers, advisors and deal stages"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Post-sale involvement">
        <ThesisPillRow options={INVOLVEMENT} selected={involvement ? [involvement] : []} onToggle={setInvolvement} />
      </ThesisField>

      <ThesisField label="Typical deal stage involvement">
        <ThesisPillRow options={DEAL_STAGES} selected={dealStages} onToggle={o => toggle(dealStages, setDealStages, o)} />
      </ThesisField>

      <ThesisField label="Type of transition support offered">
        <ThesisPillRow options={SUPPORT_TYPES} selected={support} onToggle={o => toggle(support, setSupport, o)} />
      </ThesisField>

      <ThesisField label="Open to working with an intermediary / advisor">
        <ThesisPillRow options={OPEN_TO_ADVISOR} selected={openToAdvisor ? [openToAdvisor] : []} onToggle={setOpenToAdvisor} />
      </ThesisField>

      <ThesisField label="Preferred buyer type">
        <ThesisPillRow options={BUYER_TYPES} selected={buyer ? [buyer] : []} onToggle={setBuyer} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
