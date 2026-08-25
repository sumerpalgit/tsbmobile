import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import { User, Star, Briefcase, AlignLeft, TrendingUp, MessageCircle, ExternalLink, Download, Info } from 'lucide-react-native';
import { useTheme } from '../../../../theme';
import type { AppStackParamList } from '../../../../navigation/types';
import type { Profile } from '../../../../types/directory';
import {
  fetchInvestorThesis,
  fetchInvestorThesisCompletion,
  fetchSimilarRoleProfiles,
  InvestorThesis,
  RoleThesisCompletion,
} from '../../../../api/roleThesis';
import { DocumentPreviewSheet } from '../DocumentPreviewSheet';
import type { RoleThesisTabHandle } from '../RoleThesisTabHandle';
import { RoleThesisCompleteness } from '../RoleThesisCompleteness';
import { RoleThesisSectionCard } from '../RoleThesisSectionCard';
import { SimilarProfilesRow } from '../SimilarProfilesRow';
import { PillField, PillValue, PillGroup, formatMoney, formatMoneyRange } from '../ThesisReadPrimitives';
import { InvestorProfileSheet } from './InvestorProfileSheet';
import { InvestmentFocusSheet } from './InvestmentFocusSheet';
import { DealCriteriaSheet } from './DealCriteriaSheet';
import { InvestmentApproachSheet } from './InvestmentApproachSheet';
import { TrackRecordValueAddSheet } from './TrackRecordValueAddSheet';

type SheetKey = 'profile' | 'focus' | 'criteria' | 'approach' | 'track' | null;

/**
 * Investor role's Role Thesis tab — Phase 8, third role built. Same "no mockup, web is the only
 * source for functionality AND layout" situation as Searcher, so this reuses the established house
 * style (bottom-sheet edits, `RoleThesisSectionCard` chrome, pill read-mode primitives).
 *
 * The one genuinely distinct thing about Investor: web's `CardShell` never receives
 * `complete`/`incomplete` for ANY of its 5 cards, which means `alwaysShowEdit = true` for every one
 * — no card ever shows a status badge or a "Complete this section" CTA, the edit pencil is just
 * always there. That's `RoleThesisSectionCard`'s `showStatus={false}` mode, used throughout below.
 * Two individual cards (Deal Criteria, Track Record) still show their OWN inline "Add X" button
 * when their own local data is empty — that's ordinary read-mode body content, not the shared
 * component's CTA system.
 *
 * Data source is the same dedicated-GET shape as Intermediary (`GET /auth/investor`,
 * `fetchInvestorThesis`), including the same `profile_id`-from-the-response pattern for "Similar
 * investors" — proven reliable there, unlike Searcher's `roleProfile`-based approach.
 */
export const InvestorThesisTab = forwardRef<RoleThesisTabHandle, { profile: Profile }>(function InvestorThesisTabImpl({ profile }, ref) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState<InvestorThesis | null>(null);
  const [completion, setCompletion] = useState<RoleThesisCompletion | null>(null);
  const [similar, setSimilar] = useState<Profile[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);
  const [previewingDoc, setPreviewingDoc] = useState(false);

  useEffect(() => {
    Promise.all([fetchInvestorThesis(), fetchInvestorThesisCompletion()])
      .then(([t, c]) => {
        // Matches web's own prefill quirk (`InvestmentThesisTab.tsx:876-879`): when the dedicated
        // GET didn't return an Investor Type, fall back to the onboarding `sub_category` value
        // already sitting on the general profile (e.g. "Family Office") rather than leaving it
        // blank.
        const withPrefill = !t.educationalInstitution && profile.sub_category ? { ...t, educationalInstitution: profile.sub_category } : t;
        setThesis(withPrefill);
        setCompletion(c);
      })
      .finally(() => setLoading(false));
  }, [profile.sub_category]);

  useEffect(() => {
    const profileId = thesis?.profileId;
    if (!profileId) {
      setLoadingSimilar(false);
      return;
    }
    setLoadingSimilar(true);
    fetchSimilarRoleProfiles(profileId, profile.role_type ?? 'Investor')
      .then(setSimilar)
      .finally(() => setLoadingSimilar(false));
  }, [thesis?.profileId, profile.role_type]);

  const refreshCompletion = () => {
    fetchInvestorThesisCompletion().then(setCompletion);
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      const [t, c] = await Promise.all([fetchInvestorThesis(), fetchInvestorThesisCompletion()]);
      const withPrefill = !t.educationalInstitution && profile.sub_category ? { ...t, educationalInstitution: profile.sub_category } : t;
      setThesis(withPrefill);
      setCompletion(c);
      if (withPrefill.profileId) {
        setSimilar(await fetchSimilarRoleProfiles(withPrefill.profileId, profile.role_type ?? 'Investor'));
      }
    },
  }), [profile.sub_category, profile.role_type]);

  const handleSaved = (patch: Partial<InvestorThesis>) => {
    setThesis(prev => (prev ? { ...prev, ...patch } : prev));
    refreshCompletion();
  };

  /** Matches web's real "Send message" button exactly — plain navigation to the Messages tab, no
   * conversation-creation call (see Searcher/Intermediary's own fix for why: this CTA lives on
   * View Profile, the signed-in user's own profile, so "starting a conversation with this profile"
   * would try to message yourself). */
  const handleMessage = () => {
    navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'Messages' } });
  };

  /** Real save-to-device — matches web's own `<a href={docUrl} download>` intent, not just
   * viewing. Android: routes through the native Download Manager straight into the device's
   * Downloads folder (with its own system notification), the platform's real "download" affordance.
   * iOS has no public Downloads folder apps can write into, so the closest equivalent is
   * downloading into the app sandbox then handing it to Quick Look's native preview, which itself
   * offers a "Save to Files" action — the standard pattern for this on iOS. */
  const handleDownloadDoc = async () => {
    const url = thesis?.investmentCriteriaUrl;
    if (!url) return;
    const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'investment-thesis');
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
    return <InvestorThesisSkeleton />;
  }

  const completionSections = completion?.sections.length
    ? completion.sections.map(s => ({ label: s.label, complete: s.complete }))
    : [];
  const doneCount = completionSections.filter(s => s.complete).length;

  const hasDealCriteria = !!(thesis.minEquity || thesis.minEV || thesis.minRevenue || thesis.minEBITDA);
  const approachIncomplete = !thesis.investmentThesisSummary && !thesis.investmentCriteriaUrl;
  const hasTrackRecord = !!(thesis.totalCapitalInvested || thesis.numberOfInvestmentsMade || thesis.activePortfolioCompanies);
  const supportLines = thesis.portfolioSupportCapabilities ? thesis.portfolioSupportCapabilities.split('\n').filter(Boolean) : [];

  return (
    <View style={styles.container}>
      {completionSections.length > 0 && (
        <RoleThesisCompleteness
          percentage={completion?.percentage ?? 0}
          doneCount={doneCount}
          totalCount={completionSections.length}
          sections={completionSections}
        />
      )}

      <RoleThesisSectionCard
        label="Investor Profile"
        icon={<User size={17} strokeWidth={1.6} />}
        title="Investor profile"
        description="Your core identity on the platform"
        showStatus={false}
        onEdit={() => setOpenSheet('profile')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Investor type">
                <PillValue value={thesis.educationalInstitution} bg={colors.goldExtraLight} color="#7A5200" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Firm">
                <PlainValue value={thesis.organizationName} />
              </PillField>
            </View>
          </View>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Website">
                {thesis.organizationWebsite ? (
                  <Pressable onPress={() => Linking.openURL(thesis.organizationWebsite).catch(() => {})}>
                    <Text style={[fonts.regular, styles.link, { color: colors.gold }]} numberOfLines={1}>
                      {thesis.organizationWebsite.replace(/^https?:\/\//, '')}
                    </Text>
                  </Pressable>
                ) : (
                  <PlainValue value="" />
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Experience">
                <PlainValue value={thesis.yearsOfInvestmentExperience ? `${thesis.yearsOfInvestmentExperience} years` : ''} />
              </PillField>
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Investment Focus"
        icon={<Star size={17} strokeWidth={1.6} />}
        title="Investment focus"
        description="What you look for in a deal"
        showStatus={false}
        onEdit={() => setOpenSheet('focus')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Preferred stage">
                <PillGroup items={thesis.investmentStage} bg={colors.hero1} color="#fff" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Investment preference">
                <PillValue value={thesis.majorityPreference} bg={colors.goldExtraLight} color="#7A5200" />
              </PillField>
            </View>
          </View>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Ownership preference">
                <PlainValue value={thesis.ownershipPreference} />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Participation style">
                <PillGroup items={thesis.participationStyle} bg={colors.goldExtraLight} color="#7A5200" />
              </PillField>
            </View>
          </View>
          <PillField label="Industry focus">
            <PillGroup items={thesis.industries} bg="#EAF3DE" color="#27500A" />
          </PillField>
          <PillField label="Avoided industries">
            <PillGroup items={thesis.excludedIndustries} bg="#FDECEA" color="#7A1F1F" />
          </PillField>
          <PillField label="Geography focus">
            <PillGroup items={thesis.geographies} bg="#D0DBE5" color={colors.ink} />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Deal Criteria"
        icon={<Briefcase size={17} strokeWidth={1.6} />}
        title="Deal criteria"
        description="Target transaction parameters"
        showStatus={false}
        onEdit={() => setOpenSheet('criteria')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.criteriaWrap}>
          <View style={styles.criteriaGrid}>
            <CriteriaTile label="Ticket Size" value={formatMoneyRange(thesis.minEquity, thesis.maxEquity)} />
            <CriteriaTile label="Deal Size" value={formatMoneyRange(thesis.minEV, thesis.maxEV)} />
            <CriteriaTile label="Revenue" value={formatMoneyRange(thesis.minRevenue, thesis.maxRevenue)} />
            <CriteriaTile label="EBITDA" value={formatMoneyRange(thesis.minEBITDA, thesis.maxEBITDA)} />
          </View>
          {!hasDealCriteria && (
            <Pressable onPress={() => setOpenSheet('criteria')} style={[styles.addButton, { backgroundColor: colors.hero1 }]}>
              <Text style={[fonts.bold, styles.addButtonText]}>Add deal criteria</Text>
            </Pressable>
          )}
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Investment Approach"
        icon={<AlignLeft size={17} strokeWidth={1.6} />}
        title="Investment approach"
        description="How you evaluate and engage with deals"
        showStatus={false}
        onEdit={() => setOpenSheet('approach')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          {approachIncomplete && (
            <View style={[styles.missingBanner, { backgroundColor: colors.goldExtraLight, borderColor: colors.goldExtraLight }]}>
              <Info size={16} color="#7A5200" strokeWidth={1.8} />
              <View style={styles.missingBannerText}>
                <Text style={[fonts.bold, styles.missingBannerTitle, { color: '#7A5200' }]}>This section is incomplete</Text>
                <Text style={[fonts.regular, styles.missingBannerBody, { color: '#7A5200' }]}>
                  Investors with a completed thesis receive 3x more inbound deal flow.
                </Text>
              </View>
            </View>
          )}

          {!!thesis.investmentThesisSummary && (
            <PillField label="Investment thesis">
              <Text style={[fonts.regular, styles.summaryText, { color: colors.ink2 }]}>{thesis.investmentThesisSummary}</Text>
            </PillField>
          )}

          <View style={[styles.docRow, { backgroundColor: colors.authField, borderColor: colors.homeCardBorder }]}>
            <View style={[styles.docIconBox, { backgroundColor: colors.chip }]}>
              <AlignLeft size={15} color={colors.goldDark} strokeWidth={1.6} />
            </View>
            <View style={styles.docText}>
              <Text style={[fonts.bold, styles.docTitle, { color: colors.ink }]}>Investment Thesis</Text>
              <Text style={[fonts.regular, styles.docSub, { color: thesis.investmentCriteriaUrl ? colors.success : colors.ink3 }]}>
                {thesis.investmentCriteriaUrl ? 'Document uploaded' : 'No document uploaded yet'}
              </Text>
            </View>
            {thesis.investmentCriteriaUrl ? (
              <>
                <View style={[styles.docBadge, { backgroundColor: colors.successSurface, borderColor: colors.success }]}>
                  <Text style={[fonts.bold, styles.docBadgeText, { color: colors.success }]}>Uploaded</Text>
                </View>
                <Pressable onPress={() => setPreviewingDoc(true)} style={styles.docIconButton}>
                  <ExternalLink size={15} color={colors.ink2} strokeWidth={1.6} />
                </Pressable>
                <Pressable onPress={handleDownloadDoc} style={styles.docIconButton}>
                  <Download size={15} color={colors.ink2} strokeWidth={1.6} />
                </Pressable>
              </>
            ) : (
              <View style={[styles.docBadge, { backgroundColor: colors.goldExtraLight, borderColor: colors.gold }]}>
                <Text style={[fonts.bold, styles.docBadgeText, { color: colors.gold }]}>Not uploaded</Text>
              </View>
            )}
          </View>

          <PillField
            label="Due diligence approach"
            action={thesis.dueDiligenceApproach.length === 0 ? { label: 'add now', onPress: () => setOpenSheet('approach') } : undefined}
          >
            <PillGroup items={thesis.dueDiligenceApproach} bg={colors.surfaceSunken} color="#3A5068" />
          </PillField>

          <PillField label="Preferred deals from">
            <PillGroup items={thesis.preferredSelections} bg="#D0DBE5" color={colors.ink} />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Track Record & Value Add"
        icon={<TrendingUp size={17} strokeWidth={1.6} />}
        title="Track record & value add"
        description="Capital deployed and how you help portfolio companies"
        showStatus={false}
        onEdit={() => setOpenSheet('track')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.metricGrid}>
            <MetricTile value={thesis.totalCapitalInvested ? formatMoney(thesis.totalCapitalInvested) : '—'} label="Capital Invested" filled={hasTrackRecord} />
            <MetricTile value={thesis.numberOfInvestmentsMade || '—'} label="Investments" filled={hasTrackRecord} />
            <MetricTile value={thesis.activePortfolioCompanies || '—'} label="Active Cos." filled={hasTrackRecord} />
          </View>
          {hasTrackRecord && (
            <PillField label="Post-acquisition support">
              {supportLines.length > 0 ? (
                <View style={styles.bulletList}>
                  {supportLines.map((line, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.gold }]} />
                      <Text style={[fonts.regular, styles.bulletText, { color: colors.ink2 }]}>{line}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <PlainValue value="" />
              )}
            </PillField>
          )}
          {!hasTrackRecord && (
            <Pressable onPress={() => setOpenSheet('track')} style={[styles.addButton, { backgroundColor: colors.hero1 }]}>
              <Text style={[fonts.bold, styles.addButtonText]}>Add track record</Text>
            </Pressable>
          )}
        </View>
      </RoleThesisSectionCard>

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Interested in {profile.name.split(' ')[0]} as an investor?</Text>
        <Text style={styles.ctaBody}>
          Their <Text style={{ color: colors.goldLight }}>investment thesis</Text>, <Text style={{ color: colors.goldLight }}>deal criteria</Text> and{' '}
          <Text style={{ color: colors.goldLight }}>value-add focus</Text> are all strong signals. Connect to request their resume and discuss fit.
        </Text>
        <Pressable onPress={handleMessage} style={styles.ctaButton}>
          <MessageCircle size={14} color="#fff" strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Send message</Text>
        </Pressable>
      </View>

      <SimilarProfilesRow heading="Similar investors you may know" profiles={similar} loading={loadingSimilar} onViewProfile={handleViewSimilar} />

      <InvestorProfileSheet visible={openSheet === 'profile'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <InvestmentFocusSheet visible={openSheet === 'focus'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <DealCriteriaSheet visible={openSheet === 'criteria'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <InvestmentApproachSheet visible={openSheet === 'approach'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      {!!thesis.investmentCriteriaUrl && (
        <DocumentPreviewSheet
          visible={previewingDoc}
          url={thesis.investmentCriteriaUrl}
          title="Investment Thesis"
          onClose={() => setPreviewingDoc(false)}
        />
      )}
      <TrackRecordValueAddSheet visible={openSheet === 'track'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
    </View>
  );
});

function PlainValue({ value, emptyText = '-' }: { value: string; emptyText?: string }) {
  const { colors, fonts } = useTheme();
  return value ? (
    <Text style={[fonts.regular, localStyles.plainValue, { color: colors.ink }]}>{value}</Text>
  ) : (
    <Text style={[fonts.regular, localStyles.plainValue, { color: colors.ink3 }]}>{emptyText}</Text>
  );
}

function CriteriaTile({ label, value }: { label: string; value: string | null }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.criteriaTile, { backgroundColor: colors.authField, borderColor: colors.homeCardBorder }]}>
      <Text style={[fonts.bold, localStyles.criteriaLabel, { color: colors.ink3 }]}>{label}</Text>
      <View style={[localStyles.criteriaBar, { backgroundColor: colors.gold }]} />
      {value ? (
        <Text style={[fonts.display, localStyles.criteriaValue, { color: colors.ink }]}>{value}</Text>
      ) : (
        <Text style={[fonts.regular, localStyles.criteriaEmpty, { color: colors.ink3 }]}>-</Text>
      )}
    </View>
  );
}

/** Web's own tile color for this card is dynamic on AGGREGATE data presence (`hasData` across all
 * 3 fields), not per-field — every tile turns navy-filled together, or stays plain gray together. */
function MetricTile({ value, label, filled }: { value: string; label: string; filled: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.metricTile, { backgroundColor: filled ? colors.hero1 : colors.surfaceSunken }]}>
      <Text style={[fonts.display, localStyles.metricValue, { color: filled ? '#fff' : colors.ink3 }]}>{value}</Text>
      <Text style={[fonts.regular, localStyles.metricLabel, { color: filled ? 'rgba(255,255,255,0.7)' : colors.ink3 }]}>{label}</Text>
    </View>
  );
}

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

function InvestorThesisSkeleton() {
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

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 18 },
  fieldsWrap: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14, gap: 14 },
  fieldsRow: { flexDirection: 'row', gap: 16 },
  fieldsCol: { flex: 1, minWidth: 0 },
  link: { fontSize: 12.5 },
  criteriaWrap: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14, gap: 12 },
  criteriaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  missingBanner: { flexDirection: 'row', gap: 10, padding: 13, borderWidth: 1, borderRadius: 12 },
  missingBannerText: { flex: 1, minWidth: 0 },
  missingBannerTitle: { fontSize: 12.5 },
  missingBannerBody: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  summaryText: { fontSize: 12.5, lineHeight: 19 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 12 },
  docIconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  docText: { flex: 1, minWidth: 0 },
  docTitle: { fontSize: 12 },
  docSub: { fontSize: 10.5, marginTop: 1 },
  docBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1, flexShrink: 0 },
  docBadgeText: { fontSize: 9.5, letterSpacing: 0.3 },
  docIconButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  metricGrid: { flexDirection: 'row', gap: 9 },
  bulletList: { gap: 6 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bulletDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 6 },
  bulletText: { flex: 1, minWidth: 0, fontSize: 12.5, lineHeight: 18 },
  addButton: { height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', paddingHorizontal: 20 },
  addButtonText: { fontSize: 12.5, color: '#fff' },
  ctaCard: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center' },
  ctaTitle: { fontSize: 17, lineHeight: 22, color: '#fff', textAlign: 'center' },
  ctaBody: { fontSize: 11.5, lineHeight: 18, color: 'rgba(255,255,255,0.62)', marginTop: 7, textAlign: 'center' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 20, marginTop: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)' },
  ctaButtonText: { fontSize: 13, color: '#fff' },
});

const localStyles = StyleSheet.create({
  plainValue: { fontSize: 13 },
  criteriaTile: { flexBasis: '47%', flexGrow: 1, borderRadius: 10, borderWidth: 1, padding: 13, gap: 6 },
  criteriaLabel: { fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase' },
  criteriaBar: { width: 18, height: 2, borderRadius: 1 },
  criteriaValue: { fontSize: 15 },
  criteriaEmpty: { fontSize: 12.5 },
  metricTile: { flex: 1, minWidth: 0, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 10, alignItems: 'center', gap: 3 },
  metricValue: { fontSize: 18 },
  metricLabel: { fontSize: 9.5, textAlign: 'center' },
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
