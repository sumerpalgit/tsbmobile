import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  GraduationCap, AlignLeft, Plus, Clock, Circle, FileText, Info, UserRound, MessageSquare, Download,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { useTheme } from '../../../../theme';
import type { AppStackParamList } from '../../../../navigation/types';
import { normalizeLinkedInUrl, type Profile } from '../../../../types/directory';
import {
  fetchStudentThesis,
  fetchSimilarRoleProfiles,
  calcStudentThesisCompletion,
  StudentThesis,
} from '../../../../api/roleThesis';
import type { RoleThesisTabHandle } from '../RoleThesisTabHandle';
import { RoleThesisCompleteness } from '../RoleThesisCompleteness';
import { RoleThesisSectionCard } from '../RoleThesisSectionCard';
import { SimilarProfilesRow } from '../SimilarProfilesRow';
import { PillField } from '../ThesisReadPrimitives';
import { LearningCareerSheet } from './LearningCareerSheet';
import { SkillsCapabilitiesSheet } from './SkillsCapabilitiesSheet';
import { EngagementPreferencesSheet } from './EngagementPreferencesSheet';
import { AvailabilityLogisticsSheet } from './AvailabilityLogisticsSheet';
import { InterestFitSheet } from './InterestFitSheet';
import { SupportingMaterialsSheet } from './SupportingMaterialsSheet';

type SheetKey = 'learning' | 'skills' | 'engagement' | 'availability' | 'interest' | 'materials' | null;

/**
 * Student role's Role Thesis tab (`role_type === 'student'`) — the LAST of the 8 roles for View
 * Profile's Phase 8. Straight, correctly-named import on web (`StudentThesisTab.tsx`) — no
 * filename/import-swap quirk like Intermediary/Business Owner. Same "no server completion
 * endpoint" architecture as Business Owner — `calcStudentThesisCompletion` is a pure function
 * computed from `thesis` on every render, matching web's own local `calcLocalCompletion`, not a
 * fetch. See `StudentThesis`'s own doc comment (`api/roleThesis.ts`) for the GET/PUT field-name
 * mapping table this role's API layer handles internally.
 *
 * Cards 3 (Engagement Preferences), 4 (Availability & Logistics), and 5 (Interest & Fit) pass
 * `alwaysShowCta` — web's own `SectionFooter` on those 3 cards is unconditional (not gated behind
 * `{!hasData &&}` like every other card built so far), so the "Complete this section" row shows
 * even when the card is already complete (alongside the edit pencil).
 *
 * Card 6 (Supporting Materials) passes `extraBadge` — web's `statusBadge` prop shows a "Not yet
 * shared" pill ALONGSIDE the normal Complete/Incomplete badge (not instead of it) whenever neither
 * a resume nor a cover letter has been uploaded, even if a LinkedIn link alone makes the card
 * "complete". Its read-mode body is also genuinely two different layouts depending on
 * `hasDocuments`, not just an empty/filled toggle on the same shape — see `SupportingMaterialsBody`.
 */
export const StudentThesisTab = forwardRef<RoleThesisTabHandle, { profile: Profile }>(function StudentThesisTabImpl({ profile }, ref) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [thesis, setThesis] = useState<StudentThesis | null>(null);
  const [similar, setSimilar] = useState<Profile[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [openSheet, setOpenSheet] = useState<SheetKey>(null);

  useEffect(() => {
    fetchStudentThesis()
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
    fetchSimilarRoleProfiles(profileId, profile.role_type ?? 'Student')
      .then(setSimilar)
      .finally(() => setLoadingSimilar(false));
  }, [thesis?.profileId, profile.role_type]);

  useImperativeHandle(ref, () => ({
    refresh: async () => {
      const t = await fetchStudentThesis();
      setThesis(t);
      if (t.profileId) {
        setSimilar(await fetchSimilarRoleProfiles(t.profileId, profile.role_type ?? 'Student'));
      }
    },
  }), [profile.role_type]);

  const handleSaved = (patch: Partial<StudentThesis>) => {
    setThesis(prev => (prev ? { ...prev, ...patch } : prev));
  };

  const handleMessage = () => {
    navigation.navigate('Drawer', { screen: 'Tabs', params: { screen: 'Messages' } });
  };

  const handleViewSimilar = (p: Profile) => {
    navigation.navigate('MemberProfile', { profile: p, initialSaved: false });
  };

  const handleOpenLinkedIn = (url: string) => {
    Linking.openURL(normalizeLinkedInUrl(url)).catch(() =>
      Toast.show({ type: 'error', text1: 'Could not open LinkedIn link' }),
    );
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

  const completion = useMemo(() => (thesis ? calcStudentThesisCompletion(thesis) : null), [thesis]);

  if (loading || !thesis || !completion) {
    return <StudentThesisSkeleton />;
  }

  const learningComplete = !!(thesis.academicStage || thesis.primaryInterest || thesis.lookingFor.length);
  const skillsComplete = !!(thesis.coreSkills.length || thesis.tools.length || thesis.experienceLevel || thesis.workInterestedIn.length);
  const engagementComplete = !!(thesis.preferredMode.length || thesis.duration || thesis.compensation);
  const availabilityComplete = !!(thesis.timeCommitment.length || thesis.startDate);
  const interestComplete = !!(thesis.industryFocus.length || thesis.geographyFocus.length);
  const hasDocuments = !!(thesis.resumeUrl || thesis.coverLetterUrl);
  // Matches web's real `SupportingMaterialsCard`: its `linkedinUrl` state initializes from
  // `data.linkedinUrl || profile?.linkedin_url || ""` — falling back to the GENERAL profile's
  // LinkedIn URL when the student-specific field was never explicitly saved — and `hasData` is
  // computed off THAT fallback-resolved value, not the raw student field alone. Without this, a
  // profile with a general LinkedIn URL already set (but never re-saved through this sheet) shows
  // "Complete this section" here when web already shows the edit pencil.
  const effectiveLinkedinUrl = thesis.linkedinUrl || profile.linkedin_url || '';
  const materialsComplete = !!(thesis.resumeUrl || thesis.coverLetterUrl || effectiveLinkedinUrl);

  const topBarSections = completion.sections.map(s => ({ label: s.label, complete: s.complete }));
  const doneCount = topBarSections.filter(s => s.complete).length;
  const firstName = profile.name.split(' ')[0] || 'them';

  return (
    <View style={styles.container}>
      <RoleThesisCompleteness
        percentage={completion.percentage}
        doneCount={doneCount}
        totalCount={topBarSections.length}
        sections={topBarSections}
      />

      <RoleThesisSectionCard
        label="Learning & Career Intent"
        icon={<GraduationCap size={17} strokeWidth={1.6} />}
        title="Learning & career intent"
        description="Where they are and what they want"
        complete={learningComplete}
        onEdit={() => setOpenSheet('learning')}
        ctaHelperText="Tell searchers what you're looking for"
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Academic Stage">
                {thesis.academicStage ? (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink }]}>{thesis.academicStage}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Primary Interest">
                {thesis.primaryInterest ? (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink }]}>{thesis.primaryInterest}</Text>
                ) : (
                  <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
                )}
              </PillField>
            </View>
          </View>

          <PillField label="Looking For">
            {thesis.lookingFor.length > 0 ? (
              <View style={localStyles.pillRow}>{thesis.lookingFor.map(l => <GoldPill key={l} label={l} />)}</View>
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
            )}
          </PillField>

          <PillField label="Work Interested In">
            {thesis.workInterestedIn.length > 0 ? (
              <View style={localStyles.pillRow}>{thesis.workInterestedIn.map(w => <GoldPill key={w} label={w} />)}</View>
            ) : (
              <Text style={[fonts.regular, styles.plainValue, { color: colors.ink3 }]}>Not specified</Text>
            )}
          </PillField>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Skills & Capabilities"
        icon={<AlignLeft size={17} strokeWidth={1.6} />}
        title="Skills & capabilities"
        description="What they can do and tools they know"
        complete={skillsComplete}
        onEdit={() => setOpenSheet('skills')}
        ctaHelperText="Searchers look for specific skills before reaching out"
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={localStyles.stackedWrap}>
          <View style={[localStyles.stackedSection, { borderBottomColor: colors.borderSoft }]}>
            <Text style={[fonts.bold, localStyles.stackedLabel, { color: colors.ink2 }]}>Core Skills</Text>
            {thesis.coreSkills.length > 0 ? (
              <View style={localStyles.pillRow}>{thesis.coreSkills.map(s => <SkillTagPill key={s} label={s} />)}</View>
            ) : (
              <View>
                <SkeletonPillsRow count={3} />
                <AddNowLine text="No skills selected" onPress={() => setOpenSheet('skills')} />
              </View>
            )}
          </View>

          <View style={[localStyles.stackedSection, { borderBottomColor: colors.borderSoft }]}>
            <Text style={[fonts.bold, localStyles.stackedLabel, { color: colors.ink2 }]}>Tools</Text>
            {thesis.tools.length > 0 ? (
              <View style={localStyles.pillRow}>{thesis.tools.map(t => <SkillTagPill key={t} label={t} />)}</View>
            ) : (
              <View>
                <SkeletonPillsRow count={2} />
                <AddNowLine text="No tools selected" onPress={() => setOpenSheet('skills')} />
              </View>
            )}
          </View>

          <View style={[localStyles.stackedSection, { borderBottomColor: colors.borderSoft }]}>
            <Text style={[fonts.bold, localStyles.stackedLabel, { color: colors.ink2 }]}>Experience Level</Text>
            {thesis.experienceLevel ? (
              <Text style={[fonts.semibold, localStyles.stackedValue, { color: colors.ink }]}>{thesis.experienceLevel}</Text>
            ) : (
              <AddNowLine text="Not specified" onPress={() => setOpenSheet('skills')} />
            )}
          </View>

          <View style={localStyles.stackedSectionLast}>
            <Text style={[fonts.bold, localStyles.stackedLabel, { color: colors.ink2 }]}>About</Text>
            {thesis.aboutYou ? (
              <View style={[localStyles.bioBox, { backgroundColor: '#FDFCF7', borderLeftColor: colors.gold }]}>
                <Text style={[fonts.regular, localStyles.bioText, { color: colors.ink2 }]}>&ldquo;{thesis.aboutYou}&rdquo;</Text>
              </View>
            ) : (
              <AddNowLine text="Not added" onPress={() => setOpenSheet('skills')} />
            )}
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Engagement Preferences"
        icon={<Plus size={17} strokeWidth={1.6} />}
        title="Engagement preferences"
        description="How they prefer to work"
        complete={engagementComplete}
        onEdit={() => setOpenSheet('engagement')}
        ctaHelperText="Help searchers understand your working preferences"
        alwaysShowCta
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <PillField label="Preferred Mode">
            {thesis.preferredMode.length > 0 ? (
              <View style={localStyles.pillRow}>{thesis.preferredMode.map(m => <GoldPill key={m} label={m} />)}</View>
            ) : (
              <View>
                <SkeletonPillsRow count={1} />
                <AddNowLine text="Not specified" onPress={() => setOpenSheet('engagement')} />
              </View>
            )}
          </PillField>

          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Duration Preference">
                {thesis.duration ? (
                  <GoldPill label={thesis.duration} />
                ) : (
                  <AddNowLine text="Not specified" onPress={() => setOpenSheet('engagement')} />
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Compensation">
                {thesis.compensation ? (
                  <GoldPill label={thesis.compensation} />
                ) : (
                  <AddNowLine text="Not specified" onPress={() => setOpenSheet('engagement')} />
                )}
              </PillField>
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Availability & Logistics"
        icon={<Clock size={17} strokeWidth={1.6} />}
        title="Availability & logistics"
        description="Time commitment and start date"
        complete={availabilityComplete}
        onEdit={() => setOpenSheet('availability')}
        ctaHelperText="Availability signals help searchers plan around you"
        alwaysShowCta
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Time Commitment">
                {thesis.timeCommitment.length > 0 ? (
                  <View style={localStyles.pillRow}>{thesis.timeCommitment.map(c => <TimeCommitmentPill key={c} label={c} />)}</View>
                ) : (
                  <View>
                    <SkeletonPillsRow count={2} />
                    <Text style={[fonts.regular, localStyles.plainSmall, { color: colors.ink3 }]}>Not specified</Text>
                  </View>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              {thesis.startDate ? (
                <StartDateCard value={thesis.startDate} />
              ) : (
                <PillField label="Start Date">
                  <AddNowLine text="Not specified" onPress={() => setOpenSheet('availability')} />
                </PillField>
              )}
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Interest & Fit"
        icon={<Circle size={17} strokeWidth={1.6} />}
        title="Interest & fit"
        description="Industries and geographies"
        complete={interestComplete}
        onEdit={() => setOpenSheet('interest')}
        ctaHelperText="Helps searchers match you to the right deals"
        alwaysShowCta
        iconBg={colors.chip}
        iconColor={colors.goldDark}
      >
        <View style={styles.fieldsWrap}>
          <View style={styles.fieldsRow}>
            <View style={styles.fieldsCol}>
              <PillField label="Industry Focus">
                {thesis.industryFocus.length > 0 ? (
                  <View style={localStyles.pillRow}>{thesis.industryFocus.map(i => <OutlinePill key={i} label={i} />)}</View>
                ) : (
                  <View>
                    <SkeletonPillsRow count={2} />
                    <AddNowLine text="Not specified" onPress={() => setOpenSheet('interest')} />
                  </View>
                )}
              </PillField>
            </View>
            <View style={styles.fieldsCol}>
              <PillField label="Geography Focus">
                {thesis.geographyFocus.length > 0 ? (
                  <View style={localStyles.pillRow}>{thesis.geographyFocus.map(g => <OutlinePill key={g} label={g} />)}</View>
                ) : (
                  <View>
                    <SkeletonPillsRow count={2} />
                    <AddNowLine text="Not specified" onPress={() => setOpenSheet('interest')} />
                  </View>
                )}
              </PillField>
            </View>
          </View>
        </View>
      </RoleThesisSectionCard>

      <RoleThesisSectionCard
        label="Supporting Materials"
        icon={<FileText size={17} strokeWidth={1.6} />}
        title="Supporting materials"
        description="Resume, cover letter and links"
        complete={materialsComplete}
        onEdit={() => setOpenSheet('materials')}
        iconBg={colors.hero1}
        iconColor="#fff"
        extraBadge={!hasDocuments ? <NotYetSharedBadge /> : undefined}
      >
        <SupportingMaterialsBody
          thesis={thesis}
          linkedinUrl={effectiveLinkedinUrl}
          hasDocuments={hasDocuments}
          firstName={firstName}
          onEdit={() => setOpenSheet('materials')}
          onOpenLinkedIn={handleOpenLinkedIn}
          onDownload={handleDownloadDoc}
          onMessage={handleMessage}
        />
      </RoleThesisSectionCard>

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Interested in {firstName} for your search?</Text>
        <Text style={styles.ctaBody}>
          Their <Text style={{ color: colors.goldLight }}>skills</Text>, <Text style={{ color: colors.goldLight }}>availability</Text>,{' '}
          <Text style={{ color: colors.goldLight }}>interests</Text> are all strong signals. Connect to request their resume and discuss fit.
        </Text>
        <Pressable onPress={handleMessage} style={styles.ctaButton}>
          <MessageSquare size={14} color="#fff" strokeWidth={1.6} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Send message</Text>
        </Pressable>
      </View>

      <SimilarProfilesRow heading="Similar students you may know" profiles={similar} loading={loadingSimilar} onViewProfile={handleViewSimilar} />

      <LearningCareerSheet visible={openSheet === 'learning'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <SkillsCapabilitiesSheet visible={openSheet === 'skills'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <EngagementPreferencesSheet visible={openSheet === 'engagement'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <AvailabilityLogisticsSheet visible={openSheet === 'availability'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <InterestFitSheet visible={openSheet === 'interest'} thesis={thesis} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
      <SupportingMaterialsSheet visible={openSheet === 'materials'} thesis={thesis} profile={profile} onClose={() => setOpenSheet(null)} onSaved={handleSaved} />
    </View>
  );
});

/** Gold pill — matches web's real `GoldPill` (`StudentThesisTab.tsx:133-135`). */
function GoldPill({ label }: { label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.pill, { backgroundColor: colors.goldExtraLight, alignSelf: 'flex-start' }]}>
      <Text style={[fonts.medium, localStyles.pillText, { color: '#7A5200' }]}>{label}</Text>
    </View>
  );
}

/** Outlined pill — matches web's real `OutlinePill` (lines 142-144), reused for Industry/Geography
 * Focus on this role (unlike Business Owner, which uses this same shape only for Post-Transaction
 * Involvement). */
function OutlinePill({ label }: { label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.pill, { backgroundColor: colors.surface, borderWidth: 1, borderColor: '#C8D0D8' }]}>
      <Text style={[fonts.medium, localStyles.pillText, { color: colors.ink2 }]}>{label}</Text>
    </View>
  );
}

/** Warm-beige plain pill — matches web's real `SkillTagPill` (lines 145-147), a color not used by
 * any prior role (`#EDE8E0`, no existing theme token matches it). */
function SkillTagPill({ label }: { label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.pill, { backgroundColor: '#EDE8E0' }]}>
      <Text style={[fonts.medium, localStyles.pillText, { color: colors.ink2 }]}>{label}</Text>
    </View>
  );
}

/** Cream/gold pill with a leading gold dot — matches web's real `TimeCommitmentPill`
 * (lines 148-155): distinct from `GoldPill` (different bg, bordered, has a dot). */
function TimeCommitmentPill({ label }: { label: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.pill, localStyles.dotPill, { backgroundColor: '#FEF9EC', borderWidth: 1, borderColor: colors.border }]}>
      <View style={[localStyles.dot, { backgroundColor: colors.gold }]} />
      <Text style={[fonts.medium, localStyles.pillText, { color: '#7A5200' }]}>{label}</Text>
    </View>
  );
}

/** Small stat card — matches web's real `StartDateCard` (lines 156-162): simpler than Business
 * Owner's `MetricBox`/`SingleMetricBox`, no note/sub-line, just label + value. */
function StartDateCard({ value }: { value: string }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.startDateCard, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
      <Text style={[fonts.bold, localStyles.startDateLabel, { color: colors.ink3 }]}>START DATE</Text>
      <Text style={[fonts.display, localStyles.startDateValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

/** Small gold "Not yet shared" badge — matches web's real `NotYetSharedBadge` (lines 164-170),
 * rendered ALONGSIDE (not instead of) the normal Complete/Incomplete badge via `extraBadge`. */
function NotYetSharedBadge() {
  const { colors, fonts } = useTheme();
  return (
    <View style={[localStyles.notYetSharedBadge, { backgroundColor: colors.goldExtraLight, borderColor: colors.border }]}>
      <Text style={[fonts.semibold, localStyles.notYetSharedText, { color: colors.goldDark }]} numberOfLines={1}>Not yet shared</Text>
    </View>
  );
}

/** Gray skeleton pill row — matches web's real `SkeletonPill` (`thesis-shared.tsx`) reused directly
 * by Student's own empty states (Core Skills/Tools/Preferred Mode/Time Commitment/Industry/
 * Geography Focus) — a genuinely different real behavior from Operator's role, which was corrected
 * away from skeleton pills earlier this session because Operator's OWN web source never uses them;
 * Student's web source does, confirmed directly from `StudentThesisTab.tsx`'s own JSX. Static, not
 * animated (matches this app's established convention for this exact pill shape elsewhere). */
function SkeletonPillsRow({ count }: { count: number }) {
  const { colors } = useTheme();
  return (
    <View style={localStyles.pillRow}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[localStyles.skeletonPill, { backgroundColor: colors.border }]} />
      ))}
    </View>
  );
}

/** Inline "{text} — add now" link — matches web's real `AddNowBtn` pattern (the link sits INSIDE
 * the paragraph right after the em dash, not up by the field label — `PillField`'s own `action`
 * prop renders next to the label instead, which is a different position web doesn't use here). */
function AddNowLine({ text, onPress, actionLabel = 'add now' }: { text: string; onPress: () => void; actionLabel?: string }) {
  const { colors, fonts } = useTheme();
  return (
    <Text style={[fonts.regular, localStyles.plainSmall, { color: colors.ink3 }]}>
      {text} — <Text onPress={onPress} style={[fonts.semibold, { color: colors.gold }]}>{actionLabel}</Text>
    </Text>
  );
}

/** Uploaded-document card — same gold/navy shape Operator's `MaterialDocCard` established, reused
 * here for Resume/Cover Letter with this role's own "PDF · Uploaded" subtitle text. */
function DocCard({ label, url, onDownload }: { label: string; url: string; onDownload: () => void }) {
  const { colors, fonts } = useTheme();
  const filename = (() => {
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1].split('?')[0]) || label;
    } catch {
      return label;
    }
  })();
  return (
    <View>
      <Text style={[fonts.bold, localStyles.docCardLabel, { color: colors.ink2 }]}>{label}</Text>
      <View style={[localStyles.docCard, { backgroundColor: colors.goldExtraLight, borderColor: colors.border }]}>
        <View style={[localStyles.docCardIconBox, { backgroundColor: colors.hero1 }]}>
          <FileText size={15} color="#fff" strokeWidth={1.6} />
        </View>
        <View style={localStyles.docCardText}>
          <Text style={[fonts.semibold, localStyles.docCardFilename, { color: '#7A5200' }]} numberOfLines={1}>{filename}</Text>
          <Text style={[fonts.regular, localStyles.docCardSub, { color: colors.gold }]}>PDF · Uploaded</Text>
        </View>
        <Pressable onPress={onDownload} style={localStyles.docCardIconButton}>
          <Download size={16} color={colors.gold} strokeWidth={1.6} />
        </Pressable>
      </View>
    </View>
  );
}

/** Card 6's genuinely two-different-layouts read body — matches web's real `hasDocuments` branch
 * (`StudentThesisTab.tsx:828-965`). When `hasDocuments` is true: a 2-col doc-card row (each column
 * independently empty/filled) plus an optional LinkedIn link. When false (regardless of LinkedIn):
 * a completely different, richer "not yet shared" layout with an info box, static skeleton bars,
 * a "no resume" row, and a "Request resume directly" CTA. */
function SupportingMaterialsBody({
  thesis,
  linkedinUrl,
  hasDocuments,
  firstName,
  onEdit,
  onOpenLinkedIn,
  onDownload,
  onMessage,
}: {
  thesis: StudentThesis;
  /** The fallback-resolved LinkedIn URL (`thesis.linkedinUrl || profile.linkedin_url`) — see the
   * parent's own `effectiveLinkedinUrl` doc comment for why this isn't just `thesis.linkedinUrl`. */
  linkedinUrl: string;
  hasDocuments: boolean;
  firstName: string;
  onEdit: () => void;
  onOpenLinkedIn: (url: string) => void;
  onDownload: (url: string) => void;
  onMessage: () => void;
}) {
  const { colors, fonts } = useTheme();

  if (hasDocuments) {
    return (
      <View style={styles.fieldsWrap}>
        <View style={styles.fieldsRow}>
          <View style={styles.fieldsCol}>
            {thesis.resumeUrl ? (
              <DocCard label="RESUME / CV" url={thesis.resumeUrl} onDownload={() => onDownload(thesis.resumeUrl)} />
            ) : (
              <PillField label="RESUME / CV">
                <AddNowLine text="Not uploaded" onPress={onEdit} actionLabel="upload now" />
              </PillField>
            )}
          </View>
          <View style={styles.fieldsCol}>
            {thesis.coverLetterUrl ? (
              <DocCard label="COVER LETTER" url={thesis.coverLetterUrl} onDownload={() => onDownload(thesis.coverLetterUrl)} />
            ) : (
              <PillField label="COVER LETTER">
                <AddNowLine text="Not uploaded" onPress={onEdit} actionLabel="upload now" />
              </PillField>
            )}
          </View>
        </View>

        {!!linkedinUrl && (
          <PillField label="LinkedIn">
            <Pressable onPress={() => onOpenLinkedIn(linkedinUrl)}>
              <Text style={[fonts.medium, styles.plainValue, { color: colors.gold }]} numberOfLines={1}>
                {linkedinUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
              </Text>
            </Pressable>
          </PillField>
        )}
      </View>
    );
  }

  return (
    <View style={localStyles.notSharedWrap}>
      <Text style={[fonts.bold, localStyles.notSharedEyebrow, { color: colors.ink3 }]}>RESUME / CV &amp; COVER LETTER</Text>

      <View style={[localStyles.notSharedRow, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={[localStyles.notSharedIconBox, { backgroundColor: colors.homeCardBorder }]}>
          <FileText size={16} color={colors.ink3} strokeWidth={1.6} />
        </View>
        <View style={localStyles.notSharedText}>
          <Text style={[fonts.semibold, localStyles.notSharedTitle, { color: colors.ink }]}>Resume &amp; cover letter</Text>
          <Text style={[fonts.regular, localStyles.notSharedSub, { color: colors.ink3 }]}>No documents shared yet</Text>
        </View>
        <NotYetSharedBadge />
      </View>

      <View style={[localStyles.infoBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
        <Info size={16} color="#2563EB" strokeWidth={1.8} style={localStyles.infoIcon} />
        <View style={localStyles.infoText}>
          <Text style={[fonts.semibold, localStyles.infoTitle, { color: '#1E40AF' }]}>Resume not yet shared</Text>
          <Text style={[fonts.regular, localStyles.infoBody, { color: '#1E40AF' }]}>
            {firstName} hasn&apos;t uploaded their resume or cover letter yet. Their skills, availability and interests are all complete above. Connect or message them to request their CV directly.
          </Text>
        </View>
      </View>

      <View style={localStyles.shimmerLines}>
        <Shimmer width="72%" height={8} radius={4} />
        <Shimmer width="58%" height={8} radius={4} />
        <Shimmer width="80%" height={8} radius={4} />
      </View>

      <View style={[localStyles.notSharedRow, { borderColor: colors.border, backgroundColor: colors.surfaceSunken }]}>
        <View style={[localStyles.notSharedIconBoxSmall, { backgroundColor: colors.border }]}>
          <FileText size={13} color={colors.ink3} strokeWidth={1.6} />
        </View>
        <View style={localStyles.notSharedText}>
          <Text style={[fonts.medium, localStyles.notSharedNoResumeTitle, { color: colors.ink3 }]}>No resume uploaded</Text>
          <Text style={[fonts.regular, localStyles.notSharedSub, { color: colors.ink3 }]}>{firstName} hasn&apos;t shared a document yet</Text>
        </View>
      </View>

      <View style={[localStyles.requestBlock, { borderTopColor: colors.borderSoft }]}>
        <View style={[localStyles.requestAvatar, { backgroundColor: colors.homeCardBorder }]}>
          <UserRound size={20} color={colors.ink3} strokeWidth={1.6} />
        </View>
        <Text style={[fonts.semibold, localStyles.requestTitle, { color: colors.ink }]}>Request resume directly</Text>
        <Text style={[fonts.regular, localStyles.requestBody, { color: colors.ink3 }]}>
          Connect or send a message to ask {firstName} for their CV, LinkedIn or any work samples.
        </Text>
        <Pressable onPress={onMessage} style={[localStyles.requestButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <MessageSquare size={14} color={colors.ink2} strokeWidth={1.6} />
          <Text style={[fonts.semibold, localStyles.requestButtonText, { color: colors.ink2 }]}>Send message</Text>
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

function StudentThesisSkeleton() {
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
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  pillText: { fontSize: 12 },
  plainSmall: { fontSize: 12 },
  skeletonPill: { width: 70, height: 26, borderRadius: 999 },
  stackedWrap: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14 },
  stackedSection: { paddingBottom: 14, marginBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 8 },
  stackedSectionLast: { gap: 8 },
  stackedLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  stackedValue: { fontSize: 14 },
  bioBox: { borderLeftWidth: 3, borderRadius: 8, padding: 13 },
  bioText: { fontSize: 12.5, lineHeight: 19, fontStyle: 'italic' },
  startDateCard: { borderRadius: 10, borderWidth: 1, padding: 16, gap: 4 },
  startDateLabel: { fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase' },
  startDateValue: { fontSize: 18, lineHeight: 22 },
  notYetSharedBadge: { flexShrink: 0, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  notYetSharedText: { fontSize: 11 },
  docCardLabel: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  docCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  docCardIconBox: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  docCardText: { flex: 1, minWidth: 0 },
  docCardFilename: { fontSize: 12 },
  docCardSub: { fontSize: 11, marginTop: 1 },
  docCardIconButton: { flexShrink: 0, padding: 4 },
  notSharedWrap: { paddingHorizontal: 14, paddingTop: 2, paddingBottom: 14, gap: 14 },
  notSharedEyebrow: { fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
  notSharedRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  notSharedIconBox: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notSharedIconBoxSmall: { width: 28, height: 28, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notSharedText: { flex: 1, minWidth: 0 },
  notSharedTitle: { fontSize: 12 },
  notSharedNoResumeTitle: { fontSize: 12 },
  notSharedSub: { fontSize: 11, marginTop: 1 },
  infoBox: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 10, padding: 13 },
  infoIcon: { marginTop: 2, flexShrink: 0 },
  infoText: { flex: 1, minWidth: 0, gap: 4 },
  infoTitle: { fontSize: 13 },
  infoBody: { fontSize: 12, lineHeight: 18 },
  shimmerLines: { gap: 8, paddingHorizontal: 2 },
  requestBlock: { alignItems: 'center', gap: 10, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  requestAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  requestTitle: { fontSize: 14, textAlign: 'center' },
  requestBody: { fontSize: 12, lineHeight: 18, textAlign: 'center', maxWidth: 320 },
  requestButton: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 42, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, marginTop: 2 },
  requestButtonText: { fontSize: 12.5 },
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
