import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, Target, BarChart2, FileText, Star, MessageCircle, Upload } from 'lucide-react-native';
import { useTheme } from '../../../../theme';
import type { AppStackParamList } from '../../../../navigation/types';
import type { Profile } from '../../../../types/directory';
import {
  fetchIntermediaryThesis,
  fetchIntermediaryThesisCompletion,
  fetchSimilarRoleProfiles,
  IntermediaryThesis,
  RoleThesisCompletion,
} from '../../../../api/roleThesis';
import type { RoleThesisTabHandle } from '../RoleThesisTabHandle';
import { RoleThesisCompleteness } from '../RoleThesisCompleteness';
import { RoleThesisSectionCard } from '../RoleThesisSectionCard';
import { SimilarProfilesRow } from '../SimilarProfilesRow';
import { RowsGrid, PillField, PillValue, PillGroup, ChipGroup, MoneyStatsBox, StatTile, formatMoneyRange, formatDealValue } from '../ThesisReadPrimitives';
import { SellerProfileSheet } from './SellerProfileSheet';
import { DealCoverageSheet } from './DealCoverageSheet';
import { DealFlowSheet } from './DealFlowSheet';
import { EngagementSheet } from './EngagementSheet';
import { TrackRecordSheet } from './TrackRecordSheet';

type SheetKey = 'seller' | 'coverage' | 'flow' | 'engagement' | 'track' | null;

/**
 * Intermediary role's Role Thesis tab — Phase 8, first role built (per explicit instruction: one
 * role at a time, verify on-device, then move to the next). Assembles the completeness card, the
 * 5 section cards (read-mode content shaped per the mockup's own per-section variety — rows /
 * chip-groups+money-stats+description / stats+doc+rows, decoded
 * `profilelast_decoded_role.html:2505-2616`), the "Interested in {name} as an intermediary?" CTA
 * banner, and the "Similar intermediaries" row — then owns which of the 5 edit sheets is open.
 *
 * Completion (top card + each section's Complete/Incomplete badge) is server-driven
 * (`fetchIntermediaryThesisCompletion`), refetched after every save — matching web's real
 * behavior, not the mockup's own client-computed demo status. A save also merges its patch into
 * local `thesis` state immediately so the read-mode card reflects the edit without waiting on a
 * full refetch, while completion catches up right behind it.
 */
export const IntermediaryThesisTab = forwardRef<RoleThesisTabHandle, { profile: Profile }>(function IntermediaryThesisTabImpl({ profile }, ref) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState<IntermediaryThesis | null>(null);
  const [completion, setCompletion] = useState<RoleThesisCompletion | null>(null);
  const [similar, setSimilar] = useState<Profile[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);

  useEffect(() => {
    Promise.all([fetchIntermediaryThesis(), fetchIntermediaryThesisCompletion()])
      .then(([t, c]) => {
        setThesis(t);
        setCompletion(c);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // `thesis.profileId` (from the `/auth/seller` response's own `profile_id`), NOT
    // `profile.id` (the outer View Profile screen's Directory-style id) — see `IntermediaryThesis`
    // type's own doc comment on why these are two different ids.
    const profileId = thesis?.profileId;
    if (!profileId) {
      setLoadingSimilar(false);
      return;
    }
    setLoadingSimilar(true);
    // Forwards `profile.role_type` verbatim — matches web's real `fetchSimilarProfiles(profileId,
    // profile.role_type)` call exactly. A hardcoded lowercase `'intermediary'` literal here was
    // wrong: this app's own `role_type` values are Title-Case elsewhere (`ROLE_TYPES`/
    // `SUB_CATEGORIES`, `types/directory.ts`), and if the backend's `?role=` filter is
    // case-sensitive, a lowercase mismatch would silently return zero results.
    fetchSimilarRoleProfiles(profileId, profile.role_type ?? 'Intermediary')
      .then(setSimilar)
      .finally(() => setLoadingSimilar(false));
  }, [thesis?.profileId, profile.role_type]);

  const refreshCompletion = () => {
    fetchIntermediaryThesisCompletion().then(setCompletion);
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      const [t, c] = await Promise.all([fetchIntermediaryThesis(), fetchIntermediaryThesisCompletion()]);
      setThesis(t);
      setCompletion(c);
      if (t.profileId) {
        setSimilar(await fetchSimilarRoleProfiles(t.profileId, profile.role_type ?? 'Intermediary'));
      }
    },
  }), [profile.role_type]);

  const handleSaved = (patch: Partial<IntermediaryThesis>) => {
    setThesis(prev => (prev ? { ...prev, ...patch } : prev));
    refreshCompletion();
  };

  /** Matches web's real "Send message" button exactly (`thesis-shared.tsx:512/534`) — plain
   * navigation to the Messages tab, `onClick={() => router.push('/dashboard/messages')}`. NOT a
   * "start a conversation with this profile" flow — this CTA lives on View Profile, the SIGNED-IN
   * user's own profile, so "this profile" is always the viewer themselves; an earlier pass built
   * it as a `startConversation` call anyway (copying Directory's genuinely different "message
   * another member" pattern, and going beyond even the mockup's own `vpToastMessage` stub for this
   * button), which silently failed messaging yourself with no visible error (matching web's own
   * lack of error UI for that mutation) — confirmed via the same bug surfacing on Searcher's
   * identical CTA, fixed there first. */
  const handleMessage = () => {
    navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'Messages' } });
  };

  const handleViewSimilar = (p: Profile) => {
    navigation.navigate('MemberProfile', { profile: p, initialSaved: false });
  };

  if (loading || !thesis) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.ink3} />
      </View>
    );
  }

  const sectionAt = (i: number) => completion?.sections[i];
  const isComplete = (i: number, fallback: boolean) => sectionAt(i)?.complete ?? fallback;
  const completionSections = (completion?.sections.length ? completion.sections : [
    { label: 'Seller profile', complete: false, percentage: 0 },
    { label: 'Deal coverage & fit', complete: false, percentage: 0 },
    { label: 'Deal flow & mandates', complete: false, percentage: 0 },
    { label: 'Engagement & execution', complete: false, percentage: 0 },
    { label: 'Track record & credibility', complete: false, percentage: 0 },
  ]).map((s, i) => ({ label: s.label, complete: isComplete(i, false) }));
  const doneCount = completionSections.filter(s => s.complete).length;

  return (
    <View style={styles.container}>
      <RoleThesisCompleteness
        percentage={completion?.percentage ?? Math.round((doneCount / completionSections.length) * 100)}
        doneCount={doneCount}
        totalCount={completionSections.length}
        sections={completionSections}
      />

      <RoleThesisSectionCard
        label="Seller profile"
        icon={<User size={17} strokeWidth={1.6} />}
        title="Seller profile"
        description="Who you are and your role in the transaction"
        complete={isComplete(0, !!(thesis.organizationName && thesis.businessStructure && thesis.sellerRole))}
        onEdit={() => setOpenSheet('seller')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <RowsGrid
          rows={[
            { label: 'Organization', value: thesis.organizationName || '—' },
            { label: 'Years in business', value: thesis.yearsInOperation || 'Not set' },
            { label: 'Organisation structure', value: thesis.businessStructure || 'Not set' },
            { label: 'Ownership stake', value: thesis.ownershipStake || 'Not set' },
            { label: 'Your role in the transaction', value: thesis.sellerRole || '—', full: true },
          ]}
        />
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Deal coverage & fit"
        icon={<Target size={17} strokeWidth={1.6} />}
        title="Deal coverage & fit"
        description="Industries, geographies and deal parameters"
        complete={isComplete(1, thesis.businessIndustries.length > 0 && thesis.businessLocation.length > 0)}
        onEdit={() => setOpenSheet('coverage')}
      >
        <View style={styles.chipGroupsWrap}>
          <ChipGroup label="Industry focus" items={thesis.businessIndustries} tone="ok" />
          <ChipGroup label="Geography focus" items={thesis.businessLocation} tone="blue" />
          {thesis.avoidedIndustries.length > 0 && (
            <ChipGroup label="Avoided industries" items={thesis.avoidedIndustries} tone="danger" />
          )}
        </View>
        <MoneyStatsBox
          stats={[
            { label: 'Business preferred revenue', sub: 'Annual revenue, USD', value: formatMoneyRange(thesis.annualRevenueMin, thesis.annualRevenueMax) ?? 'Not set' },
            { label: 'Business preferred EBITDA', sub: 'Normalised EBITDA, USD', value: formatMoneyRange(thesis.annualEbitdaMin, thesis.annualEbitdaMax) ?? 'Not set' },
            { label: 'Typical deal size', sub: 'Enterprise value, USD', value: formatMoneyRange(thesis.askingPriceMin, thesis.askingPriceMax) ?? 'Not set' },
          ]}
        />
        <View style={styles.descriptionBlock}>
          <Text style={[fonts.bold, styles.descriptionLabel, { color: colors.ink3 }]}>Business description</Text>
          <Text style={[fonts.regular, styles.descriptionText, { color: colors.ink2 }]}>
            {thesis.businessOverview.trim() || 'No business description added yet.'}
          </Text>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Deal flow & mandates"
        icon={<BarChart2 size={16} strokeWidth={1.6} />}
        title="Deal flow & mandates"
        description="The types of deals and transitions you are considering"
        complete={isComplete(2, thesis.transactionReasons.length > 0 && thesis.openTo.length > 0)}
        onEdit={() => setOpenSheet('flow')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.pillFieldsWrap}>
          <PillField label="Type of deal flow">
            <PillValue value={thesis.transactionType} bg={colors.hero1} color="#fff" />
          </PillField>
          <PillField label="Reason for transacting">
            <PillGroup items={thesis.transactionReasons} bg={colors.goldExtraLight} color="#7A5200" />
          </PillField>
          <PillField label="Types of transition">
            <PillGroup items={thesis.openTo} bg="#EAF3DE" color="#27500A" />
          </PillField>
          <PillField label="Target timeline">
            <PillValue value={thesis.targetTimeline} bg="#D0DBE5" color={colors.ink} />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Engagement & execution"
        icon={<FileText size={16} strokeWidth={1.6} />}
        title="Engagement & execution"
        description="How you work with buyers, advisors and deal stages"
        complete={isComplete(3, !!(thesis.operationalInvolvement && thesis.preferredBuyer))}
        onEdit={() => setOpenSheet('engagement')}
      >
        <View style={styles.pillFieldsWrap}>
          <PillField label="Post-sale involvement">
            <PillValue value={thesis.operationalInvolvement} bg={colors.goldExtraLight} color="#7A5200" />
          </PillField>
          <View style={styles.pillFieldsRow}>
            <View style={styles.pillFieldsCol}>
              <PillField label="Deal stage involvement">
                <PillGroup items={thesis.dealStageInvolvement} bg="#EAF3DE" color="#27500A" emptyStyle="pill" />
              </PillField>
            </View>
            <View style={styles.pillFieldsCol}>
              <PillField label="Transition support offered">
                <PillGroup items={thesis.transitionSupportTypes} bg="#D0DBE5" color={colors.ink} emptyStyle="pill" />
              </PillField>
            </View>
          </View>
          <View style={styles.pillFieldsRow}>
            <View style={styles.pillFieldsCol}>
              <PillField label="Open to advisor / intermediary">
                <PillValue value={thesis.openToAdvisor} bg={colors.hero1} color="#fff" />
              </PillField>
            </View>
            <View style={styles.pillFieldsCol}>
              <PillField label="Preferred buyer">
                <PillValue value={thesis.preferredBuyer} bg={colors.hero1} color="#fff" emptyStyle="pill" />
              </PillField>
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Track record & credibility"
        icon={<Star size={16} strokeWidth={1.6} />}
        title="Track record & credibility"
        description="Your deal history and credentials"
        complete={isComplete(4, !!(thesis.dealsClosed || thesis.totalDealValue))}
        onEdit={() => setOpenSheet('track')}
      >
        <View style={styles.statsRow}>
          <StatTile value={thesis.dealsClosed || '—'} label="Deals closed" />
          <StatTile value={thesis.totalDealValue ? formatDealValue(thesis.totalDealValue) : '—'} label="Total deal value facilitated" />
        </View>
        {thesis.cimUrl ? (
          <View style={[styles.docRow, { backgroundColor: colors.authField, borderColor: colors.homeCardBorder }]}>
            <View style={[styles.docIconBox, { backgroundColor: colors.chip }]}>
              <FileText size={15} color={colors.goldDark} strokeWidth={1.6} />
            </View>
            <View style={styles.docText}>
              <Text style={[fonts.bold, styles.docTitle, { color: colors.ink }]} numberOfLines={1}>CIM / Credentials & Firm Profile</Text>
              <Text style={[fonts.regular, styles.docSub, { color: colors.success }]}>Uploaded</Text>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={() => setOpenSheet('track')}
            style={[styles.docEmptyBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}
          >
            <Upload size={19} color={colors.ink3} strokeWidth={1.6} />
            <Text style={[fonts.bold, styles.docEmptyTitle, { color: colors.ink }]}>CIM / Credentials & Firm Profile</Text>
            <Text style={[fonts.regular, styles.docEmptySub, { color: colors.ink3 }]}>No document uploaded yet</Text>
            <Text style={[fonts.bold, styles.docEmptyCta, { color: colors.goldDark }]}>Tap to upload</Text>
          </Pressable>
        )}
        <RowsGrid
          rows={[
            { label: 'Differentiation & value add', value: thesis.differentiationTags.join(', ') || '—', full: true },
            { label: 'About / written pitch', value: thesis.differentiationBio.trim() || '—', full: true },
          ]}
        />
      </RoleThesisSectionCard>

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Interested in {profile.name.split(' ')[0]} as an intermediary?</Text>
        <Text style={styles.ctaBody}>
          Their <Text style={{ color: colors.goldLight }}>deal focus</Text>, <Text style={{ color: colors.goldLight }}>transaction experience</Text> and{' '}
          <Text style={{ color: colors.goldLight }}>network fit</Text> are all strong signals. Connect to request their resume and discuss fit.
        </Text>
        <Pressable onPress={handleMessage} style={styles.ctaButton}>
          <MessageCircle size={14} color="#fff" strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Send message</Text>
        </Pressable>
      </View>

      <SimilarProfilesRow heading="Similar intermediaries you may know" profiles={similar} loading={loadingSimilar} onViewProfile={handleViewSimilar} />

      <SellerProfileSheet visible={openSheet === 'seller'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <DealCoverageSheet visible={openSheet === 'coverage'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <DealFlowSheet visible={openSheet === 'flow'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <EngagementSheet visible={openSheet === 'engagement'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <TrackRecordSheet visible={openSheet === 'track'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 18 },
  loading: { paddingVertical: 60, alignItems: 'center' },
  chipGroupsWrap: { paddingHorizontal: 14, paddingTop: 2, gap: 12 },
  pillFieldsWrap: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14, gap: 14 },
  pillFieldsRow: { flexDirection: 'row', gap: 16 },
  pillFieldsCol: { flex: 1, minWidth: 0 },
  descriptionBlock: { marginTop: 12, paddingHorizontal: 14, paddingBottom: 14 },
  descriptionLabel: { fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase' },
  descriptionText: { fontSize: 12, marginTop: 5, lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: 9, paddingHorizontal: 14, paddingTop: 10 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 14, marginTop: 10, padding: 12, borderWidth: 1, borderRadius: 12 },
  docIconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  docText: { flex: 1, minWidth: 0 },
  docTitle: { fontSize: 12 },
  docSub: { fontSize: 10.5, marginTop: 1 },
  docEmptyBox: { alignItems: 'center', gap: 6, marginHorizontal: 14, marginTop: 10, paddingVertical: 22, paddingHorizontal: 14, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 13 },
  docEmptyTitle: { fontSize: 12.5, textAlign: 'center' },
  docEmptySub: { fontSize: 11, textAlign: 'center' },
  docEmptyCta: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 2 },
  ctaCard: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center' },
  ctaTitle: { fontSize: 17, lineHeight: 22, color: '#fff', textAlign: 'center' },
  ctaBody: { fontSize: 11.5, lineHeight: 18, color: 'rgba(255,255,255,0.62)', marginTop: 7, textAlign: 'center' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 20, marginTop: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)' },
  ctaButtonText: { fontSize: 13, color: '#fff' },
});
