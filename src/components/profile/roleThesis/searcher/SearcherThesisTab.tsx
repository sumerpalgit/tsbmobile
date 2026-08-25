import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import { User, FileText, Briefcase, Target, Zap, MessageCircle, Check, ExternalLink, Download, Info } from 'lucide-react-native';
import { useTheme } from '../../../../theme';
import type { AppStackParamList } from '../../../../navigation/types';
import type { Profile } from '../../../../types/directory';
import {
  getSearcherThesis,
  fetchSearcherThesisCompletion,
  fetchSimilarRoleProfiles,
  SearcherThesis,
  RoleThesisCompletion,
} from '../../../../api/roleThesis';
import { DocumentPreviewSheet } from '../DocumentPreviewSheet';
import type { RoleThesisTabHandle } from '../RoleThesisTabHandle';
import { RoleThesisCompleteness } from '../RoleThesisCompleteness';
import { RoleThesisSectionCard } from '../RoleThesisSectionCard';
import { SimilarProfilesRow } from '../SimilarProfilesRow';
import { PillField, PillValue, PillGroup, formatMoney, formatMoneyRange } from '../ThesisReadPrimitives';
import { SearchIdentitySheet } from './SearchIdentitySheet';
import { SearchThesisSheet } from './SearchThesisSheet';
import { CapitalFundingSheet } from './CapitalFundingSheet';
import { SearchProgressSheet } from './SearchProgressSheet';
import { ExecutionStrengthSheet } from './ExecutionStrengthSheet';

type SheetKey = 'identity' | 'thesis' | 'capital' | 'progress' | 'execution' | null;
const SEARCH_STAGES = ['Preparing', 'Actively sourcing', 'LOI stage', 'Under DD', 'Closed'];

/**
 * Searcher role's Role Thesis tab — Phase 8, second role built. Unlike Intermediary, there's no
 * mockup reference for this role at all (the mockup only ever demoed Intermediary) — this reuses
 * Intermediary's established "house style" (bottom-sheet edits, `RoleThesisSectionCard` chrome,
 * pill read-mode primitives) since no competing mockup design exists, and web is the only source
 * for both functionality AND layout here.
 *
 * Data source is architecturally different from Intermediary: web's `SearcherThesisTab` has NO
 * dedicated GET call — it reads straight off `GET /profile/me`'s own `roleProfile` object, a
 * SEPARATE key from the general `profile` object in that same response (confirmed via
 * `webSrc/actions/my-profile.ts:46-48`'s `{ profile?: any; roleProfile?: any }` shape). Role fields
 * like `searchType`/`searchFirmName` live only on `roleProfile` — an earlier pass read `user.profile`
 * (the general object) for this instead, which is why some Search Identity fields silently showed
 * nothing despite the real data existing one API call away. Mobile's `useMe()` now surfaces the
 * real `roleProfile` object as `User.roleProfile` (`src/api/profile.ts`), threaded down from
 * `ViewProfileScreen` — still no second network request, just reading the right half of the
 * response already in hand. `userId` (role-agnostic, from `useMe()`'s `User.id`) is what "Similar
 * searchers you may know" uses — more robust than depending on a role-specific GET response's own
 * `profile_id` field, which this role doesn't even have (no GET call to have one).
 */
export const SearcherThesisTab = forwardRef<RoleThesisTabHandle, { profile: Profile; roleProfile: unknown; userId: string }>(
  function SearcherThesisTabImpl({ profile, roleProfile, userId }, ref) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [thesis, setThesis] = useState<SearcherThesis>(() => getSearcherThesis(roleProfile));
  const [completion, setCompletion] = useState<RoleThesisCompletion | null>(null);
  const [completionLoading, setCompletionLoading] = useState(true);
  const [similar, setSimilar] = useState<Profile[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);
  const [previewingDoc, setPreviewingDoc] = useState(false);

  useEffect(() => {
    setThesis(getSearcherThesis(roleProfile));
  }, [roleProfile]);

  useEffect(() => {
    setCompletionLoading(true);
    fetchSearcherThesisCompletion()
      .then(setCompletion)
      .finally(() => setCompletionLoading(false));
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoadingSimilar(false);
      return;
    }
    setLoadingSimilar(true);
    fetchSimilarRoleProfiles(userId, profile.role_type ?? 'Searcher')
      .then(setSimilar)
      .finally(() => setLoadingSimilar(false));
  }, [userId, profile.role_type]);

  const refreshCompletion = () => {
    fetchSearcherThesisCompletion().then(setCompletion);
  };

  // Unlike the other 4 roles, Searcher has no dedicated GET — `thesis` already re-syncs on its own
  // whenever the `roleProfile` prop changes (the effect above), so refresh here only needs to
  // re-pull completion + similar profiles. Getting fresh `roleProfile` itself is
  // `ViewProfileScreen.tsx`'s job (it owns the `useMe()` query this prop comes from — invalidating
  // that query on pull-to-refresh is what actually updates `roleProfile`, which then flows back down
  // as a prop and re-triggers this component's own sync effect).
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      const [c] = await Promise.all([
        fetchSearcherThesisCompletion(),
        userId ? fetchSimilarRoleProfiles(userId, profile.role_type ?? 'Searcher').then(setSimilar) : Promise.resolve(),
      ]);
      setCompletion(c);
    },
  }), [userId, profile.role_type]);

  const handleSaved = (patch: Partial<SearcherThesis>) => {
    setThesis(prev => ({ ...prev, ...patch }));
    refreshCompletion();
  };

  /** Matches web's real "Send message" button exactly (`thesis-shared.tsx:512/534`) — plain
   * navigation to the Messages tab, `onClick={() => router.push('/dashboard/messages')}`. NOT a
   * "start a conversation with this profile" flow — this CTA lives on View Profile, the SIGNED-IN
   * user's own profile, so "this profile" is always the viewer themselves; an earlier pass built
   * it as a `startConversation` call anyway (copying Directory's genuinely different "message
   * another member" pattern), which silently failed messaging yourself with no visible error
   * (matching web's own lack of error UI for that mutation) — looking, from the outside, exactly
   * like the button did nothing at all. */
  const handleMessage = () => {
    navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'Messages' } });
  };

  /** Real save-to-device — matches web's own `<a href={docUrl} download>` intent, not just
   * viewing. Same implementation as Investor's identical Download button
   * (`InvestorThesisTab.tsx`'s own `handleDownloadDoc`): Android routes through the native
   * Download Manager into the device's real Downloads folder; iOS downloads into the app sandbox
   * and hands it to Quick Look's native preview, whose own "Save to Files" action is the closest
   * iOS equivalent since apps can't write into a public Downloads folder there. */
  const handleDownloadDoc = async () => {
    const url = thesis.searchThesisDocumentUrl;
    if (!url) return;
    const fileName = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'search-thesis');
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

  if (completionLoading) {
    return <SearcherThesisSkeleton />;
  }

  const hasEquity = !!(thesis.equityAmountRaised || thesis.equityTargetTotal || thesis.equityNotRaised);
  const hasDebt = !!(thesis.debtAmountMin || thesis.debtAmountMax);
  const equityRaisedNum = Number(thesis.equityAmountRaised) || 0;
  const equityTargetNum = Number(thesis.equityTargetTotal) || 0;
  const equityPct = equityRaisedNum && equityTargetNum ? Math.min(100, Math.round((equityRaisedNum / equityTargetNum) * 100)) : null;
  const debtMinNum = Number(thesis.debtAmountMin) || 0;
  const debtMaxNum = Number(thesis.debtAmountMax) || 0;
  // Matches web's literal (semantically odd, replicated as-is) formula: min/max, not a genuine
  // progress-toward-target ratio.
  const debtPct = debtMinNum && debtMaxNum ? Math.min(100, Math.round((debtMinNum / debtMaxNum) * 100)) : null;

  // Case/whitespace-insensitive match — `thesis.stageOfSearch` comes straight off the backend and
  // doesn't necessarily match `SEARCH_STAGES`' exact casing (a strict `.indexOf` silently showed
  // "Not set" for a real, present value whose casing simply differed).
  const normalizedStage = thesis.stageOfSearch.trim().toLowerCase();
  const stageIndex = SEARCH_STAGES.findIndex(s => s.toLowerCase() === normalizedStage);
  const hasSearchThesisData = !!(thesis.searchThesisDocumentUrl || thesis.industries.length || thesis.geographies.length);

  // Each CARD's own complete/incomplete state is computed directly from the actual thesis data —
  // NOT looked up by array index into `completion.sections` (the previous approach). That indexed
  // lookup assumed the server's section array is ordered exactly [Identity, Thesis, Capital,
  // Progress, Execution] with no way to confirm it, and a mismatch there is indistinguishable from
  // a real bug (confirmed as the cause of Execution Strength showing "Complete this section" on
  // mobile while web showed the same data as already complete).
  const identityComplete = !!(thesis.searchType && thesis.searchFirmName);
  const thesisComplete = hasSearchThesisData;
  const capitalComplete = hasEquity || !!thesis.externalCapitalRequirements || thesis.investorTypePreferences.length > 0;
  const progressComplete = !!(thesis.stageOfSearch || thesis.timeCommitment);
  const executionComplete =
    thesis.hasPriorAcquisition != null ||
    thesis.hasAdvisoryBoard != null ||
    thesis.hasCommitteeDiscussed != null ||
    thesis.hasPriorSearchExperience != null ||
    !!thesis.operationalFocus;

  // The TOP completeness bar is a genuinely separate data source from each card's own badge —
  // confirmed by reading web's real `ProfileCompleteness` (`thesis-shared.tsx:290-314`) directly:
  // it renders `completion?.sections` from the SERVER verbatim (label + complete flag), completely
  // independent of each card's own client-side `isComplete` expression. Web itself can and does
  // show these two disagreeing. An earlier pass here fed this same client-computed array into BOTH
  // the top bar AND each card (reasonable at the time, since the fix above was about per-card
  // reliability) — but that made the top bar diverge from web's real behavior. Restored to reading
  // straight off the server, matching Investor's original (correct) pattern.
  const topBarSections = completion?.sections.length ? completion.sections.map(s => ({ label: s.label, complete: s.complete })) : [];
  const doneCount = topBarSections.filter(s => s.complete).length;

  return (
    <View style={styles.container}>
      {topBarSections.length > 0 && (
        <RoleThesisCompleteness
          percentage={completion?.percentage ?? 0}
          doneCount={doneCount}
          totalCount={topBarSections.length}
          sections={topBarSections}
        />
      )}

      <RoleThesisSectionCard
        label="Search Identity"
        icon={<User size={17} strokeWidth={1.6} />}
        title="Search Identity"
        description="Your role and focus"
        complete={identityComplete}
        onEdit={() => setOpenSheet('identity')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Search type">
                <PillValue value={thesis.searchType} bg={colors.goldExtraLight} color="#7A6020" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Search fund name">
                <PlainValue value={thesis.searchFirmName} />
              </PillField>
            </View>
          </View>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Search fund website">
                {thesis.searchFirmWebsite ? (
                  <Pressable onPress={() => Linking.openURL(thesis.searchFirmWebsite).catch(() => {})}>
                    <Text style={[fonts.regular, styles.link, { color: colors.gold }]} numberOfLines={1}>
                      {thesis.searchFirmWebsite.replace(/^https?:\/\//, '')}
                    </Text>
                  </Pressable>
                ) : (
                  <PlainValue value="" />
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Incorporation year">
                <PlainValue value={thesis.incorporatedYear} />
              </PillField>
            </View>
          </View>
          <PillField label="Years of experience">
            <PlainValue value={thesis.yearsOfExperience} />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Search Thesis"
        icon={<FileText size={17} strokeWidth={1.6} />}
        title="Search thesis"
        description="What you are looking to acquire"
        complete={thesisComplete}
        onEdit={() => setOpenSheet('thesis')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          {!hasSearchThesisData && (
            <View style={[styles.missingBanner, { backgroundColor: colors.goldExtraLight, borderColor: colors.goldExtraLight }]}>
              <Info size={16} color="#7A6020" strokeWidth={1.8} />
              <View style={styles.missingBannerText}>
                <Text style={[fonts.bold, styles.missingBannerTitle, { color: '#7A6020' }]}>Your search thesis is missing</Text>
                <Text style={[fonts.regular, styles.missingBannerBody, { color: '#7A6020' }]}>
                  Investors and sellers look at your thesis first before deciding to reach out. Profiles with a completed thesis receive 4x more inbound connections from investors.
                </Text>
              </View>
            </View>
          )}

          <View style={[styles.docRow, { backgroundColor: colors.authField, borderColor: colors.homeCardBorder }]}>
            <View style={[styles.docIconBox, { backgroundColor: colors.surfaceSunken }]}>
              <FileText size={15} color={colors.ink3} strokeWidth={1.6} />
            </View>
            <View style={styles.docText}>
              <Text style={[fonts.bold, styles.docTitle, { color: colors.ink }]}>Search Thesis</Text>
              <Text style={[fonts.regular, styles.docSub, { color: thesis.searchThesisDocumentUrl ? colors.success : colors.ink3 }]}>
                {thesis.searchThesisDocumentUrl ? 'Document uploaded' : 'No document uploaded yet'}
              </Text>
            </View>
            {thesis.searchThesisDocumentUrl ? (
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

          <PillField label="Industry focus">
            <PillGroup items={thesis.industries} bg="#EAF3DE" color="#27500A" />
          </PillField>

          <PillField label="Geography focus">
            <PillGroup items={thesis.geographies} bg="#D0DBE5" color={colors.ink} />
          </PillField>

          <View style={styles.criteriaGrid}>
            <CriteriaTile label="Business Preferred Revenue" value={formatMoneyRange(thesis.targetRevenueMin, thesis.targetRevenueMax)} />
            <CriteriaTile label="Business Preferred EBITDA" value={formatMoneyRange(thesis.targetEbitdaMin, thesis.targetEbitdaMax)} />
            <CriteriaTile label="Preferred Deal Size" value={formatMoneyRange(thesis.targetDealSizeMin, thesis.targetDealSizeMax)} />
            <CriteriaTile label="Ownership Preference" value={thesis.ownershipPreference || null} />
          </View>

          <View style={[styles.summaryBox, { backgroundColor: colors.authField }]}>
            <Text style={[fonts.bold, styles.summaryLabel, { color: colors.ink3 }]}>Search Thesis Summary</Text>
            {thesis.searchThesis.trim() ? (
              <Text style={[fonts.regular, styles.summaryText, { color: colors.ink2 }]}>{thesis.searchThesis.trim()}</Text>
            ) : (
              <Text style={[fonts.regular, styles.summaryEmpty, { color: colors.ink3 }]}>-</Text>
            )}
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Capital & Funding Readiness"
        icon={<Briefcase size={17} strokeWidth={1.6} />}
        title="Capital & funding readiness"
        description="Your equity raised, debt secured and investor position"
        complete={capitalComplete}
        onEdit={() => setOpenSheet('capital')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <DashboardTile
            title="Equity capital"
            badgeLabel={hasEquity ? thesis.equityCapitalType || null : null}
            notAdded={!hasEquity}
            rows={[
              { label: 'Amount raised', value: formatMoney(thesis.equityAmountRaised) },
              { label: 'Equity target', value: formatMoney(thesis.equityTargetTotal) },
            ]}
            progressPct={equityPct}
            progressLabel={null}
            onAdd={() => setOpenSheet('capital')}
            addLabel="+ Add equity round"
          />
          <DashboardTile
            title="Debt financing"
            badgeLabel={hasDebt ? 'added' : null}
            notAdded={!hasDebt}
            rows={[
              { label: 'Min debt', value: formatMoney(thesis.debtAmountMin) },
              { label: 'Max debt', value: formatMoney(thesis.debtAmountMax) },
            ]}
            progressPct={debtPct}
            progressLabel={thesis.debtLoanTypes[0] ?? null}
            onAdd={() => setOpenSheet('capital')}
            addLabel="+ Add debt round"
          />

          <PillField label="External capital requirement">
            <PlainValue value={thesis.externalCapitalRequirements} emptyText="Not specified" />
          </PillField>

          <PillField label="Investor type preference">
            {thesis.investorTypePreferences.length > 0 ? (
              <PillGroup items={thesis.investorTypePreferences} bg={colors.goldExtraLight} color="#7A6020" />
            ) : (
              <PlainValue value="" emptyText="Not specified" />
            )}
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Search Progress & Commitment"
        icon={<Target size={17} strokeWidth={1.6} />}
        title="Search progress & commitment"
        description="Where you are in your search journey"
        complete={progressComplete}
        onEdit={() => setOpenSheet('progress')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <PillField label="Stage of search">
            <SearchStageStepper stages={SEARCH_STAGES} activeIndex={stageIndex} />
          </PillField>
          <PillField label="Time commitment">
            <PillValue value={thesis.timeCommitment} bg={colors.hero1} color="#fff" emptyStyle="dash" />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Execution Strength & Deal Readiness"
        icon={<Zap size={17} strokeWidth={1.6} />}
        title="Execution strength & deal readiness"
        description="Your background, team and deal readiness"
        complete={executionComplete}
        onEdit={() => setOpenSheet('execution')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          {/* Read-mode labels intentionally don't match their underlying field 1:1 — a real web
              mismatch (`SearcherThesisTab.tsx`'s read view), replicated on purpose: index 2 shows
              "Investor Backing" copy for `hasCommitteeDiscussed`, index 3 shows "Looking for
              Co-Searcher" copy for `hasPriorSearchExperience`. */}
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Deals Closed Before">
                <BoolPill value={thesis.hasPriorAcquisition} trueText="Yes — prior acquisition" falseText="No — no prior acquisition" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Investor Backing">
                <BoolPill value={thesis.hasCommitteeDiscussed} trueText="Yes — committed investors" falseText="No — no committed investors" />
              </PillField>
            </View>
          </View>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Advisory Team">
                <BoolPill value={thesis.hasAdvisoryBoard} trueText="Yes — formal advisory board" falseText="No — no advisory board" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Looking for Co-Searcher">
                <BoolPill value={thesis.hasPriorSearchExperience} trueText="Yes — has search experience" falseText="No — solo search" />
              </PillField>
            </View>
          </View>
          <PillField label="Value Creation Focus">
            <PillValue value={thesis.operationalFocus} bg={colors.goldExtraLight} color="#7A6020" />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Interested in {profile.name.split(' ')[0]} as a searcher?</Text>
        <Text style={styles.ctaBody}>
          Their <Text style={{ color: colors.goldLight }}>search thesis</Text>, <Text style={{ color: colors.goldLight }}>target criteria</Text>,{' '}
          <Text style={{ color: colors.goldLight }}>deal fit</Text> are all strong signals. Connect to request their resume and discuss fit.
        </Text>
        <Pressable onPress={handleMessage} style={styles.ctaButton}>
          <MessageCircle size={14} color="#fff" strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Send message</Text>
        </Pressable>
      </View>

      <SimilarProfilesRow heading="Similar searchers you may know" profiles={similar} loading={loadingSimilar} onViewProfile={handleViewSimilar} />

      <SearchIdentitySheet visible={openSheet === 'identity'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <SearchThesisSheet visible={openSheet === 'thesis'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <CapitalFundingSheet visible={openSheet === 'capital'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <SearchProgressSheet visible={openSheet === 'progress'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <ExecutionStrengthSheet visible={openSheet === 'execution'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      {!!thesis.searchThesisDocumentUrl && (
        <DocumentPreviewSheet
          visible={previewingDoc}
          url={thesis.searchThesisDocumentUrl}
          title="Search Thesis"
          onClose={() => setPreviewingDoc(false)}
        />
      )}
    </View>
  );
});

/** Same opacity-pulse shimmer as `ResourceCardSkeleton.tsx`/Analytics' own skeleton — matches
 * web's own loading state (5 `animate-pulse` boxes, `SearcherThesisTab.tsx`'s `if (loading)`
 * branch) and this project's established "skeleton over spinner" convention, replacing this tab's
 * original plain `ActivityIndicator`. */
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

/** Mirrors this tab's own real shape (completeness bar + 5 section cards) rather than a single
 * generic spinner — matches web's own skeleton being one box per card, not a full mock of each
 * card's internal fields. */
function SearcherThesisSkeleton() {
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

function PlainValue({ value, emptyText = 'Not set' }: { value: string; emptyText?: string }) {
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
    <View style={[localStyles.criteriaTile, { backgroundColor: colors.authField }]}>
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

function DashboardTile({
  title,
  badgeLabel,
  notAdded,
  rows,
  progressPct,
  progressLabel,
  onAdd,
  addLabel,
}: {
  title: string;
  badgeLabel: string | null;
  notAdded: boolean;
  rows: { label: string; value: string }[];
  progressPct: number | null;
  progressLabel: string | null;
  onAdd: () => void;
  addLabel: string;
}) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.dashboardTile, { backgroundColor: colors.authField }]}>
      <View style={localStyles.dashboardHeader}>
        <Text style={[fonts.bold, localStyles.dashboardTitle, { color: colors.ink }]}>{title}</Text>
        {badgeLabel ? (
          <View style={[localStyles.dashboardBadge, { backgroundColor: colors.successSurface, borderColor: colors.success }]}>
            <Text style={[fonts.bold, localStyles.dashboardBadgeText, { color: colors.success }]}>{badgeLabel}</Text>
          </View>
        ) : notAdded ? (
          <Text style={[fonts.semibold, localStyles.notAddedText, { color: '#F04438' }]}>not added</Text>
        ) : null}
      </View>
      {rows.map(row => (
        <View key={row.label} style={localStyles.dashboardRow}>
          <Text style={[fonts.regular, localStyles.dashboardRowLabel, { color: colors.ink3 }]}>{row.label}</Text>
          <Text style={[fonts.bold, localStyles.dashboardRowValue, { color: colors.ink }]}>{row.value}</Text>
        </View>
      ))}
      {progressPct != null && (
        <View style={localStyles.progressWrap}>
          {!!progressLabel && <Text style={[fonts.regular, localStyles.progressLabel, { color: colors.ink3 }]}>{progressLabel}</Text>}
          <View style={[localStyles.progressTrack, { backgroundColor: colors.surfaceSunken }]}>
            <View style={[localStyles.progressFill, { width: `${progressPct}%`, backgroundColor: colors.gold }]} />
          </View>
        </View>
      )}
      <Pressable onPress={onAdd} style={[localStyles.addButton, { borderColor: colors.authFieldBorder }]}>
        <Text style={[fonts.semibold, localStyles.addButtonText, { color: colors.ink2 }]}>{addLabel}</Text>
      </Pressable>
    </View>
  );
}

/** Confirmed against a real web screenshot: an unrecognized `stageOfSearch` value (e.g.
 * "Exploring options" — doesn't match any of `SEARCH_STAGES`) still renders the FULL stepper on
 * web, just with every step neutral/gray (nothing marked active or past) — not a text fallback,
 * and not hidden. `activeIndex === -1` already produces exactly that from the per-step
 * `isActive`/`isPast` checks below (both false for every real index), so there's no separate
 * branch needed — the earlier plain-text fallback here was wrong, replaced with just letting this
 * render unconditionally. */
function SearchStageStepper({ stages, activeIndex }: { stages: string[]; activeIndex: number }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={localStyles.stepperRow}>
      {stages.map((stage, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const circleColor = isActive ? colors.hero1 : isPast ? colors.success : colors.surfaceSunken;
        const textColor = isActive ? colors.ink : isPast ? colors.success : colors.ink3;
        return (
          <React.Fragment key={stage}>
            {i > 0 && <View style={[localStyles.stepperConnector, { backgroundColor: isPast || isActive ? colors.hero1 : colors.border }]} />}
            <View style={localStyles.stepperItem}>
              <View style={[localStyles.stepperCircle, { backgroundColor: circleColor }]}>
                {isPast ? (
                  <Check size={13} color="#fff" strokeWidth={2.4} />
                ) : (
                  <Text style={[fonts.bold, localStyles.stepperNumber, { color: isActive ? '#fff' : colors.ink3 }]}>{i + 1}</Text>
                )}
              </View>
              <Text style={[fonts.semibold, localStyles.stepperLabel, { color: textColor }]} numberOfLines={2}>{stage}</Text>
            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

function BoolPill({ value, trueText, falseText }: { value: boolean | null; trueText: string; falseText: string }) {
  const { colors, fonts } = useTheme();
  if (value == null) {
    return <Text style={[fonts.regular, localStyles.plainValue, { color: colors.ink3 }]}>Not answered</Text>;
  }
  const bg = value ? '#EAF3DE' : '#FEF2F2';
  const dotColor = value ? '#27500A' : '#B91C1C';
  return (
    <View style={[localStyles.boolPill, { backgroundColor: bg }]}>
      <View style={[localStyles.boolDot, { backgroundColor: dotColor }]} />
      <Text style={[fonts.medium, localStyles.boolPillText, { color: dotColor }]}>{value ? trueText : falseText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 18 },
  fieldsWrap: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14, gap: 14 },
  fieldsRow: { flexDirection: 'row', gap: 16 },
  fieldsCol: { flex: 1, minWidth: 0 },
  link: { fontSize: 12.5 },
  missingBanner: { flexDirection: 'row', gap: 10, padding: 13, borderWidth: 1, borderRadius: 12 },
  missingBannerText: { flex: 1, minWidth: 0 },
  missingBannerTitle: { fontSize: 12.5 },
  missingBannerBody: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 12 },
  docIconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  docText: { flex: 1, minWidth: 0 },
  docTitle: { fontSize: 12 },
  docSub: { fontSize: 10.5, marginTop: 1 },
  docBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1, flexShrink: 0 },
  docBadgeText: { fontSize: 9.5, letterSpacing: 0.3 },
  docIconButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  criteriaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  summaryBox: { borderRadius: 12, padding: 13 },
  summaryLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  summaryText: { fontSize: 12.5, lineHeight: 19, marginTop: 6, fontStyle: 'italic' },
  summaryEmpty: { fontSize: 13, marginTop: 6 },
  ctaCard: { borderRadius: 16, paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center' },
  ctaTitle: { fontSize: 17, lineHeight: 22, color: '#fff', textAlign: 'center' },
  ctaBody: { fontSize: 11.5, lineHeight: 18, color: 'rgba(255,255,255,0.62)', marginTop: 7, textAlign: 'center' },
  ctaButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 20, marginTop: 13, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.08)' },
  ctaButtonText: { fontSize: 13, color: '#fff' },
});

const localStyles = StyleSheet.create({
  plainValue: { fontSize: 13 },
  criteriaTile: { flexBasis: '47%', flexGrow: 1, borderRadius: 10, padding: 13, gap: 6 },
  criteriaLabel: { fontSize: 9.5, letterSpacing: 0.4, textTransform: 'uppercase' },
  criteriaBar: { width: 18, height: 2, borderRadius: 1 },
  criteriaValue: { fontSize: 15 },
  criteriaEmpty: { fontSize: 12.5 },
  dashboardTile: { borderRadius: 12, padding: 14, gap: 8 },
  dashboardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  dashboardTitle: { fontSize: 12.5 },
  dashboardBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, flexShrink: 1 },
  dashboardBadgeText: { fontSize: 9.5 },
  notAddedText: { fontSize: 10.5 },
  dashboardRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  dashboardRowLabel: { fontSize: 10.5 },
  dashboardRowValue: { fontSize: 12.5 },
  progressWrap: { gap: 5, marginTop: 2 },
  progressLabel: { fontSize: 10 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  addButton: { height: 34, borderWidth: 1, borderStyle: 'dashed', borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  addButtonText: { fontSize: 11 },
  stepperRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepperItem: { alignItems: 'center', width: 56, gap: 5 },
  stepperCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepperNumber: { fontSize: 11 },
  stepperLabel: { fontSize: 8.5, textAlign: 'center', letterSpacing: 0.2, textTransform: 'uppercase' },
  stepperConnector: { flex: 1, height: 2, marginTop: 12, marginHorizontal: -2 },
  boolPill: { flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  boolDot: { width: 6, height: 6, borderRadius: 3 },
  boolPillText: { fontSize: 12 },
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
