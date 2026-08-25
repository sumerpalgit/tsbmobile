import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { User, TrendingUp, Briefcase, Target, Calendar, FileText, MessageCircle, ExternalLink, Download } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { useTheme } from '../../../../theme';
import type { AppStackParamList } from '../../../../navigation/types';
import { normalizeLinkedInUrl, type Profile } from '../../../../types/directory';
import {
  fetchOperatorThesis,
  fetchOperatorThesisCompletion,
  fetchSimilarRoleProfiles,
  OperatorThesis,
  RoleThesisCompletion,
} from '../../../../api/roleThesis';
import type { RoleThesisTabHandle } from '../RoleThesisTabHandle';
import { RoleThesisCompleteness } from '../RoleThesisCompleteness';
import { RoleThesisSectionCard } from '../RoleThesisSectionCard';
import { SimilarProfilesRow } from '../SimilarProfilesRow';
import { DocumentPreviewSheet } from '../DocumentPreviewSheet';
import { PillField, PillGroup, formatMoney, formatMoneyRange } from '../ThesisReadPrimitives';
import { OperatorProfileSheet } from './OperatorProfileSheet';
import { OperatingStrengthSheet } from './OperatingStrengthSheet';
import { EngagementFitSheet } from './EngagementFitSheet';
import { DealCompanyFitSheet } from './DealCompanyFitSheet';
import { AvailabilityCommercialSheet } from './AvailabilityCommercialSheet';
import { ProfileMaterialsSheet } from './ProfileMaterialsSheet';

type SheetKey = 'profile' | 'strength' | 'engagement' | 'fit' | 'availability' | 'materials' | null;

/**
 * Operator role's Role Thesis tab — Phase 8, sixth role built. No mockup reference (same situation
 * as every role after Intermediary) — reuses the established house style. Status-badge + CTA
 * architecture (like Lender/Searcher/Intermediary/Advisor), NOT Investor's always-edit mode — every
 * one of Operator's 6 cards receives explicit `complete`/`incomplete`. Per-card `complete` is
 * computed 100% client-side (exact formulas quoted at each card below), matching the project-wide
 * convention; `fetchOperatorThesisCompletion()` only drives the top completeness bar.
 *
 * Data source is a dedicated GET (`GET /auth/operator`), same shape as Intermediary/Investor/
 * Lender/Advisor. See `OperatorThesis`'s own doc comment (`api/roleThesis.ts`) for the LinkedIn
 * cross-cutting save quirk handled inside `ProfileMaterialsSheet`.
 */
export const OperatorThesisTab = forwardRef<RoleThesisTabHandle, { profile: Profile }>(function OperatorThesisTabImpl({ profile }, ref) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState<OperatorThesis | null>(null);
  const [completion, setCompletion] = useState<RoleThesisCompletion | null>(null);
  const [similar, setSimilar] = useState<Profile[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);
  const [previewingDoc, setPreviewingDoc] = useState<'resume' | 'coverLetter' | null>(null);

  useEffect(() => {
    Promise.all([fetchOperatorThesis(), fetchOperatorThesisCompletion()])
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
    fetchSimilarRoleProfiles(profileId, profile.role_type ?? 'Operator')
      .then(setSimilar)
      .finally(() => setLoadingSimilar(false));
  }, [thesis?.profileId, profile.role_type]);

  const refreshCompletion = () => {
    fetchOperatorThesisCompletion().then(setCompletion);
  };

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      const [t, c] = await Promise.all([fetchOperatorThesis(), fetchOperatorThesisCompletion()]);
      setThesis(t);
      setCompletion(c);
      if (t.profileId) {
        setSimilar(await fetchSimilarRoleProfiles(t.profileId, profile.role_type ?? 'Operator'));
      }
    },
  }), [profile.role_type]);

  const handleSaved = (patch: Partial<OperatorThesis>) => {
    setThesis(prev => (prev ? { ...prev, ...patch } : prev));
    refreshCompletion();
  };

  const handleMessage = () => {
    navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'Messages' } });
  };

  const handleViewSimilar = (p: Profile) => {
    navigation.navigate('MemberProfile', { profile: p, initialSaved: false });
  };

  const handleOpenLinkedIn = () => {
    if (!profile.linkedin_url) return;
    Linking.openURL(normalizeLinkedInUrl(profile.linkedin_url)).catch(() =>
      Toast.show({ type: 'error', text1: 'Could not open LinkedIn link' }),
    );
  };

  /** Real save-to-device — same implementation as Investor's/Lender's identical Download button,
   * parametrized by URL since this card has two documents (resume, cover letter) not one. */
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

  if (loading || !thesis) {
    return <OperatorThesisSkeleton />;
  }

  const profileComplete = !!(thesis.currentDesignation || thesis.totalExperience || thesis.functionalStrengths.length);
  const strengthComplete = !!(thesis.transactionExperience.length || thesis.leadershipExperience.length);
  const engagementComplete = !!(thesis.engagementType.length && thesis.workMode.length);
  const fitComplete = !!(thesis.industryInterests.length && thesis.geographyFocus.length);
  const availabilityComplete = !!(thesis.startDatePreference && thesis.timeCommitment);
  const materialsComplete = !!(thesis.resumeUrl || thesis.coverLetterUrl || thesis.professionalStatement);

  // The TOP completeness bar is a genuinely separate data source from each card's own badge —
  // confirmed by reading web's real `ProfileCompleteness` (`thesis-shared.tsx:290-314`) directly:
  // it renders `completion?.sections` from the SERVER verbatim, completely independent of each
  // card's own client-side `complete` expression above.
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
        label="Operator Profile"
        icon={<User size={17} strokeWidth={1.6} />}
        title="Operator profile"
        description="Your operating role and areas of expertise"
        complete={profileComplete}
        onEdit={() => setOpenSheet('profile')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Current Designation">
                {thesis.currentDesignation ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.currentDesignation}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not set</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Years of Experience">
                {thesis.totalExperience ? (
                  <Text style={[fonts.semibold, styles.plainValue, { color: colors.ink }]}>{thesis.totalExperience}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not set</Text>
                )}
              </PillField>
            </View>
          </View>

          <PillField label="Functional Strengths">
            <PillGroup items={thesis.functionalStrengths} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
          </PillField>

          {!!(thesis.revenueManaged || thesis.teamSizeManaged) && (
            <View style={styles.fieldsRow}>
              {!!thesis.revenueManaged && (
                <View style={styles.fieldsCol}>
                  <StatCard label="Revenue Managed" value={formatMoney(thesis.revenueManaged)} />
                </View>
              )}
              {!!thesis.teamSizeManaged && (
                <View style={styles.fieldsCol}>
                  <StatCard label="Team Size" value={`${thesis.teamSizeManaged} people`} />
                </View>
              )}
            </View>
          )}
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Operating Strength & Experience"
        icon={<TrendingUp size={17} strokeWidth={1.6} />}
        title="Operating strength & experience"
        description="Outcomes, transactions and ownership background"
        complete={strengthComplete}
        onEdit={() => setOpenSheet('strength')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <PillField label="Key Outcomes Delivered">
            {thesis.keyOutcomesDelivered.trim() ? (
              <View style={[localStyles.bioBox, { backgroundColor: '#FDFAF5', borderLeftColor: colors.gold }]}>
                <Text style={[fonts.regular, localStyles.bioText, { color: colors.ink2 }]}>&ldquo;{thesis.keyOutcomesDelivered.trim()}&rdquo;</Text>
              </View>
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not set</Text>
            )}
          </PillField>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Transaction Experience">
                <PillGroup items={thesis.transactionExperience} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Ownership Experience">
                <PillGroup items={thesis.leadershipExperience} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
              </PillField>
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Engagement Fit"
        icon={<Briefcase size={17} strokeWidth={1.6} />}
        title="Engagement fit"
        description="How and when you prefer to work"
        complete={engagementComplete}
        onEdit={() => setOpenSheet('engagement')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <PillField label="Type of Role">
            <PillGroup items={thesis.engagementType} bg={colors.goldExtraLight} color="#7A5200" emptyText="Not set" />
          </PillField>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Engagement Preference">
                <PillGroup items={thesis.workMode} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Stage Value-Add">
                <PillGroup items={thesis.dealStagePreference} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
              </PillField>
            </View>
          </View>

          <PillField label="Duration Preference">
            <PillGroup items={thesis.startRoleWith} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Deal & Company Fit"
        icon={<Target size={17} strokeWidth={1.6} />}
        title="Deal & company fit"
        description="Industries, geographies and company profiles you target"
        complete={fitComplete}
        onEdit={() => setOpenSheet('fit')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Industry Focus">
                <PillGroup items={thesis.industryInterests} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Geography Focus">
                <PillGroup items={thesis.geographyFocus} bg="#D0DBE5" color={colors.ink} emptyText="Not set" />
              </PillField>
            </View>
          </View>

          {!!(thesis.revenueRangeMin || thesis.revenueRangeMax || thesis.employeeCountMin || thesis.employeeCountMax) && (
            <View style={styles.fieldsRow}>
              {!!(thesis.revenueRangeMin || thesis.revenueRangeMax) && (
                <View style={styles.fieldsCol}>
                  <StatCard label="Revenue Range" value={formatMoneyRange(thesis.revenueRangeMin, thesis.revenueRangeMax) ?? '—'} />
                </View>
              )}
              {!!(thesis.employeeCountMin || thesis.employeeCountMax) && (
                <View style={styles.fieldsCol}>
                  <StatCard label="Employee Count" value={`${thesis.employeeCountMin || '—'} – ${thesis.employeeCountMax || '—'}`} />
                </View>
              )}
            </View>
          )}
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Availability & Commercial Preferences"
        icon={<Calendar size={17} strokeWidth={1.6} />}
        title="Availability & commercial preferences"
        description="Time, location and compensation"
        complete={availabilityComplete}
        onEdit={() => setOpenSheet('availability')}
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <TimeCommitmentTile value={thesis.timeCommitment} />
            </View>
            <View style={styles.fieldsCol}>
              <StartDateTile value={thesis.startDatePreference} />
            </View>
          </View>

          <PillField label="Compensation Preferences">
            <PillGroup items={thesis.compensationPreference} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
          </PillField>

          <PillField label="Relocation">
            <PillGroup items={thesis.relocationPreference} bg={colors.borderSoft} color={colors.ink2} emptyText="Not set" />
          </PillField>

          <PillField label="Equity Participation">
            <PillGroup items={thesis.equityAppetite} bg="#F0FDF4" color="#16A34A" emptyText="Not set" />
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Profile & Supporting Materials"
        icon={<FileText size={17} strokeWidth={1.6} />}
        title="Profile & supporting materials"
        description="Documents and links that support your profile"
        complete={materialsComplete}
        onEdit={() => setOpenSheet('materials')}
        iconBg={colors.hero1}
        iconColor="#fff"
      >
        <View style={styles.fieldsWrap}>
          {thesis.resumeUrl ? (
            <MaterialDocCard
              label="RESUME / CV"
              url={thesis.resumeUrl}
              onPreview={() => setPreviewingDoc('resume')}
              onDownload={() => handleDownloadDoc(thesis.resumeUrl)}
            />
          ) : (
            <PillField label="RESUME / CV">
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not uploaded</Text>
            </PillField>
          )}

          {thesis.coverLetterUrl ? (
            <MaterialDocCard
              label="COVER LETTER"
              url={thesis.coverLetterUrl}
              onPreview={() => setPreviewingDoc('coverLetter')}
              onDownload={() => handleDownloadDoc(thesis.coverLetterUrl)}
            />
          ) : (
            <PillField label="COVER LETTER">
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not uploaded</Text>
            </PillField>
          )}

          <PillField label="LinkedIn">
            {profile.linkedin_url ? (
              <Pressable onPress={handleOpenLinkedIn}>
                <Text style={[fonts.medium, styles.plainValue, { color: colors.gold }]} numberOfLines={1}>
                  {profile.linkedin_url.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
                </Text>
              </Pressable>
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not set</Text>
            )}
          </PillField>

          <PillField label="Professional Statement">
            {thesis.professionalStatement.trim() ? (
              <View style={[localStyles.bioBox, { backgroundColor: '#FDFAF5', borderLeftColor: colors.gold }]}>
                <Text style={[fonts.regular, localStyles.bioText, { color: colors.ink2 }]}>&ldquo;{thesis.professionalStatement.trim()}&rdquo;</Text>
              </View>
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not set</Text>
            )}
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Interested in {profile.name.split(' ')[0]} as an operator?</Text>
        <Text style={styles.ctaBody}>
          Their <Text style={{ color: colors.goldLight }}>operating experience</Text>, <Text style={{ color: colors.goldLight }}>leadership track record</Text>,{' '}
          <Text style={{ color: colors.goldLight }}>deal fit</Text> are all strong signals. Connect to request their resume and discuss fit.
        </Text>
        <Pressable onPress={handleMessage} style={styles.ctaButton}>
          <MessageCircle size={14} color="#fff" strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Send message</Text>
        </Pressable>
      </View>

      <SimilarProfilesRow heading="Similar operators you may know" profiles={similar} loading={loadingSimilar} onViewProfile={handleViewSimilar} />

      <OperatorProfileSheet visible={openSheet === 'profile'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <OperatingStrengthSheet visible={openSheet === 'strength'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <EngagementFitSheet visible={openSheet === 'engagement'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <DealCompanyFitSheet visible={openSheet === 'fit'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <AvailabilityCommercialSheet visible={openSheet === 'availability'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <ProfileMaterialsSheet visible={openSheet === 'materials'} thesis={thesis} profile={profile} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />

      <DocumentPreviewSheet
        visible={previewingDoc !== null}
        url={previewingDoc === 'resume' ? thesis.resumeUrl : thesis.coverLetterUrl}
        title={previewingDoc === 'resume' ? 'Resume / CV' : 'Cover Letter'}
        onClose={() => setPreviewingDoc(null)}
      />
    </View>
  );
});

/** Cream stat tile — matches web's real `bg-[var(--tsb-cream)]` card for Revenue Range/Employee
 * Count (`OperatorThesisTab.tsx:737-752`): a small uppercase gray label + a bold display-font
 * value, no caption line (distinct from Lender's 3-line `CreamTile`). */
function StatCard({ label, value }: { label: string; value: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.statCard, { backgroundColor: colors.cream }]}>
      <Text style={[fonts.bold, localStyles.statCardLabel, { color: colors.ink3 }]}>{label}</Text>
      <Text style={[fonts.display, localStyles.statCardValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

/** Time Commitment tile — matches web's real value-first dark tile exactly
 * (`OperatorThesisTab.tsx:842-847`): big bold value on top, plain small caption below, `hero1` bg
 * (web's `--tsb-accent-solid`), unlike every other stat tile in this file which is label-first. */
function TimeCommitmentTile({ value }: { value: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.darkTile, { backgroundColor: colors.hero1 }]}>
      <Text style={[fonts.display, localStyles.darkTileValue]}>{value || '—'}</Text>
      <Text style={[fonts.regular, localStyles.darkTileCaption, { color: colors.ink3 }]}>Time commitment</Text>
    </View>
  );
}

/** Start Date tile — matches web's real cream/bordered tile exactly (`OperatorThesisTab.tsx:800-801,
 * 848-856`): uppercase gold label first, then the value — shortened to "Immediately" and with a
 * green "available now" caption when the preference contains "immediate" (web's own `isImmediate`
 * check), matching web's exact copy rather than showing the raw option string in that case. */
function StartDateTile({ value }: { value: string }) {
  const { colors, fonts } = useTheme();
  const isImmediate = value.toLowerCase().includes('immediate');
  const display = isImmediate ? 'Immediately' : value;
  return (
    <View style={[localStyles.creamBorderedTile, { backgroundColor: colors.cream, borderColor: colors.border }]}>
      <Text style={[fonts.semibold, localStyles.creamTileLabel, { color: colors.gold }]}>START DATE</Text>
      <Text style={[fonts.display, localStyles.creamTileValue, { color: colors.ink }]}>{display || '—'}</Text>
      {isImmediate && <Text style={[fonts.regular, localStyles.creamTileCaption, { color: '#16A34A' }]}>available now</Text>}
    </View>
  );
}

/** Uploaded-document card — matches web's real gold `DocCard` exactly (`OperatorThesisTab.tsx:
 * 913-965`): gold-tinted card with a gold border, a dark navy icon box, the real filename (derived
 * from the URL, same as web's own `filename` derivation) in a dark gold-brown, a "PDF"/"Document"
 * subtitle, and a gold download action — extended with a preview action too (`ExternalLink`),
 * matching this app's own established real document-handling convention elsewhere in Role Thesis
 * (Investor's/Lender's identical preview+download pair) rather than web's download-only button,
 * since in-app preview is real, valuable functionality on mobile that a browser doesn't need. */
function MaterialDocCard({
  label,
  url,
  onPreview,
  onDownload,
}: {
  label: string;
  url: string;
  onPreview: () => void;
  onDownload: () => void;
}) {
  const { colors, fonts } = useTheme();
  const filename = (() => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1].split('?')[0]) || label;
    } catch {
      return label;
    }
  })();
  const isPdf = filename.toLowerCase().endsWith('.pdf');

  return (
    <View>
      <Text style={[fonts.bold, localStyles.docCardLabel, { color: colors.ink3 }]}>{label}</Text>
      <View style={[localStyles.docCard, { backgroundColor: colors.goldExtraLight, borderColor: '#E8C96A' }]}>
        <View style={[localStyles.docCardIconBox, { backgroundColor: colors.hero1 }]}>
          <FileText size={15} color="#fff" strokeWidth={1.6} />
        </View>
        <View style={localStyles.docCardText}>
          <Text style={[fonts.semibold, localStyles.docCardFilename, { color: '#7A6020' }]} numberOfLines={1}>{filename}</Text>
          <Text style={[fonts.regular, localStyles.docCardType, { color: colors.gold }]}>{isPdf ? 'PDF' : 'Document'}</Text>
        </View>
        <Pressable onPress={onPreview} style={localStyles.docCardIconButton}>
          <ExternalLink size={16} color={colors.gold} strokeWidth={1.6} />
        </Pressable>
        <Pressable onPress={onDownload} style={localStyles.docCardIconButton}>
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

function OperatorThesisSkeleton() {
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
  statCard: { flex: 1, minWidth: 0, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16 },
  statCardLabel: { fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  statCardValue: { fontSize: 16 },
  darkTile: { flex: 1, minWidth: 0, minHeight: 90, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, justifyContent: 'center' },
  darkTileValue: { fontSize: 20, color: '#fff', lineHeight: 24 },
  darkTileCaption: { fontSize: 12, marginTop: 6 },
  creamBorderedTile: { flex: 1, minWidth: 0, minHeight: 90, borderRadius: 12, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 16, justifyContent: 'center' },
  creamTileLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  creamTileValue: { fontSize: 20, lineHeight: 24 },
  creamTileCaption: { fontSize: 12, marginTop: 6 },
  bioBox: { borderLeftWidth: 3, borderRadius: 8, padding: 13 },
  bioText: { fontSize: 12.5, lineHeight: 19, fontStyle: 'italic' },
  docCardLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  docCardIconBox: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docCardText: { flex: 1, minWidth: 0 },
  docCardFilename: { fontSize: 12 },
  docCardType: { fontSize: 11, marginTop: 1 },
  docCardIconButton: { flexShrink: 0, padding: 2 },
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
