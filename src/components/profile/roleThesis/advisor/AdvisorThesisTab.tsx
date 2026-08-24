import React, { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, Briefcase, Target, DollarSign, Star, MessageCircle, Download } from 'lucide-react-native';
import { useTheme } from '../../../../theme';
import type { AppStackParamList } from '../../../../navigation/types';
import type { Profile } from '../../../../types/directory';
import {
  fetchAdvisorThesis,
  fetchAdvisorThesisCompletion,
  fetchSimilarRoleProfiles,
  AdvisorThesis,
  RoleThesisCompletion,
} from '../../../../api/roleThesis';
import { RoleThesisCompleteness } from '../RoleThesisCompleteness';
import { RoleThesisSectionCard } from '../RoleThesisSectionCard';
import { SimilarProfilesRow } from '../SimilarProfilesRow';
import { PillField, PillGroup, formatMoneyRange } from '../ThesisReadPrimitives';
import { AdvisorProfileSheet } from './AdvisorProfileSheet';
import { EngagementModelSheet } from './EngagementModelSheet';
import { CoverageDealFitSheet } from './CoverageDealFitSheet';
import { CommercialsSheet } from './CommercialsSheet';
import { TrackRecordSheet } from './TrackRecordSheet';

type SheetKey = 'profile' | 'engagement' | 'coverage' | 'commercials' | 'track' | null;

/** Web's own `fmtFee` (`AdvisorThesisTab.tsx`'s Commercials card) — K-only, no M tier, distinct
 * from the shared `formatMoney` (which has both K and M tiers) used by Card 3's Deal Size Range.
 * This split is Advisor-specific and confirmed intentional (deal-size is an enterprise value, fees
 * are not) — kept as two separate formatters rather than consolidated. */
function fmtFee(value: string): string {
  const n = value ? Number(value) : 0;
  if (!n) return '—';
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n}`;
}

/**
 * Advisor role's Role Thesis tab — Phase 8, fifth role built. No mockup reference (same situation
 * as every role after Intermediary) — reuses the established house style. Status-badge + CTA
 * architecture (like Lender/Searcher/Intermediary), NOT Investor's always-edit mode — web's
 * `CardShell` receives explicit `complete`/`incomplete` for all 5 Advisor cards. Per-card `complete`
 * is computed 100% client-side (exact `isComplete` formulas quoted at each card below), matching
 * the project-wide convention; `fetchAdvisorThesisCompletion()` only drives the top completeness bar.
 *
 * Data source is a dedicated GET (`GET /auth/advisor`), same shape as Intermediary/Investor/Lender.
 */
export function AdvisorThesisTab({ profile }: { profile: Profile }) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState<AdvisorThesis | null>(null);
  const [completion, setCompletion] = useState<RoleThesisCompletion | null>(null);
  const [similar, setSimilar] = useState<Profile[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);

  useEffect(() => {
    Promise.all([fetchAdvisorThesis(), fetchAdvisorThesisCompletion()])
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
    fetchSimilarRoleProfiles(profileId, profile.role_type ?? 'Advisor')
      .then(setSimilar)
      .finally(() => setLoadingSimilar(false));
  }, [thesis?.profileId, profile.role_type]);

  const refreshCompletion = () => {
    fetchAdvisorThesisCompletion().then(setCompletion);
  };

  const handleSaved = (patch: Partial<AdvisorThesis>) => {
    setThesis(prev => (prev ? { ...prev, ...patch } : prev));
    refreshCompletion();
  };

  const handleMessage = () => {
    navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'Messages' } });
  };

  const handleViewSimilar = (p: Profile) => {
    navigation.navigate('MemberProfile', { profile: p, initialSaved: false });
  };

  if (loading || !thesis) {
    return <AdvisorThesisSkeleton />;
  }

  const profileComplete = !!(thesis.advisorRole && thesis.yearsExperience && thesis.coreServices.length);
  const engagementComplete = !!(thesis.engagementStages.length && thesis.primaryRepresentation && thesis.engagementModelTypes.length);
  const coverageComplete = !!(thesis.primaryIndustries.length && thesis.geographies.length);
  const commercialsComplete = !!(thesis.projectFeeMin || thesis.monthlyRetainerMin || thesis.hourlyRateMin || thesis.successDealFee);
  const hasCredentials = !!(thesis.firmCredentialsUrl || thesis.credentialsLinkUrl);
  const trackComplete = !!(thesis.differentiationBio || thesis.keyStrengths.length || thesis.dealsCompleted || hasCredentials);

  // The TOP completeness bar is a genuinely separate data source from each card's own badge —
  // confirmed by reading web's real `ProfileCompleteness` (`thesis-shared.tsx:290-314`) directly:
  // it renders `completion?.sections` from the SERVER verbatim (label + complete flag), completely
  // independent of each card's own client-side `isComplete` expression above. Web itself can and
  // does show these two disagreeing — matching Investor's original (correct) pattern here rather
  // than feeding the same client-computed array into both.
  const topBarSections = completion?.sections.length ? completion.sections.map(s => ({ label: s.label, complete: s.complete })) : [];
  const doneCount = topBarSections.filter(s => s.complete).length;

  const credentialsDownloadUrl = thesis.firmCredentialsUrl || thesis.credentialsLinkUrl;

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
        label="Advisor Profile"
        icon={<User size={17} strokeWidth={1.6} />}
        title="Advisor profile"
        description="Your core identity on the platform"
        complete={profileComplete}
        onEdit={() => setOpenSheet('profile')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <PillField label="Advisor role">
            {thesis.advisorRole ? (
              <PillGroup items={[thesis.advisorRole]} bg={colors.goldExtraLight} color="#7A5200" />
            ) : (
              <SkeletonPillsRow count={2} />
            )}
          </PillField>

          <PillField label="Years of experience">
            {thesis.yearsExperience ? (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink }]}>{thesis.yearsExperience}</Text>
            ) : (
              <SkeletonPillsRow count={2} />
            )}
          </PillField>

          <PillField label="Core services">
            {thesis.coreServices.length > 0 ? (
              <PillGroup items={thesis.coreServices} bg={colors.hero1} color="#fff" />
            ) : (
              <SkeletonPillsRow count={3} />
            )}
          </PillField>

          <PillField label="Who you work with">
            {thesis.clientTypes.length > 0 ? (
              <PillGroup items={thesis.clientTypes} bg="#EAF3DE" color="#27500A" />
            ) : (
              <SkeletonPillsRow count={3} />
            )}
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Engagement Model"
        icon={<Briefcase size={17} strokeWidth={1.6} />}
        title="Engagement model"
        description="When and how you engage with clients"
        complete={engagementComplete}
        onEdit={() => setOpenSheet('engagement')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <PillField label="When do you get involved">
            {thesis.engagementStages.length > 0 ? (
              <PillGroup items={thesis.engagementStages} bg={colors.hero1} color="#fff" />
            ) : (
              <SkeletonPillsRow count={3} />
            )}
          </PillField>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Which side you represent">
                {thesis.primaryRepresentation ? (
                  <PillGroup items={[thesis.primaryRepresentation]} bg={colors.goldExtraLight} color="#7A5200" />
                ) : (
                  <SkeletonPillsRow count={2} />
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="How you engage">
                {thesis.engagementModelTypes.length > 0 ? (
                  <PillGroup items={thesis.engagementModelTypes} bg="#EAF3DE" color="#27500A" />
                ) : (
                  <SkeletonPillsRow count={3} />
                )}
              </PillField>
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Coverage & Deal Fit"
        icon={<Target size={17} strokeWidth={1.6} />}
        title="Coverage & deal fit"
        description="Industries, geographies and deal size you cover"
        complete={coverageComplete}
        onEdit={() => setOpenSheet('coverage')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Industry focus">
                {thesis.primaryIndustries.length > 0 ? (
                  <PillGroup items={thesis.primaryIndustries} bg="#EAF3DE" color="#27500A" />
                ) : (
                  <SkeletonPillsRow count={3} />
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Geography focus">
                {thesis.geographies.length > 0 ? (
                  <PillGroup items={thesis.geographies} bg="#D0DBE5" color={colors.ink} />
                ) : (
                  <SkeletonPillsRow count={3} />
                )}
              </PillField>
            </View>
          </View>

          <PillField label="Deal size range">
            <Text
              style={[
                thesis.dealSizeMin || thesis.dealSizeMax ? fonts.semibold : fonts.regular,
                styles.plainValue,
                { color: thesis.dealSizeMin || thesis.dealSizeMax ? colors.ink : colors.ink3 },
              ]}
            >
              {formatMoneyRange(thesis.dealSizeMin, thesis.dealSizeMax) ?? '-'}
            </Text>
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Commercials"
        icon={<DollarSign size={17} strokeWidth={1.6} />}
        title="Commercials"
        description="Your fee structure and pricing"
        complete={commercialsComplete}
        onEdit={() => setOpenSheet('commercials')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={localStyles.commercialsGrid}>
            <CommercialTile label="Project Fee" value={thesis.projectFeeMin || thesis.projectFeeMax ? `${fmtFee(thesis.projectFeeMin)} – ${fmtFee(thesis.projectFeeMax)}` : ''} bordered />
            <CommercialTile label="Monthly Retainer" value={thesis.monthlyRetainerMin || thesis.monthlyRetainerMax ? `${fmtFee(thesis.monthlyRetainerMin)} – ${fmtFee(thesis.monthlyRetainerMax)}` : ''} />
            <CommercialTile label="Hourly Rate" value={thesis.hourlyRateMin || thesis.hourlyRateMax ? `${fmtFee(thesis.hourlyRateMin)} – ${fmtFee(thesis.hourlyRateMax)}` : ''} bordered />
            <CommercialTile label="Success / Deal Fee" value={thesis.successDealFee ? fmtFee(thesis.successDealFee) : ''} />
          </View>

          {!!thesis.commercialsNote.trim() && (
            <View style={[localStyles.noteBox, { backgroundColor: colors.authField }]}>
              <Text style={[fonts.regular, localStyles.noteText, { color: colors.ink2 }]}>{thesis.commercialsNote.trim()}</Text>
            </View>
          )}
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Track Record & Differentiation"
        icon={<Star size={17} strokeWidth={1.6} />}
        title="Track record & differentiation"
        description="Experience, credentials and what sets you apart"
        complete={trackComplete}
        onEdit={() => setOpenSheet('track')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={[localStyles.dealsTile, { backgroundColor: colors.hero1 }]}>
            <Text style={[fonts.display, localStyles.dealsValue]}>{thesis.dealsCompleted || '—'}</Text>
            <Text style={localStyles.dealsCaption}>Deals / projects completed</Text>
          </View>

          <Text style={[fonts.bold, localStyles.credHeading, { color: colors.ink3 }]}>Credentials & Sample Work</Text>

          <View style={[localStyles.credRow, { backgroundColor: colors.authField }]}>
            <View style={localStyles.credText}>
              <Text style={[fonts.bold, localStyles.credTitle, { color: colors.ink }]}>Credentials Deck</Text>
              <Text style={[fonts.regular, localStyles.credSub, { color: colors.ink3 }]} numberOfLines={1}>
                {hasCredentials ? (thesis.firmCredentialsUrl ? 'Document uploaded' : thesis.credentialsLinkUrl) : 'Not yet uploaded'}
              </Text>
            </View>
            <View
              style={[
                localStyles.credBadge,
                credPublicBadgeStyle(colors, credPublicVisible(thesis, hasCredentials)),
              ]}
            >
              <Text style={[fonts.bold, localStyles.credBadgeText, credPublicBadgeTextStyle(colors, credPublicVisible(thesis, hasCredentials))]}>
                {credPublicVisible(thesis, hasCredentials) ? 'Public' : 'Not yet published'}
              </Text>
            </View>
            {hasCredentials && (
              <Pressable onPress={() => Linking.openURL(credentialsDownloadUrl).catch(() => {})} style={localStyles.credIconButton}>
                <Download size={14} color={colors.ink2} strokeWidth={1.6} />
              </Pressable>
            )}
          </View>

          <View style={[localStyles.credRow, { backgroundColor: colors.authField }]}>
            <View style={localStyles.credText}>
              <Text style={[fonts.bold, localStyles.credTitle, { color: colors.ink }]}>Sample / Redacted Work</Text>
              <Text style={[fonts.regular, localStyles.credSub, { color: colors.ink3 }]} numberOfLines={1}>
                {thesis.redactedWorkUrl ? 'Document uploaded' : 'No sample work uploaded'}
              </Text>
            </View>
            {!!thesis.redactedWorkUrl && (
              <Pressable onPress={() => Linking.openURL(thesis.redactedWorkUrl).catch(() => {})} style={localStyles.credIconButton}>
                <Download size={14} color={colors.ink2} strokeWidth={1.6} />
              </Pressable>
            )}
          </View>

          <PillField label="Differentiation & key strengths">
            {thesis.keyStrengths.length > 0 ? (
              <PillGroup items={thesis.keyStrengths} bg={colors.goldExtraLight} color="#7A5200" />
            ) : (
              <SkeletonPillsRow count={3} />
            )}
          </PillField>

          {!!thesis.differentiationBio.trim() && (
            <View style={[localStyles.bioBox, { backgroundColor: '#FDFAF5', borderLeftColor: colors.gold }]}>
              <Text style={[fonts.regular, localStyles.bioText, { color: colors.ink2 }]}>&ldquo;{thesis.differentiationBio.trim()}&rdquo;</Text>
            </View>
          )}
        </View>
      </RoleThesisSectionCard>

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Interested in {profile.name.split(' ')[0]} as an advisor?</Text>
        <Text style={styles.ctaBody}>
          Their <Text style={{ color: colors.goldLight }}>advisory focus</Text>, <Text style={{ color: colors.goldLight }}>engagement model</Text>,{' '}
          <Text style={{ color: colors.goldLight }}>sector expertise</Text> are all strong signals. Connect to request their resume and discuss fit.
        </Text>
        <Pressable onPress={handleMessage} style={styles.ctaButton}>
          <MessageCircle size={14} color="#fff" strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Send message</Text>
        </Pressable>
      </View>

      <SimilarProfilesRow heading="Similar advisors you may know" profiles={similar} loading={loadingSimilar} onViewProfile={handleViewSimilar} />

      <AdvisorProfileSheet visible={openSheet === 'profile'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <EngagementModelSheet visible={openSheet === 'engagement'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <CoverageDealFitSheet visible={openSheet === 'coverage'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <CommercialsSheet visible={openSheet === 'commercials'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <TrackRecordSheet visible={openSheet === 'track'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
    </View>
  );
}

function credPublicVisible(thesis: AdvisorThesis, hasCredentials: boolean): boolean {
  return thesis.credentialsPublic && hasCredentials;
}
function credPublicBadgeStyle(colors: ReturnType<typeof useTheme>['colors'], visible: boolean) {
  return visible
    ? { backgroundColor: colors.successSurface, borderColor: colors.success }
    : { backgroundColor: colors.goldExtraLight, borderColor: colors.gold };
}
function credPublicBadgeTextStyle(colors: ReturnType<typeof useTheme>['colors'], visible: boolean) {
  return { color: visible ? colors.success : colors.gold };
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

function AdvisorThesisSkeleton() {
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

/** Matches web's real empty-state for Advisor's pill fields — `count` gray skeleton pills (88×28),
 * no trailing "add now" link (unlike Lender's Lending Criteria industry/geo fields, which do have
 * one — confirmed a real, per-role difference, not an omission). */
function SkeletonPillsRow({ count }: { count: number }) {
  const { colors } = useTheme();
  return (
    <View style={localStyles.skeletonPillsRow}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[localStyles.skeletonPill, { backgroundColor: colors.border }]} />
      ))}
    </View>
  );
}

function CommercialTile({ label, value, bordered }: { label: string; value: string; bordered?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.commercialTile, bordered && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.homeCardBorder }]}>
      <Text style={[fonts.bold, localStyles.commercialLabel, { color: colors.ink3 }]}>{label}</Text>
      <View style={[localStyles.commercialBar, { backgroundColor: colors.border }]} />
      <Text style={[value ? fonts.bold : fonts.regular, localStyles.commercialValue, { color: value ? colors.ink : colors.ink3 }]}>{value || '-'}</Text>
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
  skeletonPillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skeletonPill: { width: 88, height: 28, borderRadius: 999 },
  commercialsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  commercialTile: { flexBasis: '50%', paddingVertical: 10, paddingHorizontal: 10, gap: 6 },
  commercialLabel: { fontSize: 9, letterSpacing: 0.4, textTransform: 'uppercase' },
  commercialBar: { width: 18, height: 2, borderRadius: 1 },
  commercialValue: { fontSize: 13 },
  noteBox: { borderRadius: 12, padding: 13 },
  noteText: { fontSize: 12.5, lineHeight: 19, fontStyle: 'italic' },
  dealsTile: { borderRadius: 12, paddingVertical: 16, paddingHorizontal: 16 },
  dealsValue: { fontSize: 34, color: '#fff', lineHeight: 38 },
  dealsCaption: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  credHeading: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  credRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12 },
  credText: { flex: 1, minWidth: 0 },
  credTitle: { fontSize: 12 },
  credSub: { fontSize: 10.5, marginTop: 1 },
  credBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1, flexShrink: 0 },
  credBadgeText: { fontSize: 9.5, letterSpacing: 0.3 },
  credIconButton: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bioBox: { borderLeftWidth: 3, borderRadius: 8, padding: 13 },
  bioText: { fontSize: 12.5, lineHeight: 19, fontStyle: 'italic' },
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
