import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Clock } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../../../theme';
import { RoleThesisEditSheet } from '../RoleThesisEditSheet';
import { ThesisPillRow } from '../ThesisPillRow';
import { ThesisDropdown } from '../ThesisDropdown';
import { ThesisBoolToggle } from '../ThesisBoolToggle';
import { ThesisField } from '../ThesisField';
import { updateLenderThesis, LenderThesis } from '../../../../api/roleThesis';

const INVOLVEMENT_STAGES = ['Pre-LOI (early conversations)', 'At LOI / Term sheet stage', 'In due diligence', 'Closing / Near close', 'Post-close / Add-on financing', 'Flexible / Any stage'];
const APPROVAL_TIMELINE_OPTIONS = ['1-2 weeks', '2-4 weeks', '4-6 weeks', '6-8 weeks', '8-12 weeks', '3-6 months', '6+ months'];
const DD_REQUIREMENTS = ['Financial Statements', 'Tax Returns (3yr)', 'Business Valuation', 'QoE Report', 'Environmental Review', 'Legal Review', 'Personal Financial Stmt', 'Business Plan'];

/** "Process & Execution" edit sheet — matches web's real `ProcessCard` (`LenderThesisTab.tsx`,
 * Card 4). "DD Level & Requirements" only renders once Due Diligence Required is answered `true` —
 * matches web exactly (`ddRequired === true` gate). */
export function ProcessExecutionSheet({
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
  const [whenInvolved, setWhenInvolved] = useState<string[]>([]);
  const [timeline, setTimeline] = useState('');
  const [ddRequired, setDdRequired] = useState<boolean | null>(null);
  const [ddReqs, setDdReqs] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setWhenInvolved(thesis.whenGetInvolved);
    setTimeline(thesis.typicalApprovalTimeline);
    setDdRequired(thesis.dueDiligenceRequired);
    setDdReqs(thesis.ddRequirements);
  }, [visible, thesis]);

  // Stable callback identity (functional `setState`) so `ThesisPillRow`'s memoization actually
  // takes effect — see its own doc comment for why.
  const toggleWhenInvolved = useCallback((option: string) => setWhenInvolved(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);
  const toggleDdReqs = useCallback((option: string) => setDdReqs(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option])), []);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    const patch: Partial<LenderThesis> = {
      whenGetInvolved: whenInvolved,
      typicalApprovalTimeline: timeline,
      dueDiligenceRequired: ddRequired,
      ddRequirements: ddReqs,
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
      icon={<Clock size={17} strokeWidth={1.6} />}
      iconBg={colors.chip}
      iconColor={colors.goldDark}
      title="Process & Execution"
      description="Timeline and due diligence approach"
      saving={saving}
      onSave={handleSave}
    >
      <ThesisField label="When do you typically get involved?">
        <ThesisPillRow options={INVOLVEMENT_STAGES} selected={whenInvolved} onToggle={toggleWhenInvolved} />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>Select all deal stages at which you will engage with a borrower</Text>
      </ThesisField>

      <ThesisField label="Typical approval timeline">
        <ThesisDropdown options={APPROVAL_TIMELINE_OPTIONS} value={timeline} onChange={setTimeline} placeholder="Select timeline" />
        <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>From complete application to approval</Text>
      </ThesisField>

      <ThesisField label="Due diligence required">
        <ThesisBoolToggle value={ddRequired} onChange={setDdRequired} />
      </ThesisField>

      {ddRequired === true && (
        <ThesisField label="DD level & requirements">
          <ThesisPillRow options={DD_REQUIREMENTS} selected={ddReqs} onToggle={toggleDdReqs} />
        </ThesisField>
      )}
    </RoleThesisEditSheet>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 10.5, marginTop: 6 },
});
