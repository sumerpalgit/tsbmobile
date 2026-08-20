import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { types } from '@react-native-documents/picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle } from 'react-native-svg';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { FileUploadButton, PickedFile } from '..';
import { Avatar } from '../Avatar';
import { ConfirmDialog } from '../events/ConfirmDialog';
import { uploadDocument, fetchProfileByUsername } from '../../api/profile';
import {
  fetchCurrentOrganization,
  updateCurrentOrganization,
  CurrentOrganization,
  fetchSuggestedConnections,
  SuggestedConnection,
  fetchMyWorkExperience,
  deleteWorkExperience,
  WorkExperienceEntry,
  fetchMyEducation,
  deleteEducation,
  EducationEntry,
} from '../../api/profile-overview';
import { fetchMyInterests, saveInterests } from '../../api/interests';
import { fetchMyTestimonials, Testimonial } from '../../api/testimonials';
import { useProfileCompletion } from '../../hooks/useProfileCompletion';
import { ExperienceSheet } from './overview/ExperienceSheet';
import { EducationSheet } from './overview/EducationSheet';
import { InterestsSheet } from './overview/InterestsSheet';
import type { Profile } from '../../types/directory';
import type { AppStackParamList } from '../../navigation/types';

const DOCUMENT_UPLOAD_TYPES = [types.pdf, types.doc, types.docx];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SUGGESTIONS_COLLAPSED = 4;

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

const ORG_FIELDS = [
  { key: 'org_name', label: 'Organization Name', placeholder: 'e.g. Strivedge Capital' },
  { key: 'org_role', label: 'Your Role at the Organization', placeholder: 'e.g. Managing Partner' },
  { key: 'org_website', label: 'Organization Website', placeholder: 'https://...' },
  { key: 'calendly_link', label: 'Calendly / Calendar Link', placeholder: 'https://calendly.com/...' },
] as const;

/**
 * Past Experience/Education row avatar — matches the decoded mockup's exact `vpAv()` spec
 * (`standalone/TSB ProfileLast.html`): a 34×34 ROUNDED SQUARE (`border-radius:10`), not the
 * generic `Avatar` component's circle, a single-character initial (first letter of the row's
 * title — job title for Experience, degree for Education — not the org/school name), and a fixed
 * 2-color alternation by row index rather than a name-derived fallback color. An earlier pass
 * used the generic `Avatar` component here, which is visually close but wrong in exactly these
 * three ways — caught only by decoding the mockup's own JS (`vpAv`/`vpExperience`/`vpEducation`)
 * directly, not by eyeballing a screenshot.
 */
function RowAvatar({ title, colorA, colorB, index }: { title: string; colorA: string; colorB: string; index: number }) {
  const { fonts } = useTheme();
  const initial = (title || '?').charAt(0).toUpperCase();
  return (
    <View style={[styles.rowAvatar, { backgroundColor: index % 2 === 0 ? colorA : colorB }]}>
      <Text style={[fonts.bold, styles.rowAvatarText]}>{initial}</Text>
    </View>
  );
}

function experienceDateRange(e: WorkExperienceEntry): string {
  const start = [e.start_month, e.start_year].filter(Boolean).join(' ');
  const end = e.is_current ? 'Present' : [e.end_month, e.end_year].filter(Boolean).join(' ');
  return [start, end].filter(Boolean).join(' – ');
}

function educationDateRange(e: EducationEntry): string {
  const end = e.is_current ? 'Present' : e.end_year;
  return [e.start_year, end].filter(Boolean).join(' – ');
}

/**
 * View Profile's Overview tab — Phase 2 of the plan (`delightful-seeking-snowglobe.md`). Split
 * out of `ViewProfileScreen.tsx` into its own component per the user's explicit request: each tab
 * owns its own data fetching so only the active tab's queries fire (Posts/Testimonial/Analytics
 * won't fetch anything until built and tapped), and to avoid `ViewProfileScreen.tsx` growing
 * toward web's 5,377-line single-file `my-profile/page.tsx`.
 *
 * Every section below follows the user's standing instruction for this phase: UI matches the
 * MOCKUP exactly, functionality is DITTO real web — resolve any mockup/web mismatch in web's
 * favor. Section order matches the mockup: About, Current Organization, Past Experience,
 * Interests, Education, Suggested Connections, Profile Insights. (Mockup also previews a "Latest
 * Testimonial" card here — that belongs to Phase 4's data/backend, not built yet, so omitted
 * rather than faked.)
 *
 * Current Organization — matches web's `CurrentOrganizationCard`
 * (`my-profile/page.tsx:2539-2774`) functionally: always an editable inline form (no view/edit
 * toggle), all 5 fields sent on every save regardless of which changed, marked with a red `*` but
 * NOT actually blocked/validated before save — matches web's real (slightly lax) behavior. This
 * REPLACES Phase 1's read-only card, which wrongly showed `profile.designation`/
 * `profile.organization` (a different, onboarding-role backend record entirely).
 *
 * Past Experience / Education — full CRUD via `ExperienceSheet`/`EducationSheet` (own files,
 * `./overview/`). Experience's Add is a 3-step wizard, Edit is single-step — confirmed
 * intentional on web itself, not a mockup quirk. Education is the one section with real
 * client-side validation ("School and Degree are required."); Experience has none, matching web.
 * Delete uses the app's own `ConfirmDialog` (`src/components/events/`), not `Alert.alert` — this
 * app deliberately replaced native OS alerts with in-app dialogs everywhere, see that file's own
 * doc comment.
 *
 * Interests — functionally reuses the exact `saveInterests()`/`interest_labels` call Dual
 * Profile's wizard already makes (immediate persist per add/remove, not batched), NOT web's own
 * bespoke pill+combobox UI — the mockup's simpler sheet is used for UI instead, per the user's
 * "mockup UI, web functionality" instruction. See `InterestsSheet.tsx`.
 *
 * Suggested Connections — read-only recommendation list (`GET /profile/suggested-connections`,
 * a real, purpose-built endpoint — not a generic search), "View" navigates into the existing
 * `MemberProfile` route via `fetchProfileByUsername`, same as Directory's own "View Profile"
 * navigation. No Connect/Follow action anywhere on web's version either — doesn't touch the
 * follow endpoints already confirmed missing from this app.
 *
 * Profile Insights — NOT an analytics donut: it's real web's existing `CompleteYourProfileCard`/
 * profile-completion widget (`useProfileCompletion()`, mobile already built this for the Home
 * feed banner) drawn as the mockup's small ring instead of that card's full progress bar.
 * **Now tappable (Phase 7)**: web navigates to a separate `complete-profile` tab on tap — that's
 * exactly what View Profile's own Analytics tab turned out to be (confirmed via direct research:
 * its internal component IS `CompleteProfileTab`, "Analytics" is just its display label), so this
 * card now has a real destination via `onOpenAnalytics`, closing the TODO left when Phase 2 first
 * built this non-interactive for lack of one. The mockup's own state model independently confirms
 * this same intent (`vpToastInsights: () => this.vpGoTab('analytics')`).
 *
 * Latest Testimonial — real data, NOT the fabrication an earlier memory note wrongly claimed.
 * `fetchMyTestimonials(profile.username)` (`src/api/testimonials.ts`, `GET /testimonial/:username`)
 * matches web's `fetchTestimonials(profile.username)` call exactly — the signed-in user's OWN
 * username, i.e. testimonials received about them. Web's actual sidebar widget
 * (`TestimonialsRightSidebar`) lists ALL of them; this card only shows the first/most-recent one
 * with a "View all" button, matching the mockup's single-card preview — `onViewAllTestimonials`
 * switches `ViewProfileScreen`'s active tab to `'testimonial'` (still a stub body, Phase 4) rather
 * than a route that doesn't exist yet. Hidden entirely when there are zero testimonials, same as
 * web's own `if (data.length === 0) return null`.
 */
export function ViewProfileOverviewTab({
  profile,
  onViewAllTestimonials,
  onOpenAnalytics,
}: {
  profile: Profile;
  onViewAllTestimonials: () => void;
  onOpenAnalytics: () => void;
}) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  // Current Organization
  const [org, setOrg] = useState<CurrentOrganization | null>(null);
  const [orgSaved, setOrgSaved] = useState<CurrentOrganization | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgSaving, setOrgSaving] = useState(false);
  const [deckFile, setDeckFile] = useState<PickedFile | null>(null);
  const [deckUploading, setDeckUploading] = useState(false);

  // Past Experience
  const [experiences, setExperiences] = useState<WorkExperienceEntry[]>([]);
  const [experiencesLoading, setExperiencesLoading] = useState(true);
  const [experienceSheet, setExperienceSheet] = useState<{ mode: 'add' | 'edit'; entry: WorkExperienceEntry | null } | null>(null);
  const [deleteExperienceId, setDeleteExperienceId] = useState<string | null>(null);

  // Interests
  const [interests, setInterests] = useState<string[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [interestsSheetOpen, setInterestsSheetOpen] = useState(false);

  // Education
  const [educationList, setEducationList] = useState<EducationEntry[]>([]);
  const [educationLoading, setEducationLoading] = useState(true);
  const [educationSheet, setEducationSheet] = useState<{ mode: 'add' | 'edit'; entry: EducationEntry | null } | null>(null);
  const [deleteEducationId, setDeleteEducationId] = useState<string | null>(null);

  // Suggested Connections
  const [suggestions, setSuggestions] = useState<SuggestedConnection[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const [viewingUsername, setViewingUsername] = useState<string | null>(null);

  // Profile Insights
  const { data: completion } = useProfileCompletion();

  // Latest Testimonial
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialExpanded, setTestimonialExpanded] = useState(false);

  const loadExperiences = () => {
    setExperiencesLoading(true);
    fetchMyWorkExperience().then(setExperiences).catch(() => {}).finally(() => setExperiencesLoading(false));
  };
  const loadEducation = () => {
    setEducationLoading(true);
    fetchMyEducation().then(setEducationList).catch(() => {}).finally(() => setEducationLoading(false));
  };
  const loadInterests = () => {
    setInterestsLoading(true);
    fetchMyInterests().then(setInterests).catch(() => {}).finally(() => setInterestsLoading(false));
  };

  /** Matches web's own `InterestsCard.handleRemoveInterest` exactly — the main card's chips are
   * directly removable (immediate `saveInterests()` persist), not gated behind opening the "+
   * Add" sheet; confirmed both in the mockup's own markup and in web's real component. */
  const handleRemoveInterest = async (label: string) => {
    const next = interests.filter(i => i !== label);
    setInterests(next);
    try {
      await saveInterests(next);
    } catch (err) {
      setInterests(interests);
      Toast.show({ type: 'error', text1: 'Could not remove interest', text2: extractErrorMessage(err) });
    }
  };

  useEffect(() => {
    fetchCurrentOrganization()
      .then(d => {
        setOrg(d);
        setOrgSaved(d);
        // Web's exact fallback (`credFile?.name || "Document uploaded"`) — a previously-saved
        // deck has no local filename to show, only the URL, so the dropzone's success state
        // needs a synthetic value to render as "already uploaded" from the first paint instead
        // of looking empty until the user re-picks a file this session.
        if (d.credentials_deck_url) {
          setDeckFile({ uri: d.credentials_deck_url, name: 'Document uploaded', size: null, mimeType: null });
        }
      })
      .catch(() => {})
      .finally(() => setOrgLoading(false));
    loadExperiences();
    loadEducation();
    loadInterests();
    setSuggestionsLoading(true);
    fetchSuggestedConnections().then(setSuggestions).catch(() => {}).finally(() => setSuggestionsLoading(false));
    fetchMyTestimonials(profile.username).then(setTestimonials).catch(() => {});
    // `profile.username` is intentionally the only real dependency here — everything else in this
    // effect is a one-time mount fetch; refetching testimonials specifically when the active
    // username changes (e.g. after Switch Profile) is correct, not an oversight to suppress.
  }, [profile.username]);

  const handleOrgFieldChange = (key: keyof CurrentOrganization, value: string) => {
    setOrg(prev => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleDeckChange = async (file: PickedFile | null) => {
    setDeckFile(file);
    if (!file) {
      handleOrgFieldChange('credentials_deck_url', '');
      return;
    }
    setDeckUploading(true);
    try {
      const { fileUrl } = await uploadDocument(file, 'credentials_deck');
      handleOrgFieldChange('credentials_deck_url', fileUrl);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: extractErrorMessage(err) });
      setDeckFile(null);
    } finally {
      setDeckUploading(false);
    }
  };

  const handleSaveOrg = async () => {
    if (!org) return;
    setOrgSaving(true);
    try {
      await updateCurrentOrganization(org);
      Toast.show({ type: 'success', text1: 'Organization details saved' });
      setOrgSaved(org);
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    } finally {
      setOrgSaving(false);
    }
  };

  const isOrgDirty = !!org && !!orgSaved && JSON.stringify(org) !== JSON.stringify(orgSaved);

  const handleConfirmDeleteExperience = async () => {
    if (!deleteExperienceId) return;
    const id = deleteExperienceId;
    setDeleteExperienceId(null);
    try {
      await deleteWorkExperience(id);
      Toast.show({ type: 'success', text1: 'Experience removed' });
      loadExperiences();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not remove', text2: extractErrorMessage(err) });
    }
  };

  const handleConfirmDeleteEducation = async () => {
    if (!deleteEducationId) return;
    const id = deleteEducationId;
    setDeleteEducationId(null);
    try {
      await deleteEducation(id);
      Toast.show({ type: 'success', text1: 'Education removed' });
      loadEducation();
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not remove', text2: extractErrorMessage(err) });
    }
  };

  const handleViewSuggestion = async (username: string) => {
    setViewingUsername(username);
    try {
      const p = await fetchProfileByUsername(username);
      navigation.navigate('MemberProfile', { profile: p, initialSaved: false });
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Could not open profile', text2: extractErrorMessage(err) });
    } finally {
      setViewingUsername(null);
    }
  };

  const visibleSuggestions = showAllSuggestions ? suggestions : suggestions.slice(0, MAX_SUGGESTIONS_COLLAPSED);
  const completionPct = Math.max(0, Math.min(100, Math.round(completion?.completionPercentage ?? 0)));

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>About</Text>
        <Text style={[fonts.regular, styles.cardBody, { color: profile.bio ? colors.ink2 : colors.ink3 }, !profile.bio && styles.italic]}>
          {profile.bio || 'Add a bio from Edit Profile so others know a bit about you.'}
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Current Organization</Text>

        {orgLoading || !org ? (
          <ActivityIndicator size="small" color={colors.ink3} style={styles.sectionLoading} />
        ) : (
          <View style={styles.orgForm}>
            {ORG_FIELDS.map(f => (
              <View key={f.key} style={styles.fieldGroup}>
                <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>
                  {f.label} <Text style={{ color: colors.danger }}>*</Text>
                </Text>
                <TextInput
                  value={org[f.key]}
                  onChangeText={v => handleOrgFieldChange(f.key, v)}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.ink3}
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
                />
              </View>
            ))}

            <View style={styles.fieldGroup}>
              <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>
                Organization Credentials Deck <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <FileUploadButton
                value={deckFile}
                onChange={handleDeckChange}
                acceptedTypes={DOCUMENT_UPLOAD_TYPES}
                maxSizeBytes={MAX_UPLOAD_SIZE_BYTES}
                loading={deckUploading}
                placeholder="PDF, DOC, DOCX (Max 10MB)"
                variant="dropzone"
                uploadedCaption="Click to replace"
              />
            </View>

            <Pressable
              onPress={handleSaveOrg}
              disabled={orgSaving || !isOrgDirty}
              style={({ pressed }) => [
                styles.saveButton,
                { backgroundColor: '#182E43', opacity: orgSaving || !isOrgDirty ? 0.5 : pressed ? 0.8 : 1 },
              ]}
            >
              {orgSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={[fonts.bold, styles.saveButtonText, { color: '#fff' }]}>Save</Text>
              )}
            </Pressable>
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Past Experience</Text>
          <Pressable
            onPress={() => setExperienceSheet({ mode: 'add', entry: null })}
            style={styles.addPillButton}
          >
            <Plus size={13} color={colors.ink2} strokeWidth={2} />
            <Text style={[fonts.bold, styles.addPillButtonText, { color: colors.ink2 }]}>Add</Text>
          </Pressable>
        </View>

        {experiencesLoading ? (
          <ActivityIndicator size="small" color={colors.ink3} style={styles.sectionLoading} />
        ) : experiences.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>No past roles added yet. Tap Add to log one.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {experiences.map((e, i) => (
              <View key={e.id} style={[styles.listRow, { borderTopColor: colors.borderSoft, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <RowAvatar title={e.job_title} colorA="#C6741F" colorB={colors.indigo} index={i} />
                <View style={styles.listRowMeta}>
                  <Text style={[fonts.semibold, styles.listRowTitle, { color: colors.ink }]} numberOfLines={1}>
                    {e.job_title}
                  </Text>
                  <Text style={[fonts.regular, styles.listRowSub, { color: colors.ink3 }]}>
                    {[e.organization_name, experienceDateRange(e)].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Pressable onPress={() => setExperienceSheet({ mode: 'edit', entry: e })} hitSlop={6} style={styles.rowIconButton}>
                  <Pencil size={14} color={colors.ink3} strokeWidth={1.8} />
                </Pressable>
                <Pressable onPress={() => setDeleteExperienceId(e.id)} hitSlop={6} style={styles.rowIconButton}>
                  <Trash2 size={14} color={colors.danger} strokeWidth={1.8} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Interests</Text>
          <Pressable onPress={() => setInterestsSheetOpen(true)} style={styles.addPillButton}>
            <Plus size={13} color={colors.ink2} strokeWidth={2} />
            <Text style={[fonts.bold, styles.addPillButtonText, { color: colors.ink2 }]}>Add</Text>
          </Pressable>
        </View>
        <Text style={[fonts.regular, styles.helperText, { color: colors.ink3 }]}>
          Add up to 5 interests that reflect the deals and topics you focus on. They help us match you with the right people.
        </Text>

        {interestsLoading ? (
          <ActivityIndicator size="small" color={colors.ink3} style={styles.sectionLoading} />
        ) : interests.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border, marginTop: 12 }]}>
            <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>No interests yet. Add up to 5.</Text>
          </View>
        ) : (
          <View style={styles.chipsRow}>
            {interests.map(label => (
              <View key={label} style={styles.chip}>
                <Text style={[fonts.semibold, styles.chipText, { color: colors.ink2 }]}>{label}</Text>
                <Pressable onPress={() => handleRemoveInterest(label)} hitSlop={6} style={styles.chipRemove}>
                  <X size={9} color={colors.ink3} strokeWidth={1.8} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Education</Text>
          <Pressable
            onPress={() => setEducationSheet({ mode: 'add', entry: null })}
            style={styles.addPillButton}
          >
            <Plus size={13} color={colors.ink2} strokeWidth={2} />
            <Text style={[fonts.bold, styles.addPillButtonText, { color: colors.ink2 }]}>Add</Text>
          </Pressable>
        </View>

        {educationLoading ? (
          <ActivityIndicator size="small" color={colors.ink3} style={styles.sectionLoading} />
        ) : educationList.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>No education added yet. Tap Add to log a degree.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {educationList.map((e, i) => (
              <View key={e.id} style={[styles.listRow, { borderTopColor: colors.borderSoft, borderTopWidth: StyleSheet.hairlineWidth }]}>
                <RowAvatar title={e.degree} colorA="#9E2B2B" colorB={colors.goldDark} index={i} />
                <View style={styles.listRowMeta}>
                  <Text style={[fonts.semibold, styles.listRowTitle, { color: colors.ink }]} numberOfLines={1}>
                    {e.degree}
                  </Text>
                  <Text style={[fonts.regular, styles.listRowSub, { color: colors.ink3 }]}>
                    {[e.institution_name, educationDateRange(e)].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Pressable onPress={() => setEducationSheet({ mode: 'edit', entry: e })} hitSlop={6} style={styles.rowIconButton}>
                  <Pencil size={14} color={colors.ink3} strokeWidth={1.8} />
                </Pressable>
                <Pressable onPress={() => setDeleteEducationId(e.id)} hitSlop={6} style={styles.rowIconButton}>
                  <Trash2 size={14} color={colors.danger} strokeWidth={1.8} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>

      {(suggestionsLoading || suggestions.length > 0) && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Suggested Connections</Text>

          {suggestionsLoading ? (
            <ActivityIndicator size="small" color={colors.ink3} style={styles.sectionLoading} />
          ) : (
            <>
              <View style={styles.suggestionList}>
                {visibleSuggestions.map((s, i) => (
                  <View key={s.username} style={[styles.suggestionRow, i > 0 && { borderTopColor: colors.borderSoft, borderTopWidth: StyleSheet.hairlineWidth }]}>
                    <Avatar name={s.name} imageUri={s.profile_img} size={34} />
                    <View style={styles.suggestionMeta}>
                      <Text style={[fonts.bold, styles.suggestionName, { color: colors.ink }]} numberOfLines={1}>
                        {s.name}
                      </Text>
                      {!!s.role_type && (
                        <Text style={[fonts.regular, styles.suggestionRole, { color: colors.ink3 }]} numberOfLines={1}>
                          {s.role_type}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => handleViewSuggestion(s.username)}
                      disabled={viewingUsername === s.username}
                      style={styles.viewButton}
                    >
                      {viewingUsername === s.username ? (
                        <ActivityIndicator size="small" color={colors.gold} />
                      ) : (
                        <Text style={[fonts.bold, styles.viewButtonText, { color: colors.gold }]}>View</Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>

              {suggestions.length > MAX_SUGGESTIONS_COLLAPSED && (
                <Pressable
                  onPress={() => setShowAllSuggestions(v => !v)}
                  style={styles.viewMoreButton}
                >
                  <Text style={[fonts.bold, styles.viewMoreText, { color: colors.ink2 }]}>
                    {showAllSuggestions ? 'Show Less' : 'View More'}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      )}

      {!!completion && (
        <Pressable
          onPress={onOpenAnalytics}
          style={({ pressed }) => [styles.card, styles.insightsCard, { backgroundColor: colors.surface, borderColor: colors.indigo }, pressed && styles.pressed]}
        >
          <View style={styles.insightsRing}>
            <Svg width={40} height={40}>
              <Circle cx={20} cy={20} r={18} stroke={colors.border} strokeWidth={4} fill="none" />
              <Circle
                cx={20}
                cy={20}
                r={18}
                stroke="#3B82F6"
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 18} ${2 * Math.PI * 18}`}
                strokeDashoffset={2 * Math.PI * 18 * (1 - completionPct / 100)}
                transform="rotate(-90 20 20)"
              />
            </Svg>
            <Text style={[fonts.bold, styles.insightsPct, { color: '#3B82F6' }]}>{completionPct}%</Text>
          </View>
          <View style={styles.insightsMeta}>
            <Text style={[fonts.semibold, styles.insightsTitle, { color: colors.ink }]}>Profile Insights</Text>
            <Text style={[fonts.regular, styles.insightsSubtitle, { color: colors.ink3 }]}>Improve match accuracy &amp; inbound deal flow</Text>
          </View>
          <ChevronRight size={16} color={colors.ink3} strokeWidth={1.8} />
        </Pressable>
      )}

      {testimonials.length > 0 && (() => {
        const t = testimonials[0];
        const isLong = t.testimonial.length > 120;
        const displayText = testimonialExpanded || !isLong ? t.testimonial : `${t.testimonial.slice(0, 120)}…`;
        const subtitle = t.reviewer.designation || t.reviewer.organization
          ? [t.reviewer.designation, t.reviewer.organization].filter(Boolean).join(' · ')
          : `@${t.reviewer.username}`;
        return (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Latest Testimonial</Text>
              <Pressable onPress={onViewAllTestimonials} style={styles.addPillButton}>
                <Text style={[fonts.bold, styles.addPillButtonText, { color: colors.ink2 }]}>View all</Text>
              </Pressable>
            </View>

            <View style={styles.testimonialHeader}>
              <Avatar name={t.reviewer.name} imageUri={t.reviewer.profile_img} size={34} />
              <View style={styles.suggestionMeta}>
                <Text style={[fonts.bold, styles.suggestionName, { color: colors.ink }]} numberOfLines={1}>
                  {t.reviewer.name}
                </Text>
                <Text style={[fonts.regular, styles.suggestionRole, { color: colors.ink3 }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              </View>
            </View>

            <Text style={[fonts.regular, styles.testimonialBody, { color: colors.ink2 }]}>{displayText}</Text>

            {isLong && (
              <Pressable onPress={() => setTestimonialExpanded(v => !v)} style={styles.testimonialReadMore}>
                <ChevronDown
                  size={11}
                  color={colors.gold}
                  strokeWidth={1.8}
                  style={testimonialExpanded ? styles.testimonialChevronUp : undefined}
                />
                <Text style={[fonts.bold, styles.testimonialReadMoreText, { color: colors.gold }]}>
                  {testimonialExpanded ? 'Show less' : 'Read more'}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })()}

      <ExperienceSheet
        visible={!!experienceSheet}
        mode={experienceSheet?.mode ?? 'add'}
        initial={experienceSheet?.entry}
        onClose={() => setExperienceSheet(null)}
        onSaved={loadExperiences}
      />
      <EducationSheet
        visible={!!educationSheet}
        mode={educationSheet?.mode ?? 'add'}
        initial={educationSheet?.entry}
        onClose={() => setEducationSheet(null)}
        onSaved={loadEducation}
      />
      <InterestsSheet
        visible={interestsSheetOpen}
        roleType={profile.role_type}
        subCategory={profile.sub_category ?? null}
        onClose={() => {
          setInterestsSheetOpen(false);
          loadInterests();
        }}
      />

      <ConfirmDialog
        visible={!!deleteExperienceId}
        title="Remove this experience?"
        message="This will permanently remove this role from your profile."
        confirmLabel="Remove"
        destructive
        onConfirm={handleConfirmDeleteExperience}
        onCancel={() => setDeleteExperienceId(null)}
      />
      <ConfirmDialog
        visible={!!deleteEducationId}
        title="Remove this education?"
        message="This will permanently remove this entry from your profile."
        confirmLabel="Remove"
        destructive
        onConfirm={handleConfirmDeleteEducation}
        onCancel={() => setDeleteEducationId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 13, paddingBottom: 28 },
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  pressed: { opacity: 0.7 },
  cardTitle: { fontSize: 16 },
  cardBody: { fontSize: 12.5, lineHeight: 19, marginTop: 7 },
  italic: { fontStyle: 'italic' },
  sectionLoading: { marginTop: 14 },
  orgForm: { marginTop: 12, gap: 12 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11.5 },
  input: { height: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, fontSize: 13.5 },
  saveButton: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  saveButtonText: { fontSize: 13.5 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  addPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 38,
    paddingHorizontal: 13,
    borderRadius: 11,
    borderWidth: 1,
    // Exact literal colors, per user instruction — same fixed cream/tan across every "+ Add"
    // pill on this screen (Past Experience, Interests, Education), not theme-token-driven.
    backgroundColor: '#F8F6F1',
    borderColor: '#DED9CC',
  },
  addPillButtonText: { fontSize: 12 },
  helperText: { fontSize: 11.5, lineHeight: 16, marginTop: 6 },
  emptyBox: { borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginTop: 10 },
  emptyText: { fontSize: 12.5 },
  list: { marginTop: 6 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11 },
  rowAvatar: { flexShrink: 0, width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowAvatarText: { fontSize: 12.5, color: '#fff' },
  listRowMeta: { flex: 1, minWidth: 0, marginLeft: 5 },
  listRowTitle: { fontSize: 13 },
  listRowSub: { fontSize: 11, marginTop: 2 },
  rowIconButton: { flexShrink: 0, width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  suggestionList: { marginTop: 5 },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10 },
  suggestionMeta: { flex: 1, minWidth: 0 },
  suggestionName: { fontSize: 12.5 },
  suggestionRole: { fontSize: 11, marginTop: 1 },
  // Same exact literal colors as `addPillButton` — user instruction: every "+ Add"/"View"/"View
  // More" pill on this screen shares one fixed cream/tan look, not theme-token-driven.
  viewButton: {
    flexShrink: 0,
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6F1',
    borderColor: '#DED9CC',
  },
  viewButtonText: { fontSize: 11.5 },
  viewMoreButton: {
    height: 40,
    marginTop: 11,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F6F1',
    borderColor: '#DED9CC',
  },
  viewMoreText: { fontSize: 12.5 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 5,
    height: 36,
    backgroundColor: '#F8F6F1',
    borderColor: '#DED9CC',
  },
  chipText: { fontSize: 11.5 },
  chipRemove: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  insightsCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightsRing: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  insightsPct: { position: 'absolute', fontSize: 9.5 },
  insightsMeta: { flex: 1, minWidth: 0 },
  insightsTitle: { fontSize: 14 },
  insightsSubtitle: { fontSize: 11, marginTop: 2 },
  testimonialHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  testimonialBody: { fontSize: 12, lineHeight: 19, marginTop: 9 },
  testimonialReadMore: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, minHeight: 30, alignSelf: 'flex-start' },
  testimonialReadMoreText: { fontSize: 11.5 },
  testimonialChevronUp: { transform: [{ rotate: '180deg' }] },
});
