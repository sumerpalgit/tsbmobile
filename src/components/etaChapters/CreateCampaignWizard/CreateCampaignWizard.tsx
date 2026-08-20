import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { Megaphone, X } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { createAdCampaign } from '../../../api/eta';
import { uploadFileDirectToSupabase } from '../../../api/supabaseDirectUpload';
import { StepBrand } from './StepBrand';
import { StepPlacement } from './StepPlacement';
import { StepCreative } from './StepCreative';
import { StepTargeting } from './StepTargeting';
import { StepSchedule } from './StepSchedule';
import { StepReview } from './StepReview';
import { actualDays, EMPTY_DRAFT } from './types';
import type { CampaignDraft } from './types';

const STEP_NAMES = ['Brand', 'Placement', 'Creative', 'Targeting', 'Schedule', 'Review'];
const TOTAL_STEPS = STEP_NAMES.length;

/** "Create Your Campaign" — matches `ETAChapters_decoded.html`'s "CREATE AD" (~line 942) and
 * web's `CreateCampaignModal` exactly (see the ETA Chapters plan's ad-campaign research for the
 * full field/validation/cost-formula spec). Real, working endpoint (`POST /ads/create-ad`), no
 * payment collection anywhere in this flow (`payment_completed: true` is a hardcoded literal web
 * itself sends — not a real charge; replicated faithfully, not newly invented). Validation
 * matches web's own permissiveness exactly: non-empty checks only, no email/URL regex, no
 * file-size enforcement beyond MIME type, no past-date guard — this is not a gap, it's fidelity
 * to the real contract.
 *
 * Plain screen content, not a `Modal` overlay — this used to own its own `Modal`, but hit the
 * same `useSafeAreaInsets()`-inside-`Modal` unreliability class of bug `CreateEventScreen`/
 * `EventDetailScreen`/`MemberProfileScreen` were each moved off `Modal` for (the Modal renders in
 * a separate native window that isn't reliably part of the safe-area measurement tree, so
 * `insets.top` could come back 0 on Android, leaving the header flush against the status bar —
 * previously patched with a `StatusBar.currentHeight` workaround). Now a dedicated pushed screen
 * (`CreateAdCampaignScreen.tsx`, registered in `AppNavigator.tsx`), reached from both Ad
 * Management's "New Campaign" and ETA Chapters' "+ Create Ad" — this component itself has zero
 * per-caller coupling either way, so both callers just navigate to the same route. */
export function CreateCampaignWizard({ onClose }: { onClose: () => void }) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<CampaignDraft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  const activeFieldRef = useRef<TextInput | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const patch = (p: Partial<CampaignDraft>) => setDraft(prev => ({ ...prev, ...p }));
  const clearError = (key: string) => setErrors(prev => (prev[key] ? { ...prev, [key]: '' } : prev));

  /** Same fix as `CreateEventWizard.tsx`'s own scroll-to-focused-field mechanism (see that file's
   * doc comment for the full root-cause writeup — `react-native-keyboard-aware-scroll-view`'s
   * auto-detection doesn't reliably fire, and `ScrollView`'s own legacy
   * `scrollResponderScrollNativeHandleToKeyboard` silently no-ops). Uses `measureInWindow` on the
   * focused `TextInput`'s own ref (not a synthetic-event `target` guess) to get its absolute
   * on-screen position, compares that to the keyboard's top edge, and scrolls by exactly the
   * difference — doesn't depend on `KeyboardAvoidingView` resizing anything, so it works
   * regardless of platform/`adjustResize` quirks. Currently only wired up for Step 3 (`Creative`,
   * the step this was reported broken on) via `StepCreative`'s `onFieldFocus` prop — other steps'
   * inputs don't call it, so `activeFieldRef` just stays null there and this listener is a no-op
   * for them, same as before this fix (no behavior change for steps that weren't reported broken).
   *
   * `keyboardHeight` state (not a static over-provisioned `paddingBottom`) gives the scroll room
   * to scroll INTO — a `ScrollView` can only scroll up to `contentHeight - viewportHeight`, so a
   * field at the natural end of a step's content has nowhere further to scroll once the keyboard
   * covers it. A static large padding "worked" but left a permanent gap at the bottom once the
   * keyboard closed (caught via screenshot) — sizing it to the actual keyboard height and clearing
   * it on `keyboardDidHide` collapses that gap back to nothing once the keyboard is gone. */
  const handleFieldFocus = (ref: React.RefObject<TextInput | null>) => {
    activeFieldRef.current = ref.current;
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      setKeyboardHeight(e.endCoordinates.height);
      const field = activeFieldRef.current;
      if (!field) return;
      field.measureInWindow((_x, y, _w, height) => {
        const keyboardTop = Dimensions.get('window').height - e.endCoordinates.height;
        const buffer = 16;
        const fieldBottom = y + height;
        if (fieldBottom > keyboardTop - buffer) {
          scrollRef.current?.scrollTo({ y: scrollYRef.current + (fieldBottom - (keyboardTop - buffer)), animated: true });
        }
      });
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /** Per-field, matching web's real `validateStep` (`CreateCampaignModal.tsx:303`) — an
   * `errors` record keyed by field name, not a single first-failure string, so every invalid
   * required field can be highlighted at once instead of the user having to fix-and-resubmit
   * one at a time to discover the next problem. */
  const validateStep = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (step === 1) {
      if (!draft.brandName.trim()) errs.brandName = 'Brand name is required.';
      if (!draft.advertiserType) errs.advertiserType = 'Advertiser type is required.';
      if (!draft.contactEmail.trim()) errs.contactEmail = 'Contact email is required.';
      if (!draft.campaignName.trim()) errs.campaignName = 'Campaign name is required.';
      if (!draft.policyAgreed) errs.policyAgreed = 'You must agree to the TSB Advertising Policies.';
    }
    if (step === 2) {
      const needsEta = draft.placement === 'eta' || draft.placement === 'both';
      if (needsEta && draft.chapterIds.length === 0) errs.chapterIds = 'Select at least one ETA chapter.';
    }
    if (step === 3) {
      if (!draft.bannerFile) errs.bannerFile = 'Upload a banner image.';
      if (!draft.headline.trim()) errs.headline = 'Add a headline.';
      if (!draft.destUrl.trim()) errs.destUrl = 'Add a destination URL.';
    }
    if (step === 5) {
      if (!draft.startDate) errs.startDate = 'Select a campaign start date.';
      if (actualDays(draft) < 1) errs.duration = 'Enter a valid campaign duration.';
    }
    return errs;
  };

  const goNext = () => {
    if (advancing || submitting) return;
    const errs = validateStep();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Toast.show({ type: 'error', text1: 'Please fix the highlighted fields' });
      return;
    }
    setErrors({});
    setSubmitError(null);
    if (step === TOTAL_STEPS) {
      handleSubmit();
      return;
    }
    setAdvancing(true);
    setTimeout(() => {
      setStep(s => s + 1);
      setAdvancing(false);
      scrollYRef.current = 0;
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, 220);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!draft.bannerFile) {
      setSubmitError('A banner image is required — go back to the Creative step to upload one.');
      return;
    }
    setSubmitting(true);
    try {
      const bannerUrl = await uploadFileDirectToSupabase(
        draft.bannerFile.uri,
        draft.bannerFile.name,
        draft.bannerFile.mimeType ?? 'image/jpeg',
        'ad-banners',
      );
      if (!bannerUrl) throw new Error('Banner upload failed.');

      await createAdCampaign({
        brand_name: draft.brandName.trim(),
        advertiser_type: draft.advertiserType,
        primary_contact_email: draft.contactEmail.trim(),
        campaign_name: draft.campaignName.trim(),
        home_placement: draft.placement === 'home' || draft.placement === 'both',
        ad_banner_url: bannerUrl,
        click_destination_type: draft.destType,
        click_destination_url: draft.destUrl.trim(),
        campaign_start_date: draft.startDate,
        campaign_duration_weeks: Math.max(1, Math.round(actualDays(draft) / 7)),
        payment_completed: true,
        eta_chapter_ids: draft.chapterIds,
        tier: draft.bannerTier,
        ad_headline: draft.headline.trim(),
        ad_body_text: draft.body.trim(),
        ad_cta_text: draft.ctaLabel.trim() || 'Learn More',
        target_audience: draft.audience,
        target_geography: draft.geography,
      });

      Toast.show({ type: 'success', text1: 'Campaign submitted!', text2: 'It will go live after review.' });
      onClose();
    } catch (err: any) {
      // Kept as an inline banner (not just a toast) even now that this is a real screen — a
      // submit failure on the last step is important enough to stay visible rather than fade
      // like a toast does, and it sits right above the footer where the user's attention already
      // is.
      setSubmitError(err?.message || 'Could not submit campaign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}
      // Android stays `undefined`, matching `CreateEventWizard.tsx`'s own established convention
      // — `behavior="height"` fights this app's `windowSoftInputMode="adjustResize"` (two resize
      // mechanisms compensating for the same keyboard event), which showed up as exactly the
      // flicker/residual-gap bug already root-caused and fixed elsewhere (`CreateChapterScreen.tsx`).
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
        <View style={styles.headerTop}>
          <View style={[styles.headerIconWell, { backgroundColor: colors.feedFill, borderRadius: radius.lg }]}>
            <Megaphone size={16} color={colors.feedOnFill} strokeWidth={1.6} />
          </View>
          <View style={styles.headerText}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>ADVERTISE ON TSB</Text>
            <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>Create Your Campaign</Text>
          </View>
          <Pressable onPress={onClose} accessibilityLabel="Close" style={[styles.closeButton, { backgroundColor: colors.surfaceSunken }]}>
            <X size={12} color={colors.ink2} strokeWidth={1.8} />
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          <Text style={[fonts.bold, styles.progressLabel, { color: colors.ink3 }]}>STEP {step} OF {TOTAL_STEPS}</Text>
          <Text style={[fonts.bold, styles.progressLabel, { color: colors.goldDark }]}>{STEP_NAMES[step - 1]}</Text>
        </View>
        <View style={styles.progressBar}>
          {STEP_NAMES.map((name, i) => (
            <View key={name} style={[styles.progressSegment, { backgroundColor: i < step ? colors.gold : colors.border }]} />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.body, { paddingBottom: 24 + keyboardHeight }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={e => {
          scrollYRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {step === 1 && <StepBrand draft={draft} onChange={patch} errors={errors} clearError={clearError} />}
        {step === 2 && <StepPlacement draft={draft} onChange={patch} errors={errors} clearError={clearError} />}
        {step === 3 && <StepCreative draft={draft} onChange={patch} errors={errors} clearError={clearError} onFieldFocus={handleFieldFocus} />}
        {step === 4 && <StepTargeting draft={draft} onChange={patch} />}
        {step === 5 && <StepSchedule draft={draft} onChange={patch} errors={errors} clearError={clearError} />}
        {step === 6 && <StepReview draft={draft} />}
      </ScrollView>

      {!!submitError && (
        <View style={[styles.submitErrorBanner, { backgroundColor: colors.dangerSurface, borderTopColor: colors.danger, borderTopWidth: borderWidth.thin }]}>
          <Text style={[fonts.semibold, styles.submitErrorText, { color: colors.danger }]}>{submitError}</Text>
        </View>
      )}

      {/* `SafeAreaView` (edges: ['bottom']) instead of a manual `insets.bottom` read — same
          "raw hook value shown unreliable" fix as `AdManagementScreen.tsx`, scoped to just this
          footer (not the whole `KeyboardAvoidingView` screen, which can't itself become a
          `SafeAreaView` without losing its keyboard-avoidance behavior) — same scoping
          `ChapterChatComposer.tsx` already uses for its own footer bar. */}
      <SafeAreaView edges={['bottom']} style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
        {step > 1 && (
          <Pressable
            onPress={() => {
              setSubmitError(null);
              setStep(s => s - 1);
              scrollYRef.current = 0;
              scrollRef.current?.scrollTo({ y: 0, animated: false });
            }}
            disabled={advancing || submitting}
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.xl, borderWidth: borderWidth.thin },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>← Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={goNext}
          disabled={advancing || submitting}
          style={({ pressed }) => [
            styles.nextButton,
            { backgroundColor: '#182E43', borderRadius: radius.xl, opacity: advancing || submitting ? 0.7 : 1 },
            pressed && !(advancing || submitting) && styles.pressed,
          ]}
        >
          {advancing || submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>
              {step === TOTAL_STEPS ? 'Submit Campaign →' : 'Continue →'}
            </Text>
          )}
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 11,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingBottom: 12,
  },
  headerIconWell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 19,
    marginTop: 2,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  body: {
    padding: 16,
    // Base bottom padding only — the extra room needed to scroll a field clear of the keyboard is
    // added dynamically via `keyboardHeight` at the call site (see `CreateCampaignWizard`'s own
    // doc comment on why: a static over-provisioned value here left a permanent gap once the
    // keyboard closed).
    paddingBottom: 24,
  },
  submitErrorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  submitErrorText: {
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    gap: 9,
    padding: 16,
  },
  backButton: {
    height: 48,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
