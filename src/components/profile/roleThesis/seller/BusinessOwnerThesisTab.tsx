import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Star, BarChart2, AlignLeft, Plus, TrendingUp, FileText, MessageCircle, Download } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { useTheme } from '../../../../theme';
import type { AppStackParamList } from '../../../../navigation/types';
import type { Profile } from '../../../../types/directory';
import {
  fetchBusinessOwnerThesis,
  fetchSimilarRoleProfiles,
  calcBusinessOwnerThesisCompletion,
  BusinessOwnerThesis,
} from '../../../../api/roleThesis';
import type { RoleThesisTabHandle } from '../RoleThesisTabHandle';
import { RoleThesisCompleteness } from '../RoleThesisCompleteness';
import { RoleThesisSectionCard } from '../RoleThesisSectionCard';
import { SimilarProfilesRow } from '../SimilarProfilesRow';
import { PillField } from '../ThesisReadPrimitives';
import { PrivacyNote } from './PrivacyNote';
import { TransactionIntentSheet } from './TransactionIntentSheet';
import { BusinessSnapshotSheet } from './BusinessSnapshotSheet';
import { DealOverviewSheet } from './DealOverviewSheet';
import { OperationsTransitionSheet } from './OperationsTransitionSheet';
import { GrowthRisksSheet } from './GrowthRisksSheet';
import { SupportingMaterialsSheet } from './SupportingMaterialsSheet';

type SheetKey = 'intent' | 'snapshot' | 'deal' | 'operations' | 'growth' | 'materials' | null;

/**
 * Business Owner role's Role Thesis tab (`role_type === 'seller'`) — seventh role built, Student
 * the only one left. Genuinely different data source from every other role: web's confirmed
 * filename/import-swap bug means this role actually renders the file literally named
 * `IntermediaryThesisTab.tsx` and persists through `/auth/intermediary` — see
 * `BusinessOwnerThesis`'s own doc comment (`api/roleThesis.ts`) for the full story, confirmed with
 * the user directly ("we needs to do same as Web app"). Also the only role with NO server
 * completion endpoint — `calcBusinessOwnerThesisCompletion` is a pure function computed from
 * `thesis` on every render, matching web's own local `calcCompletion`, not a fetch.
 */
export const BusinessOwnerThesisTab = forwardRef<RoleThesisTabHandle, { profile: Profile }>(function BusinessOwnerThesisTabImpl({ profile }, ref) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState<BusinessOwnerThesis | null>(null);
  const [similar, setSimilar] = useState<Profile[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);

  useEffect(() => {
    fetchBusinessOwnerThesis()
      .then(setThesis)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const profileId = thesis?.profileId;
    if (!profileId) {
      setLoadingSimilar(false);
      return;
    }
    setLoadingSimilar(true);
    fetchSimilarRoleProfiles(profileId, profile.role_type ?? 'Business Owner')
      .then(setSimilar)
      .finally(() => setLoadingSimilar(false));
  }, [thesis?.profileId, profile.role_type]);

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      const t = await fetchBusinessOwnerThesis();
      setThesis(t);
      if (t.profileId) {
        setSimilar(await fetchSimilarRoleProfiles(t.profileId, profile.role_type ?? 'Business Owner'));
      }
    },
  }), [profile.role_type]);

  const handleSaved = (patch: Partial<BusinessOwnerThesis>) => {
    setThesis(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handleMessage = () => {
    navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'Messages' } });
  };

  const handleViewSimilar = (p: Profile) => {
    navigation.navigate('MemberProfile', { profile: p, initialSaved: false });
  };

  /** Real save-to-device — same implementation as every other role's identical Download button. */
  const handleDownloadDoc = async (url: string) => {
    const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'document');
    try {
      if (Platform.OS === 'android') {
        await ReactNativeBlobUtil.config({
          fileCache: true,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: fileName,
            description: 'Downloading document',
            path: `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`,
          },
        }).fetch('GET', url);
      } else {
        const res = await ReactNativeBlobUtil.config({ fileCache: true }).fetch('GET', url);
        await ReactNativeBlobUtil.ios.previewDocument(res.path());
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Download failed', text2: 'Please try again.' });
    }
  };

  const completion = useMemo(() => (thesis ? calcBusinessOwnerThesisCompletion(thesis) : null), [thesis]);

  if (loading || !thesis || !completion) {
    return <BusinessOwnerThesisSkeleton />;
  }

  const intentComplete = !!(thesis.reasonForTransaction || thesis.currentSituation || thesis.typesOfTransitionOpenTo.length || thesis.targetTimeline);
  const snapshotComplete = !!(thesis.businessIndustry || thesis.businessLocation || thesis.yearsInOperation || thesis.businessRevenueMin);
  const dealComplete = !!(thesis.valuationMin || thesis.valuationMax || thesis.ownershipStake || thesis.preferredBuyerType.length || thesis.operatorInvolvement);
  const operationsComplete = !!(thesis.currentRole || thesis.dayToDayInvolvement || thesis.managementTeam || thesis.advisorSupport || thesis.postTransactionInvolvement);
  const growthComplete = !!(thesis.keyGrowthOpportunities || thesis.currentConstraintsChallenges);
  const materialsComplete = !!thesis.cimDocumentUrl;

  const topBarSections = completion.sections.map(s => ({ label: s.label, complete: s.complete }));
  const doneCount = topBarSections.filter(s => s.complete).length;

  return (
    <View style={styles.container}>
      <RoleThesisCompleteness
        percentage={completion.percentage}
        doneCount={doneCount}
        totalCount={topBarSections.length}
        sections={topBarSections}
      />

      <RoleThesisSectionCard
        label="Transaction Intent & Context"
        icon={<Star size={17} strokeWidth={1.6} />}
        title="Transaction intent & context"
        description="Why you are looking to transact and what you are open to"
        complete={intentComplete}
        onEdit={() => setOpenSheet('intent')}
        ctaHelperText="Help buyers understand your intent and timeline"
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Reason for Transaction">
                {thesis.reasonForTransaction ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.reasonForTransaction}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Current Situation">
                {thesis.currentSituation ? (
                  <StatusPill label={thesis.currentSituation} />
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
          </View>

          <PillField label="Types of Transition Open To">
            {thesis.typesOfTransitionOpenTo.length > 0 ? (
              <View style={localStyles.pillRow}>
                {thesis.typesOfTransitionOpenTo.map(t => <GoldPill key={t} label={t} />)}
              </View>
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
            )}
          </PillField>

          <PillField label="Target Timeline">
            {thesis.targetTimeline ? (
              <TimelineBar options={TARGET_TIMELINE_OPTIONS} selected={thesis.targetTimeline} />
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
            )}
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Business Snapshot"
        icon={<BarChart2 size={17} strokeWidth={1.6} />}
        title="Business snapshot"
        description="High-level overview of your business — kept confidential"
        complete={snapshotComplete}
        onEdit={() => setOpenSheet('snapshot')}
        ctaHelperText="Help buyers understand your business at a high level"
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Industry">
                {thesis.businessIndustry ? (
                  <IndustryPill label={thesis.businessIndustry} />
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Business Model">
                {thesis.businessModel ? (
                  <ModelPill label={thesis.businessModel} />
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
          </View>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Location">
                {thesis.businessLocation ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.businessLocation}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Years in Operation">
                {thesis.yearsInOperation ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.yearsInOperation}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
          </View>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <MetricBox label="REVENUE RANGE" minVal={thesis.businessRevenueMin} maxVal={thesis.businessRevenueMax} note="annual revenue" />
            </View>
            <View style={styles.fieldsCol}>
              <MetricBox label="EBITDA RANGE" minVal={thesis.businessEbitdaMin} maxVal={thesis.businessEbitdaMax} note="normalised" />
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Deal Overview"
        icon={<AlignLeft size={17} strokeWidth={1.6} />}
        title="Deal overview"
        description="What you are looking for from a transaction"
        complete={dealComplete}
        onEdit={() => setOpenSheet('deal')}
        ctaHelperText="Share what you need from a buyer or investor"
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <MetricBox label="VALUATION EXPECTATION" minVal={thesis.valuationMin} maxVal={thesis.valuationMax} note="enterprise value" />
            </View>
            <View style={styles.fieldsCol}>
              <SingleMetricBox
                label="OWNERSHIP STAKE"
                value={thesis.ownershipStake}
                note={OWNERSHIP_NOTES[thesis.ownershipStake] || 'ownership preference'}
              />
            </View>
          </View>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Preferred Buyer Type">
                {thesis.preferredBuyerType.length > 0 ? (
                  <View style={localStyles.pillRow}>
                    {thesis.preferredBuyerType.map(b => <GoldPill key={b} label={b} />)}
                  </View>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Operator Involvement">
                {thesis.operatorInvolvement ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.operatorInvolvement}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Operations & Transition"
        icon={<Plus size={17} strokeWidth={1.6} />}
        title="Operations & transition"
        description="Current role and post-transaction plans"
        complete={operationsComplete}
        onEdit={() => setOpenSheet('operations')}
        ctaHelperText="Buyers need to understand your role and transition plan"
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Current Role">
                {thesis.currentRole ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.currentRole}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Day-to-Day Involvement">
                {thesis.dayToDayInvolvement ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.dayToDayInvolvement}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
          </View>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Management Team">
                {thesis.managementTeam ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.managementTeam}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Advisor Support">
                {thesis.advisorSupport ? (
                  <GreenStatusPill label={thesis.advisorSupport} />
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
          </View>

          <PillField label="Post-Transaction Involvement">
            {thesis.postTransactionInvolvement ? (
              <OutlinePill label={thesis.postTransactionInvolvement} />
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
            )}
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Growth & Risks"
        icon={<TrendingUp size={17} strokeWidth={1.6} />}
        title="Growth & risks"
        description="Opportunities and challenges for the business"
        complete={growthComplete}
        onEdit={() => setOpenSheet('growth')}
        ctaHelperText="Candid growth & risk info builds trust with matched buyers"
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <PillField label="Key Growth Opportunities">
            {thesis.keyGrowthOpportunities ? (
              <QuoteBox text={thesis.keyGrowthOpportunities} variant="amber" />
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
            )}
          </PillField>

          <PillField label="Current Constraints / Challenges">
            {thesis.currentConstraintsChallenges ? (
              <QuoteBox text={thesis.currentConstraintsChallenges} variant="red" />
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
            )}
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Supporting Materials"
        icon={<FileText size={17} strokeWidth={1.6} />}
        title="Supporting materials"
        description="CIM and documents for matched buyers"
        complete={materialsComplete}
        onEdit={() => setOpenSheet('materials')}
        ctaHelperText="Share your CIM or teaser to attract matched buyers"
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          {thesis.cimDocumentUrl ? (
            <View>
              <CimDocCard url={thesis.cimDocumentUrl} onDownload={() => handleDownloadDoc(thesis.cimDocumentUrl)} />
              <PrivacyNote>This document is gated — only buyers you approve and who have signed NDA can download it</PrivacyNote>
            </View>
          ) : (
            <PillField label="CIM / Teaser Document">
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not uploaded</Text>
            </PillField>
          )}
        </View>
      </RoleThesisSectionCard>

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Interested in {profile.name.split(' ')[0]}&rsquo;s business?</Text>
        <Text style={styles.ctaBody}>
          Their <Text style={{ color: colors.goldLight }}>transaction intent</Text>, <Text style={{ color: colors.goldLight }}>business snapshot</Text>,{' '}
          <Text style={{ color: colors.goldLight }}>deal fit</Text> are all strong signals. Connect to request their CIM and discuss fit.
        </Text>
        <Pressable onPress={handleMessage} style={styles.ctaButton}>
          <MessageCircle size={14} color="#fff" strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Send message</Text>
        </Pressable>
      </View>

      <SimilarProfilesRow heading="Similar business owners you may know" profiles={similar} loading={loadingSimilar} onViewProfile={handleViewSimilar} />

      <TransactionIntentSheet visible={openSheet === 'intent'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <BusinessSnapshotSheet visible={openSheet === 'snapshot'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <DealOverviewSheet visible={openSheet === 'deal'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <OperationsTransitionSheet visible={openSheet === 'operations'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <GrowthRisksSheet visible={openSheet === 'growth'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <SupportingMaterialsSheet visible={openSheet === 'materials'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
    </View>
  );
});

const TARGET_TIMELINE_OPTIONS = ['0–6 months', '6–12 months', '1–2 years', '2+ years', 'Open / Exploring'];

const OWNERSHIP_NOTES: Record<string, string> = {
  '100%': 'full exit preferred',
  'Majority >50%': 'majority stake',
  'Minority <50%': 'minority stake',
  Flexible: 'open to structure',
};

const TIMELINE_LABELS: Record<string, string> = {
  '0–6 months': '3 mo',
  '6–12 months': '6–12 mo',
  '1–2 years': '12–24 mo',
  '2+ years': '2+ yrs',
  'Open / Exploring': 'Open',
};

/** Matches web's real `formatMoney` (`IntermediaryThesisTab.tsx:314-326`) exactly — genuinely
 * diverges from the shared `formatMoney` in `ThesisReadPrimitives.tsx` (which always rounds to a
 * whole number): this one keeps one decimal place when the value isn't a clean whole M/K, matching
 * web's own `m % 1 === 0 ? m : m.toFixed(1)` logic. */
function fmtMoney(raw: string): string {
  const num = Number(raw.replace(/,/g, ''));
  if (!raw || Number.isNaN(num)) return raw;
  if (num >= 1_000_000) {
    const m = num / 1_000_000;
    return `$${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  if (num >= 1_000) {
    const k = num / 1_000;
    return `$${k % 1 === 0 ? k : k.toFixed(1)}K`;
  }
  return `$${num}`;
}

/** Gold pill — matches web's real `GoldPill` (lines 222-224). */
function GoldPill({ label }: { label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.pill, { backgroundColor: colors.goldExtraLight }]}>
      <Text style={[fonts.medium, localStyles.pillText, { color: '#7A5200' }]}>{label}</Text>
    </View>
  );
}

/** Gold pill with a leading gold dot — matches web's real `StatusPill` (lines 239-246). */
function StatusPill({ label }: { label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.pill, localStyles.dotPill, { backgroundColor: colors.goldExtraLight }]}>
      <View style={[localStyles.dot, { backgroundColor: colors.gold }]} />
      <Text style={[fonts.medium, localStyles.pillText, { color: '#7A5200' }]}>{label}</Text>
    </View>
  );
}

/** Green pill with a leading green dot — matches web's real `GreenStatusPill` (lines 226-233). */
function GreenStatusPill({ label }: { label: string }) {
  const { fonts } = useTheme();
  return (
    <View style={[localStyles.pill, localStyles.dotPill, { backgroundColor: '#DCF5E3' }]}>
      <View style={[localStyles.dot, { backgroundColor: '#22C55E' }]} />
      <Text style={[fonts.medium, localStyles.pillText, { color: '#2A6B44' }]}>{label}</Text>
    </View>
  );
}

/** Outlined pill — matches web's real `OutlinePill` (lines 235-237). */
function OutlinePill({ label }: { label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.pill, { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#C8D0D8' }]}>
      <Text style={[fonts.medium, localStyles.pillText, { color: colors.ink2 }]}>{label}</Text>
    </View>
  );
}

/** Green plain pill — matches web's real `IndustryPill` (lines 298-304). */
function IndustryPill({ label }: { label: string }) {
  const { fonts } = useTheme();
  return (
    <View style={[localStyles.pill, { backgroundColor: '#DCF5E3', alignSelf: 'flex-start' }]}>
      <Text style={[fonts.medium, localStyles.pillText, { color: '#2A6B44' }]}>{label}</Text>
    </View>
  );
}

/** Blue-gray plain pill — matches web's real `ModelPill` (lines 306-312). */
function ModelPill({ label }: { label: string }) {
  const { fonts } = useTheme();
  return (
    <View style={[localStyles.pill, { backgroundColor: '#E3EBF3', alignSelf: 'flex-start' }]}>
      <Text style={[fonts.medium, localStyles.pillText, { color: '#3A5570' }]}>{label}</Text>
    </View>
  );
}

/** Money-range stat card — matches web's real `MetricBox` (lines 328-344): sunken bg, bordered,
 * uppercase label, big bold value + note when filled, "Not specified" when both ends are empty. */
function MetricBox({ label, minVal, maxVal, note }: { label: string; minVal: string; maxVal: string; note: string }) {
  const { colors, fonts } = useTheme();
  const hasValue = !!(minVal || maxVal);
  return (
    <View style={[localStyles.metricBox, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
      <Text style={[fonts.bold, localStyles.metricLabel, { color: colors.ink2 }]}>{label}</Text>
      {hasValue ? (
        <>
          <Text style={[fonts.display, localStyles.metricValue, { color: colors.ink }]}>
            {minVal ? fmtMoney(minVal) : '—'} – {maxVal ? fmtMoney(maxVal) : '—'}
          </Text>
          <Text style={[fonts.regular, localStyles.metricNote, { color: colors.ink3 }]}>{note}</Text>
        </>
      ) : (
        <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
      )}
    </View>
  );
}

/** Same shell as `MetricBox` but for a single pre-formatted value — matches web's real
 * `SingleMetricBox` (lines 353-365), used only for Ownership Stake. */
function SingleMetricBox({ label, value, note }: { label: string; value: string; note: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.metricBox, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
      <Text style={[fonts.bold, localStyles.metricLabel, { color: colors.ink2 }]}>{label}</Text>
      {value ? (
        <>
          <Text style={[fonts.display, localStyles.metricValue, { color: colors.ink }]}>{value}</Text>
          <Text style={[fonts.regular, localStyles.metricNote, { color: colors.ink3 }]}>{note}</Text>
        </>
      ) : (
        <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
      )}
    </View>
  );
}

/** Left-bordered quote block — matches web's real `QuoteBox` (lines 367-376), two color variants. */
function QuoteBox({ text, variant }: { text: string; variant: 'amber' | 'red' }) {
  const { colors, fonts } = useTheme();
  const tone =
    variant === 'amber'
      ? { bg: colors.goldExtraLight, border: colors.border, accent: colors.gold }
      : { bg: '#FFF8F8', border: '#FAD4D4', accent: '#DC2626' };
  return (
    <View style={[localStyles.quoteBox, { backgroundColor: tone.bg, borderColor: tone.border, borderLeftColor: tone.accent }]}>
      <Text style={[fonts.regular, localStyles.quoteText, { color: colors.ink }]}>&ldquo;{text}&rdquo;</Text>
    </View>
  );
}

/** Horizontal progress-dot timeline — matches web's real `TimelineBar` (lines 248-296): a base
 * line the full width, a gold segment overlaid from the start up to the selected option (via
 * percentage width, same math as web's own right-anchored overlay), a dot per option (18px/`ink`
 * when selected, 8px/`gold` for options before it, 8px/`border` after), and a label row below each
 * dot using web's exact short-label lookup. Dot/label positions rely on `justifyContent:
 * space-between` across evenly-sized items rather than absolute pixel math — RN has no cheap way to
 * measure the gold overlay's real end position against arbitrary label text, but for this component
 * the dots are small relative to typical row width so the visual difference from web's exact CSS
 * fractions is negligible. */
function TimelineBar({ options, selected }: { options: string[]; selected: string }) {
  const { colors, fonts } = useTheme();
  const selectedIndex = options.indexOf(selected);
  const count = options.length;
  const fillPct = selectedIndex > 0 ? (selectedIndex / (count - 1)) * 100 : 0;

  return (
    <View style={localStyles.timelineWrap}>
      <View style={localStyles.timelineTrack}>
        <View style={[localStyles.timelineLine, { backgroundColor: colors.border }]} />
        {fillPct > 0 && <View style={[localStyles.timelineFill, { width: `${fillPct}%`, backgroundColor: colors.gold }]} />}
        <View style={localStyles.timelineDotsRow}>
          {options.map((opt, i) => {
            const isSelected = opt === selected;
            const isBefore = selectedIndex >= 0 && i < selectedIndex;
            const size = isSelected ? 18 : 8;
            const dotColor = isSelected ? colors.ink : isBefore ? colors.gold : colors.border;
            return <View key={opt} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: dotColor }} />;
          })}
        </View>
      </View>
      <View style={localStyles.timelineLabelsRow}>
        {options.map((opt, i) => {
          const isSelected = opt === selected;
          const align = i === 0 ? 'left' : i === count - 1 ? 'right' : 'center';
          return (
            <Text
              key={opt}
              style={[
                isSelected ? fonts.semibold : fonts.regular,
                localStyles.timelineLabel,
                { color: isSelected ? colors.ink : colors.ink3, textAlign: align },
              ]}
            >
              {TIMELINE_LABELS[opt] || opt}
            </Text>
          );
        })}
      </View>
    </View>
  );
}

/** Uploaded-CIM card — matches web's real gold document row (`IntermediaryThesisTab.tsx:1009-1024`):
 * gold-tinted card, an icon box using `colors.ink` (web's `--tsb-ink`, NOT the accent-solid navy
 * every other role's doc card uses — a genuine, deliberate difference confirmed from web's own
 * source), filename + "PDF · NDA-gated" subtitle, and a ROUND gold download button (web's own
 * button here is `rounded-full`, unlike the plain icon buttons elsewhere in this app). */
function CimDocCard({ url, onDownload }: { url: string; onDownload: () => void }) {
  const { colors, fonts } = useTheme();
  const filename = (() => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1].split('?')[0]) || 'CIM Document';
    } catch {
      return 'CIM Document';
    }
  })();

  return (
    <View>
      <Text style={[fonts.bold, localStyles.docCardLabel, { color: colors.ink3 }]}>CIM / TEASER DOCUMENT</Text>
      <View style={[localStyles.docCard, { backgroundColor: colors.goldExtraLight, borderColor: colors.border }]}>
        <View style={[localStyles.docCardIconBox, { backgroundColor: colors.ink }]}>
          <FileText size={15} color="#fff" strokeWidth={1.6} />
        </View>
        <View style={localStyles.docCardText}>
          <Text style={[fonts.semibold, localStyles.docCardFilename, { color: colors.ink }]} numberOfLines={1}>{filename}</Text>
          <Text style={[fonts.regular, localStyles.docCardSub, { color: colors.ink3 }]}>PDF · NDA-gated</Text>
        </View>
        <Pressable onPress={onDownload} style={[localStyles.docCardRoundButton, { backgroundColor: colors.goldExtraLight }]}>
          <Download size={16} color={colors.gold} strokeWidth={1.6} />
        </Pressable>
      </View>
    </View>
  );
}

/** Same opacity-pulse shimmer as every other Role Thesis skeleton. */
function Shimmer({ width, height, radius = 6 }: { width: number | `${number}%`; height: number; radius?: number }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: colors.surfaceSunken }, { opacity }]} />;
}

function BusinessOwnerThesisSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={[skeletonStyles.completeness, { backgroundColor: colors.surface, borderColor: colors.authFieldBorder }]}>
        <Shimmer width="55%" height={13} />
        <View style={skeletonStyles.completenessBar}>
          <Shimmer width="100%" height={6} radius={3} />
        </View>
        <Shimmer width="40%" height={11} />
      </View>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <View key={i} style={[skeletonStyles.card, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder }]}>
          <View style={skeletonStyles.cardHeader}>
            <Shimmer width={36} height={36} radius={11} />
            <View style={skeletonStyles.cardHeaderText}>
              <Shimmer width="60%" height={13} />
              <View style={skeletonStyles.cardHeaderLine}>
                <Shimmer width="85%" height={11} />
              </View>
            </View>
          </View>
          <Shimmer width="100%" height={11} />
          <View style={skeletonStyles.cardLine}>
            <Shimmer width="70%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 18 },
  fieldsWrap: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14, gap: 14 },
  fieldsRow: { flexDirection: 'row', gap: 16 },
  fieldsCol: { flex: 1, minWidth: 0, gap: 14 },
  plainValue: { fontSize: 13 },
  ctaCard: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center' },
  ctaTitle: { fontSize: 17, lineHeight: 22, color: '#fff', textAlign: 'center' },
  ctaBody: { fontSize: 11.5, lineHeight: 18, color: 'rgba(255,255,255,0.62)', marginTop: 7, textAlign: 'center' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 20, marginTop: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)' },
  ctaButtonText: { fontSize: 13, color: '#fff' },
});

const localStyles = StyleSheet.create({
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' },
  dotPill: { gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: 12 },
  metricBox: { flex: 1, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  metricLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  metricValue: { fontSize: 20, lineHeight: 24 },
  metricNote: { fontSize: 11, marginTop: 4 },
  quoteBox: { borderRadius: 8, borderWidth: 1, borderLeftWidth: 3, padding: 16 },
  quoteText: { fontSize: 13, lineHeight: 22 },
  timelineWrap: { marginTop: 2 },
  timelineTrack: { height: 20, justifyContent: 'center' },
  timelineLine: { position: 'absolute', left: 0, right: 0, top: '50%', height: 2, marginTop: -1 },
  timelineFill: { position: 'absolute', left: 0, top: '50%', height: 2, marginTop: -1 },
  timelineDotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timelineLabel: { fontSize: 11, flexShrink: 1 },
  docCardLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  docCardIconBox: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docCardText: { flex: 1, minWidth: 0 },
  docCardFilename: { fontSize: 13 },
  docCardSub: { fontSize: 11, marginTop: 1 },
  docCardRoundButton: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});

const skeletonStyles = StyleSheet.create({
  completeness: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 9 },
  completenessBar: { marginTop: 2 },
  card: { borderRadius: 16, borderWidth: 1, padding: 13, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  cardHeaderText: { flex: 1, minWidth: 0, gap: 6 },
  cardHeaderLine: { marginTop: 1 },
  cardLine: { marginTop: 1 },
});
