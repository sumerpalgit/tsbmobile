import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import { Building2, FileText, CreditCard, Clock, TrendingUp, MessageCircle, ExternalLink, Download, Upload, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '../../../../theme';
import type { AppStackParamList } from '../../../../navigation/types';
import type { Profile } from '../../../../types/directory';
import {
  fetchLenderThesis,
  fetchLenderThesisCompletion,
  fetchSimilarRoleProfiles,
  LenderThesis,
  RoleThesisCompletion,
} from '../../../../api/roleThesis';
import { DocumentPreviewSheet } from '../DocumentPreviewSheet';
import { RoleThesisCompleteness } from '../RoleThesisCompleteness';
import { RoleThesisSectionCard } from '../RoleThesisSectionCard';
import { SimilarProfilesRow } from '../SimilarProfilesRow';
import { PillField, PillGroup, formatMoney, formatMoneyRange } from '../ThesisReadPrimitives';
import { FinancingOverviewSheet } from './FinancingOverviewSheet';
import { LendingCriteriaSheet } from './LendingCriteriaSheet';
import { DealTermsSheet } from './DealTermsSheet';
import { ProcessExecutionSheet } from './ProcessExecutionSheet';
import { TrackRecordSheet } from './TrackRecordSheet';

type SheetKey = 'financing' | 'criteria' | 'terms' | 'process' | 'track' | null;

/**
 * Lender role's Role Thesis tab — Phase 8, fourth role built. No mockup reference (same situation
 * as Searcher/Investor) — reuses the established house style (bottom-sheet edits,
 * `RoleThesisSectionCard` chrome, pill read-mode primitives).
 *
 * Unlike Investor, Lender's 5 cards DO show a status badge + "Complete this section" CTA — web's
 * `CardShell` receives explicit `complete`/`incomplete` for every one of Lender's cards, matching
 * Intermediary/Searcher's architecture (`RoleThesisSectionCard`'s default `showStatus=true`), not
 * Investor's always-edit mode. Every card's `complete` prop is computed 100% client-side from the
 * actual `LenderThesis` data (the exact `hasData` expressions web itself uses, quoted per-card
 * below) — not from `completion.sections[]` by array index, matching the project-wide fix already
 * applied to Searcher after that exact bug (Execution Strength showing the wrong state because the
 * server's section order couldn't be confirmed). `fetchLenderThesisCompletion()` still drives the
 * top completeness bar's overall percentage — a single number, not order-dependent.
 *
 * Data source is a dedicated GET (`GET /auth/lender`), same shape as Intermediary/Investor — see
 * `LenderThesis`'s own doc comment (`api/roleThesis.ts`) for the real dual-write/transcoding quirks
 * `updateLenderThesis` handles centrally so these sheets can just pass plain camelCase patches.
 */
export function LenderThesisTab({ profile }: { profile: Profile }) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState<LenderThesis | null>(null);
  const [completion, setCompletion] = useState<RoleThesisCompletion | null>(null);
  const [similar, setSimilar] = useState<Profile[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);
  const [previewingDoc, setPreviewingDoc] = useState(false);

  useEffect(() => {
    Promise.all([fetchLenderThesis(), fetchLenderThesisCompletion()])
      .then(([t, c]) => {
        setThesis(t);
        setCompletion(c);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const profileId = thesis?.profileId;
    if (!profileId) {
      setLoadingSimilar(false);
      return;
    }
    setLoadingSimilar(true);
    fetchSimilarRoleProfiles(profileId, profile.role_type ?? 'Lender')
      .then(setSimilar)
      .finally(() => setLoadingSimilar(false));
  }, [thesis?.profileId, profile.role_type]);

  const refreshCompletion = () => {
    fetchLenderThesisCompletion().then(setCompletion);
  };

  const handleSaved = (patch: Partial<LenderThesis>) => {
    setThesis(prev => (prev ? { ...prev, ...patch } : prev));
    refreshCompletion();
  };

  /** Matches web's real "Send message" button exactly — plain navigation to the Messages tab, no
   * conversation-creation call (this CTA lives on View Profile, the signed-in user's own profile). */
  const handleMessage = () => {
    navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'Messages' } });
  };

  /** Real save-to-device — same implementation as Investor's/Searcher's identical Download button. */
  const handleDownloadDoc = async () => {
    const url = thesis?.lendingCriteriaDocumentUrl;
    if (!url) return;
    const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'lending-criteria');
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

  const handleViewSimilar = (p: Profile) => {
    navigation.navigate('MemberProfile', { profile: p, initialSaved: false });
  };

  if (loading || !thesis) {
    return <LenderThesisSkeleton />;
  }

  // Each card's `complete` is computed directly from `thesis` — matches web's own local `hasData`
  // expression per card (`LenderThesisTab.tsx`, quoted per-card below), not a server array index.
  const financingComplete = !!(
    thesis.typeOfFinancing.length ||
    thesis.financingProducts.length ||
    thesis.dealStagePreference.length ||
    thesis.sbaStatus ||
    thesis.typicalLoanSizeMin ||
    thesis.typicalLoanSizeMax
  );
  const criteriaComplete = !!(thesis.lendingCriteriaDocumentUrl || thesis.industries.length || thesis.geographies.length);
  const termsComplete = !!(
    thesis.minEquityContribution ||
    thesis.interestRateMin ||
    thesis.interestRateMax ||
    thesis.typicalLoanDuration ||
    thesis.repaymentTypes.length ||
    thesis.collateralRequirements.length
  );
  const processComplete = !!(thesis.whenGetInvolved.length || thesis.typicalApprovalTimeline || thesis.dueDiligenceRequired !== null || thesis.ddRequirements.length);
  const trackComplete = !!(thesis.yearsOfLendingExperience || thesis.numberOfDealsFunded || thesis.totalCapitalDeployed || thesis.valueAddDifferentiation.length);

  const completionSections = [
    { label: 'Financing Overview', complete: financingComplete },
    { label: 'Lending Criteria', complete: criteriaComplete },
    { label: 'Deal Terms & Structure', complete: termsComplete },
    { label: 'Process & Execution', complete: processComplete },
    { label: 'Track Record & Value Add', complete: trackComplete },
  ];
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
        label="Financing Overview"
        icon={<Building2 size={17} strokeWidth={1.6} />}
        title="Financing overview"
        description="What you offer and how you lend"
        complete={financingComplete}
        onEdit={() => setOpenSheet('financing')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Type of financing">
                <PillGroup items={thesis.typeOfFinancing} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
              </PillField>
              <PillField label="Deal stage preference">
                <PillGroup items={thesis.dealStagePreference} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Financing products offered">
                <PillGroup items={thesis.financingProducts} bg={colors.hero1} color="#fff" emptyText="Not set" />
              </PillField>
              <PillField label="SBA-backed financing">
                {thesis.sbaStatus ? (
                  <Text style={[fonts.semibold, localStyles.plainValue, { color: colors.ink }]}>{thesis.sbaStatus}</Text>
                ) : (
                  <Text style={[fonts.regular, localStyles.plainValue, { color: colors.ink3 }]}>Not answered</Text>
                )}
              </PillField>
            </View>
          </View>

          {!!(thesis.typicalLoanSizeMin || thesis.typicalLoanSizeMax) && (
            <View style={[localStyles.statBox, { backgroundColor: colors.authField }]}>
              <Text style={[fonts.bold, localStyles.statBoxLabel, { color: colors.ink3 }]}>Typical Loan Size</Text>
              <Text style={[fonts.display, localStyles.statBoxValue, { color: colors.ink }]}>
                {formatMoneyRange(thesis.typicalLoanSizeMin, thesis.typicalLoanSizeMax)}
              </Text>
              <Text style={[fonts.regular, localStyles.statBoxSub, { color: colors.ink3 }]}>per transaction</Text>
            </View>
          )}
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Lending Criteria"
        icon={<FileText size={17} strokeWidth={1.6} />}
        title="Lending criteria"
        description="What businesses you will lend against"
        complete={criteriaComplete}
        onEdit={() => setOpenSheet('criteria')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          {thesis.lendingCriteriaDocumentUrl ? (
            <View style={[styles.docRow, { backgroundColor: colors.authField, borderColor: colors.homeCardBorder }]}>
              <View style={[styles.docIconBox, { backgroundColor: colors.chip }]}>
                <FileText size={15} color={colors.goldDark} strokeWidth={1.6} />
              </View>
              <View style={styles.docText}>
                <Text style={[fonts.bold, styles.docTitle, { color: colors.ink }]} numberOfLines={1}>Lending Criteria Document</Text>
                <Text style={[fonts.regular, styles.docSub, { color: colors.success }]}>Document uploaded</Text>
              </View>
              <View style={[styles.docBadge, { backgroundColor: colors.successSurface, borderColor: colors.success }]}>
                <Text style={[fonts.bold, styles.docBadgeText, { color: colors.success }]}>Uploaded</Text>
              </View>
              <Pressable onPress={() => setPreviewingDoc(true)} style={styles.docIconButton}>
                <ExternalLink size={15} color={colors.ink2} strokeWidth={1.6} />
              </Pressable>
              <Pressable onPress={handleDownloadDoc} style={styles.docIconButton}>
                <Download size={15} color={colors.ink2} strokeWidth={1.6} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => setOpenSheet('criteria')}
              style={[styles.docEmptyBox, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}
            >
              <Upload size={19} color={colors.ink3} strokeWidth={1.6} />
              <Text style={[fonts.bold, styles.docEmptyTitle, { color: colors.ink }]}>No criteria document uploaded</Text>
              <Text style={[fonts.regular, styles.docEmptySub, { color: colors.ink3 }]}>
                Upload your lending criteria as a PDF or Word doc so searchers and advisors understand who you lend to.
              </Text>
              <Text style={[fonts.bold, styles.docEmptyCta, { color: colors.goldDark }]}>Upload document</Text>
            </Pressable>
          )}

          <PillField label="Industry focus">
            {thesis.industries.length > 0 ? (
              <PillGroup items={thesis.industries} bg="#EAF3DE" color="#27500A" />
            ) : (
              <EmptyPillsRow count={3} text="No industries added" onAdd={() => setOpenSheet('criteria')} />
            )}
          </PillField>

          <PillField label="Avoided industries">
            {thesis.excludedIndustries.length > 0 ? (
              <PillGroup items={thesis.excludedIndustries} bg="#FEF2F2" color="#B91C1C" />
            ) : (
              <EmptyPillsRow count={2} text="None specified" onAdd={() => setOpenSheet('criteria')} />
            )}
          </PillField>

          <PillField label="Geography focus">
            {thesis.geographies.length > 0 ? (
              <PillGroup items={thesis.geographies} bg="#D0DBE5" color={colors.ink} />
            ) : (
              <EmptyPillsRow count={2} text="Not specified" onAdd={() => setOpenSheet('criteria')} />
            )}
          </PillField>

          <View style={localStyles.criteriaGrid}>
            <DealCriteriaTile label="Revenue" value={formatMoneyRange(thesis.targetRevenueMin, thesis.targetRevenueMax)} />
            <DealCriteriaTile label="EBITDA" value={formatMoneyRange(thesis.targetEbitdaMin, thesis.targetEbitdaMax)} />
            <DealCriteriaTile label="Deal Size" value={formatMoneyRange(thesis.targetDealSizeMin, thesis.targetDealSizeMax)} />
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Deal Terms & Structure"
        icon={<CreditCard size={17} strokeWidth={1.6} />}
        title="Deal terms & structure"
        description="How you structure your loans"
        complete={termsComplete}
        onEdit={() => setOpenSheet('terms')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <CreamTile heading="Min Equity Contribution" value={thesis.minEquityContribution || '—'} caption="required injection" />
              <CreamTile heading="Loan Duration" value={thesis.typicalLoanDuration || '—'} caption="typical term" />
            </View>
            <View style={styles.fieldsCol}>
              <View style={[localStyles.rateTile, { backgroundColor: colors.hero1 }]}>
                <Text style={[fonts.display, localStyles.rateValue]}>
                  {thesis.interestRateMin || '—'}% – {thesis.interestRateMax || '—'}%
                </Text>
                <Text style={localStyles.rateCaption}>Interest rate range (annual)</Text>
              </View>
              <PillField label="Repayment type">
                <PillGroup items={thesis.repaymentTypes} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
              </PillField>
            </View>
          </View>

          <PillField label="Security / collateral">
            <PillGroup items={thesis.collateralRequirements} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Process & Execution"
        icon={<Clock size={17} strokeWidth={1.6} />}
        title="Process & execution"
        description="Timeline and due diligence approach"
        complete={processComplete}
        onEdit={() => setOpenSheet('process')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <PillField label="When do you get involved?">
            <PillGroup items={thesis.whenGetInvolved} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
          </PillField>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Typical approval timeline">
                {thesis.typicalApprovalTimeline ? (
                  <Text style={[fonts.semibold, localStyles.plainValue, { color: colors.ink }]}>{thesis.typicalApprovalTimeline}</Text>
                ) : (
                  <Text style={[fonts.regular, localStyles.plainValue, { color: colors.ink3 }]}>Not set</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Due diligence required">
                <DDStatusText value={thesis.dueDiligenceRequired} />
              </PillField>
            </View>
          </View>

          {thesis.ddRequirements.length > 0 && (
            <PillField label="DD level & requirements">
              <PillGroup items={thesis.ddRequirements} bg={colors.borderSoft} color={colors.ink2} />
            </PillField>
          )}
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Track Record & Value Add"
        icon={<TrendingUp size={17} strokeWidth={1.6} />}
        title="Track record & value add"
        description="Your experience and what sets you apart"
        complete={trackComplete}
        onEdit={() => setOpenSheet('track')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={localStyles.trackGrid}>
            <View style={[localStyles.trackTile, { backgroundColor: colors.hero1 }]}>
              <Text style={[fonts.display, localStyles.trackValue]}>{thesis.yearsOfLendingExperience || '—'}</Text>
              <Text style={localStyles.trackCaption}>Years lending experience</Text>
            </View>
            <View style={[localStyles.trackTile, { backgroundColor: colors.hero1 }]}>
              <Text style={[fonts.display, localStyles.trackValue]}>{thesis.numberOfDealsFunded || '—'}</Text>
              <Text style={localStyles.trackCaption}>Deals funded</Text>
            </View>
            <View style={[localStyles.trackTile, { backgroundColor: colors.hero1 }]}>
              <Text style={[fonts.display, localStyles.trackValue]}>
                {thesis.totalCapitalDeployed ? formatMoney(thesis.totalCapitalDeployed) : '—'}
              </Text>
              <Text style={localStyles.trackCaption}>Total capital deployed</Text>
            </View>
          </View>

          {thesis.valueAddDifferentiation.length > 0 && (
            <View>
              <Text style={[fonts.bold, localStyles.valueAddLabel, { color: colors.ink3 }]}>Value-Add & Differentiation</Text>
              {thesis.valueAddDifferentiation.map(item => (
                <View key={item} style={localStyles.valueAddRow}>
                  <CheckCircle2 size={16} color="#16A34A" strokeWidth={2} />
                  <Text style={[fonts.regular, localStyles.valueAddText, { color: colors.ink }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </RoleThesisSectionCard>

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Interested in {profile.name.split(' ')[0]} as a lender?</Text>
        <Text style={styles.ctaBody}>
          Their <Text style={{ color: colors.goldLight }}>lending criteria</Text>, <Text style={{ color: colors.goldLight }}>deal structure</Text>,{' '}
          <Text style={{ color: colors.goldLight }}>risk profile</Text> are all strong signals. Connect to request their resume and discuss fit.
        </Text>
        <Pressable onPress={handleMessage} style={styles.ctaButton}>
          <MessageCircle size={14} color="#fff" strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Send message</Text>
        </Pressable>
      </View>

      <SimilarProfilesRow heading="Similar lenders you may know" profiles={similar} loading={loadingSimilar} onViewProfile={handleViewSimilar} />

      <FinancingOverviewSheet visible={openSheet === 'financing'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <LendingCriteriaSheet visible={openSheet === 'criteria'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <DealTermsSheet visible={openSheet === 'terms'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <ProcessExecutionSheet visible={openSheet === 'process'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <TrackRecordSheet visible={openSheet === 'track'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      {!!thesis.lendingCriteriaDocumentUrl && (
        <DocumentPreviewSheet
          visible={previewingDoc}
          url={thesis.lendingCriteriaDocumentUrl}
          title="Lending Criteria"
          onClose={() => setPreviewingDoc(false)}
        />
      )}
    </View>
  );
}

/** Same opacity-pulse shimmer as every other Role Thesis skeleton (`SearcherThesisTab.tsx`'s own
 * copy, this codebase's established per-file duplication precedent for this small component). */
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

function LenderThesisSkeleton() {
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
      {[0, 1, 2, 3, 4].map(i => (
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

/** Deal Criteria's 3 metric tiles — captions ("Revenue"/"EBITDA"/"Deal Size") intentionally don't
 * match their edit-mode field labels ("Business Preferred Revenue" etc.), a real web mismatch
 * confirmed and replicated (same pattern already found on Investor's Track Record card). */
function DealCriteriaTile({ label, value }: { label: string; value: string | null }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.criteriaTile, { backgroundColor: colors.authField }]}>
      <Text style={[fonts.bold, localStyles.criteriaLabel, { color: colors.ink3 }]}>{label}</Text>
      <View style={[localStyles.criteriaBar, { backgroundColor: colors.gold }]} />
      {value ? (
        <Text style={[fonts.display, localStyles.criteriaValue, { color: colors.ink }]}>{value}</Text>
      ) : (
        <Text style={[fonts.regular, localStyles.criteriaEmpty, { color: colors.ink3 }]}>Not set</Text>
      )}
    </View>
  );
}

/** Min Equity Contribution / Loan Duration tiles — cream bg, "—" empty fallback (distinct from
 * `DealCriteriaTile`'s "Not set", matching web's own per-field empty-copy inconsistency). */
function CreamTile({ heading, value, caption }: { heading: string; value: string; caption: string }) {
  const { colors, fonts } = useTheme();
  const isEmpty = value === '—';
  return (
    <View style={[localStyles.creamTile, { backgroundColor: colors.authField }]}>
      <Text style={[fonts.bold, localStyles.creamHeading, { color: colors.ink3 }]}>{heading}</Text>
      <Text style={[fonts.display, localStyles.creamValue, { color: isEmpty ? colors.border : colors.ink }]}>{value}</Text>
      <Text style={[fonts.regular, localStyles.creamCaption, { color: colors.ink3 }]}>{caption}</Text>
    </View>
  );
}

/** Matches web's real empty-state for Industry Focus/Avoided Industries/Geography Focus exactly
 * (`LenderThesisTab.tsx:626-663`) — `count` gray skeleton pills (88×28, matching `PillValue`'s own
 * `emptyPill` dimensions) above a "{text} — add now" line, NOT the plain dash/text fallback this
 * card originally shipped with. */
function EmptyPillsRow({ count, text, onAdd }: { count: number; text: string; onAdd: () => void }) {
  const { colors, fonts } = useTheme();
  return (
    <View>
      <View style={localStyles.emptyPillsRow}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={[localStyles.emptyPill, { backgroundColor: colors.border }]} />
        ))}
      </View>
      <Text style={[fonts.regular, localStyles.emptyPillsText, { color: colors.ink3 }]}>
        {text} — <Text style={[fonts.medium, { color: colors.gold }]} onPress={onAdd}>add now</Text>
      </Text>
    </View>
  );
}

function DDStatusText({ value }: { value: boolean | null }) {
  const { fonts } = useTheme();
  if (value === true) {
    return <Text style={[fonts.semibold, localStyles.plainValue, { color: '#16A34A' }]}>Yes — DD required</Text>;
  }
  if (value === false) {
    return <Text style={[fonts.semibold, localStyles.plainValue, { color: '#F04438' }]}>No — light touch only</Text>;
  }
  return <Text style={[fonts.regular, localStyles.plainValue, { color: '#7a90a6' }]}>Not answered</Text>;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 18 },
  fieldsWrap: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14, gap: 14 },
  fieldsRow: { flexDirection: 'row', gap: 16 },
  fieldsCol: { flex: 1, minWidth: 0, gap: 14 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 12 },
  docIconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  docText: { flex: 1, minWidth: 0 },
  docTitle: { fontSize: 12 },
  docSub: { fontSize: 10.5, marginTop: 1 },
  docBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1, flexShrink: 0 },
  docBadgeText: { fontSize: 9.5, letterSpacing: 0.3 },
  docIconButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docEmptyBox: { alignItems: 'center', gap: 6, paddingVertical: 22, paddingHorizontal: 14, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 13 },
  docEmptyTitle: { fontSize: 13 },
  docEmptySub: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 1 },
  docEmptyCta: { fontSize: 12, marginTop: 4 },
  ctaCard: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center' },
  ctaTitle: { fontSize: 17, lineHeight: 22, color: '#fff', textAlign: 'center' },
  ctaBody: { fontSize: 11.5, lineHeight: 18, color: 'rgba(255,255,255,0.62)', marginTop: 7, textAlign: 'center' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 20, marginTop: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)' },
  ctaButtonText: { fontSize: 13, color: '#fff' },
});

const localStyles = StyleSheet.create({
  plainValue: { fontSize: 13 },
  statBox: { borderRadius: 12, padding: 14 },
  statBoxLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  statBoxValue: { fontSize: 20, marginTop: 6 },
  statBoxSub: { fontSize: 11, marginTop: 3 },
  criteriaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  criteriaTile: { flexBasis: '30%', flexGrow: 1, borderRadius: 10, padding: 13, gap: 6 },
  criteriaLabel: { fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase' },
  criteriaBar: { width: 18, height: 2, borderRadius: 1 },
  criteriaValue: { fontSize: 15 },
  criteriaEmpty: { fontSize: 12.5 },
  creamTile: { borderRadius: 12, padding: 14 },
  creamHeading: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  creamValue: { fontSize: 20 },
  creamCaption: { fontSize: 10.5, marginTop: 4 },
  rateTile: { borderRadius: 12, padding: 14 },
  rateValue: { fontSize: 20, color: '#fff' },
  rateCaption: { fontSize: 10.5, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  trackGrid: { flexDirection: 'row', gap: 9 },
  trackTile: { flex: 1, minWidth: 0, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 10 },
  trackValue: { fontSize: 22, color: '#fff' },
  trackCaption: { fontSize: 9.5, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  valueAddLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 },
  valueAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  valueAddText: { fontSize: 13 },
  emptyPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  emptyPill: { width: 88, height: 28, borderRadius: 999 },
  emptyPillsText: { fontSize: 12 },
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
