import React, { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisField } from '../ThesisField';
import { updateIntermediaryThesis, IntermediaryThesis } from '../../../../api/roleThesis';

const DEAL_TYPES = ['Fully off-market', 'Privately marketed', 'Structured process', 'Auction / Broadly marketed', 'Flexible / Open'];
const REASONS = ['Retirement / succession', 'Looking for a growth partner / Capital infusion', 'Strategic shift', 'Personal reasons', 'Exploring options', 'Other'];
const TRANSITIONS = ['Full exit / Clean handover', 'Majority sale', 'Minority investment', 'Strategic partnership', 'Stay on in an operating role post-sale', 'Management buyout (selling to existing team)', 'Flexible / Open to discussion'];
const TIMELINES = ['Within 6 months', '6–12 months', '1–2 years', '2+ years', 'Exploring / No firm timeline'];

/** "Deal flow & mandates" edit sheet — matches the mockup's Deal Flow & Mandates sheet layout
 * (decoded `profilelast_decoded_role.html:3227-3280`), but Reason for Transacting/Types of
 * Transition are built MULTI-select (`ThesisPillRow` with array toggling), not single-select like
 * the mockup's own demo — web's real `SellerThesisTab.tsx` (`TransactionDetailsCard`) implements
 * both as `MultiPills`, and functionality follows web where the two sources disagree. Persists
 * `transactionType`/`transactionReasons`/`openTo`/`targetTimeline` (`openTo` is web's real field
 * name for "Types of Transition" — a distinct field from `openToAdvisor`, the Engagement card's
 * "Open to Working with an Intermediary/Advisor"). No field carries a required asterisk in the
 * mockup, so Save has no client-side validation gate here (unlike the other 4 sheets). */
export function DealFlowSheet({
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
  const [dealType, setDealType] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);
  const [transitions, setTransitions] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDealType(thesis.transactionType);
    setReasons(thesis.transactionReasons);
    setTransitions(thesis.openTo);
    setTimeline(thesis.targetTimeline);
  }, [visible, thesis]);

  const toggle = (list: string[], setList: (v: string[]) => void, option: string) => {
    setList(list.includes(option) ? list.filter(o => o !== option) : [...list, option]);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<IntermediaryThesis> = {
      transactionType: dealType,
      transactionReasons: reasons,
      openTo: transitions,
      targetTimeline: timeline,
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
      icon={<BarChart2 size={16} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Deal flow & mandates"
      description="The types of deals and transitions you are considering"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="Type of deal flow">
        <ThesisPillRow options={DEAL_TYPES} selected={dealType ? [dealType] : []} onToggle={setDealType} />
      </ThesisField>

      <ThesisField label="Reason for transacting">
        <ThesisPillRow options={REASONS} selected={reasons} onToggle={o => toggle(reasons, setReasons, o)} />
      </ThesisField>

      <ThesisField label="Types of transition">
        <ThesisPillRow options={TRANSITIONS} selected={transitions} onToggle={o => toggle(transitions, setTransitions, o)} />
      </ThesisField>

      <ThesisField label="Target timeline">
        <ThesisPillRow options={TIMELINES} selected={timeline ? [timeline] : []} onToggle={setTimeline} />
      </ThesisField>
    </RoleThesisEditSheet>
  );
}
