import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../../../theme';
import { Icon } from '../../icons/Icon';
import { PickedFile } from '../../../components';
import { Measurable, OTHER_SPECIFY_SUB, MAX_ETA_CHAPTERS, ROLE_TYPE_MAP } from '../../../screens/onboarding/constants';
import { EtaChapter, getSuggestedEtaChapters, searchEtaChapters } from '../../../api/eta';
import { getInterestSuggestions, saveInterests } from '../../../api/interests';
import { getGeographiesGrouped, getIndustriesGrouped } from '../../../api/lookup';
import { uploadDocument } from '../../../api/profile';
import { submitRoleProfile } from '../../../api/auth';
import { createDualProfile } from '../../../api/dual-profile';
import { ME_QUERY_KEY } from '../../../api/queryKeys';
import { isStep4Complete, ROLE_CONFIG } from '../../../screens/onboarding/roleConfig';
import { StepGetStarted } from './StepGetStarted';
import { StepChooseRole } from './StepChooseRole';
import { StepSelectEtas } from './StepSelectEtas';
import { StepBusinessDetails } from './StepBusinessDetails';
import { StepPayment } from './StepPayment';
import { StepConfirmation } from './StepConfirmation';
import { DualProfileDraft, EMPTY_DUAL_PROFILE_DRAFT, WIZARD_STEPS } from './types';

// Matches webSrc's `UnifiedRoleForm.tsx` literal fallbacks — same defaults `OnboardingScreen.tsx`
// uses for its own Financial Criteria sliders before the user has touched them.
const RANGE_DEFAULTS: Record<'rev' | 'ebitda' | 'ev', [number, number]> = {
  rev: [0, 50],
  ebitda: [0, 10],
  ev: [0, 50],
};

// How much clearance `handleFieldFocus` tries to scroll a `FieldDropdown` up to before opening it
// (leaves room for the popup's own `DEFAULT_MAX_HEIGHT`, see `FieldDropdown.tsx`, plus the
// footer). A field near the end of a step's content (Choose Role's "Sub category" is the very
// last thing in that step) has nowhere to scroll *to* without extra room: the `ScrollView` is
// already at its max scroll extent there, so asking it to scroll further is a silent no-op —
// nothing moves, and the popup still opens cramped.
//
// Reserving this much bottom padding *permanently* first fixed the popup but broke ordinary
// scrolling everywhere else — a large dead-space gap at the bottom of every step, even with no
// dropdown involved. Instead, `extraScrollSpace` below grows the content by exactly this much
// only while `handleFieldFocus` needs the room, and `handleFieldBlur` (the popup's `onFieldBlur`,
// fired when it closes) shrinks it back to 0 immediately after — so the extra space only exists
// for the brief window a dropdown near the bottom is actually open.
const DROPDOWN_SCROLL_CLEARANCE = 340;
const BASE_BODY_PADDING_BOTTOM = 40;
// Top-up spacer for Payment's Card/Expiry/CVC fields — see `handleCardFieldFocus`'s doc comment.
// Deliberately a modest fraction of a real keyboard's height, not the full height: the library's
// own `enableOnAndroid` padding already covers most of the room needed (it's just stale, sized
// for whichever field was focused when the keyboard first opened, not the current one) — a full
// extra keyboard-height on top of that nearly doubled it and produced a large empty gap.
const KEYBOARD_FIELD_TOPUP = 140;

/**
 * Create Dual Profile — step-state-machine wizard content. Header/footer chrome matches the real
 * mockup exactly (`standalone/TSB ProfileLast.html`'s `dpOpen` block, decoded and read directly —
 * not guessed from `CreateEventWizard.tsx`'s different chrome, an earlier mistake this file
 * corrects): a back-chevron button (always closes the wizard from step 1, same as the X) + the
 * current step's own name as the title (no fixed title/subtitle), a "STEP N OF 5" / step-name
 * row, and a 5-segment horizontal progress bar (not numbered dots) — see `dpBack`/`dpClose`/
 * `dpProgress`/`dpShowBack` in the decoded source. Plain screen content, not a `Modal` — see
 * `types.ts`'s `CreateDualProfile` doc comment for why.
 *
 * Phase 4 (this phase) adds `payment` + the real submit + `StepConfirmation` — every real step
 * body is now built, so the "not built yet" toast fallback from earlier phases is gone.
 *
 * `payment` has no advance requirement — confirmed directly against real web's
 * `create-dual-profile/page.tsx` `canNext()`
 * (`if (step === 2) return form.roleType !== "" && form.subCategory !== ""; return true;`), and
 * Payment's own card fields are never even read by `handleSubmit`.
 *
 * `businessDetails` DOES validate on web, despite that same outer `canNext()` — an earlier
 * version of this file missed that real web's step 4 hides its outer footer entirely
 * (`"Footer buttons — hidden on step 4 (UnifiedRoleForm has its own navigation)"`) and delegates
 * to `UnifiedRoleForm`'s own internal two-step validation instead, which blocks its own Next/
 * Complete and shows red inline messages (e.g. "Revenue range is required") until required
 * fields are filled. `handleNext`/`businessDetailsAError`/`isStep4Complete` below mirror that:
 * Part A requires designation/org name/≥1 interest (matching `UnifiedRoleForm`'s step-1
 * `validateStep`); Part B reuses onboarding's own `isStep4Complete` (industries/geography/
 * role-fields/deal-range) since it already encodes the same requirements
 * `UnifiedRoleForm`'s step-2 `validateStep` does. Shown via one banner (matching onboarding's
 * own single-message-per-step convention) plus per-slider red text on the three Financial
 * Criteria sliders specifically (`rangeErrors` below, passed into `Step4Fields`), matching web's
 * exact per-field messages there.
 *
 * Confirmation reuses the same header chrome as the 5 numbered steps (clamped to "STEP 5 OF 5" /
 * "ALL SET", full gold bar) rather than hiding it — matches the decoded mockup's own
 * `dpStepNum: step > 5 ? 5 : step` clamp exactly; see `StepConfirmation.tsx`'s doc comment for why
 * its *content* still follows the phone mockup over real web's separate desktop confirmation page.
 */
export function CreateDualProfileWizard({
  currentName,
  currentImageUri,
  currentRoleLabel,
  onClose,
}: {
  currentName?: string | null;
  currentImageUri?: string | null;
  /** Mobile's own role label (e.g. `'Searcher'`) for the account's *existing* profile — used to
   * disable that role + show a "Current role" badge on Choose Role, and in Get Started's profile
   * strip. */
  currentRoleLabel?: string;
  onClose: () => void;
}) {
  const { colors, fonts, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<DualProfileDraft>(EMPTY_DUAL_PROFILE_DRAFT);

  const patch = (next: Partial<DualProfileDraft>) => setDraft(prev => ({ ...prev, ...next }));

  // Scroll-into-view for `FieldDropdown`s that can land close to the screen bottom (Choose
  // Role's "Sub category" — the last field after the 8-card role grid — and Business Details'
  // "Your role / designation") — same `onFieldFocus` pattern `OnboardingScreen.tsx` uses for its
  // own text fields hiding behind the keyboard, adapted for a dropdown popup instead: scroll the
  // field further up so there's real room below it, instead of letting the popup either overflow
  // the screen or flip upward and cover the field itself (both tried, both worse than this).
  //
  // `extraScrollSpace` (0 normally) grows to `DROPDOWN_SCROLL_CLEARANCE` only while this is
  // running — see the constant's own doc comment above for why it can't just be permanent
  // padding — and `handleFieldBlur` (wired to the popup's `onFieldBlur`, fired when it closes)
  // shrinks it back to 0 right after.
  //
  // `handleFieldFocus` returns a Promise — `FieldDropdown` awaits it before opening the popup,
  // so this must not resolve until every step (growing the padding, then scrolling) has actually
  // been applied, not just requested. Uses `animated: false` for the scroll deliberately: an
  // animated scroll wouldn't have settled by the time the following `requestAnimationFrame`s
  // fire, and there's no callback for "animation finished" on `ScrollView.scrollTo` to await
  // instead.
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const [extraScrollSpace, setExtraScrollSpace] = useState(0);

  const waitAFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  const handleFieldFocus = async (fieldRef: React.RefObject<Measurable | null>): Promise<void> => {
    const field = fieldRef.current;
    if (!field) return;

    setExtraScrollSpace(DROPDOWN_SCROLL_CLEARANCE);
    // Two frames for the padding change to actually re-layout the ScrollView's content before
    // scrolling into the newly-available space — one frame risks the scroll below still clamping
    // to the pre-growth extent (the exact bug this whole thing exists to avoid), since a state
    // update isn't guaranteed to have reflowed native layout by the very next frame.
    await waitAFrame();
    await waitAFrame();

    await new Promise<void>(resolve => {
      field.measureInWindow((_x, y, _width, height) => {
        const windowHeight = Dimensions.get('window').height;
        const shortfall = DROPDOWN_SCROLL_CLEARANCE - (windowHeight - (y + height));
        if (shortfall <= 0) {
          resolve();
          return;
        }
        scrollRef.current?.scrollToPosition(0, scrollOffsetRef.current + shortfall, false);
        resolve();
      });
    });
    // Two more frames for the instant scroll to actually land natively before the caller
    // re-measures — matches `OnboardingScreen.tsx`'s own scroll-then-measure margin.
    await waitAFrame();
    await waitAFrame();
  };

  const handleFieldBlur = () => {
    setExtraScrollSpace(0);
  };

  // Keyboard-clear for Payment's Card number/Expiry/CVC fields (the last fields on that step).
  //
  // Three earlier versions of this all failed in instructive ways:
  // 1. Computed "how far to scroll" from the field's own measured position vs. the keyboard's
  //    height (`measureInWindow` + `Dimensions.get('window')`), matching `OnboardingScreen.tsx`'s
  //    own fix for its LinkedIn/City fields. Didn't work reliably here — likely because
  //    `Dimensions.get('window').height` doesn't reliably reflect the window on Android *after*
  //    `windowSoftInputMode="adjustResize"` has already shrunk it, while `measureInWindow`'s
  //    coordinates are read against whatever the window's *current* (already-shrunk) size is —
  //    mixing two coordinate systems.
  // 2. Added a spacer `View` sized to the *full* keyboard height, reasoning it needed real scroll
  //    room the way `extraScrollSpace` does for the dropdown case. Produced a large empty gap —
  //    the library's own `enableOnAndroid` padding already covers *most* of the room needed, so
  //    a full extra keyboard-height on top of that nearly doubled it.
  // 3. Removed the spacer entirely, trusting `enableOnAndroid`'s own padding alone. Went back to
  //    hidden — that padding is calculated once, off `keyboardDidShow`, using whichever field was
  //    focused *at that moment* (Card number, sized correctly for a field higher up); it never
  //    recalculates as focus moves to Expiry/CVC, which need more room than Card number did.
  //
  // `KEYBOARD_FIELD_TOPUP` is the reconciliation: a modest, fixed top-up on top of whatever
  // (possibly-stale, but non-zero) padding the library already left in place — not zero (attempt
  // 3's failure), not a full keyboard height (attempt 2's failure).
  const [keyboardFieldSpace, setKeyboardFieldSpace] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardFieldSpace(KEYBOARD_FIELD_TOPUP));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardFieldSpace(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleCardFieldFocus = () => {
    const scrollToEnd = () => scrollRef.current?.scrollToEnd(true);
    requestAnimationFrame(scrollToEnd);
    setTimeout(scrollToEnd, 120);
  };

  // Select ETAs — mirrors `OnboardingScreen.tsx`'s own ETA state shape/search-debounce exactly
  // (same `getSuggestedEtaChapters`/`searchEtaChapters` calls, same 150ms-debounced query-cache
  // search), except fetched unconditionally on mount instead of gated behind a `completeProfile`
  // call: this account already has a saved location (it's an existing user adding a second
  // role), so there's no "profile not saved yet" race to wait out here.
  const [etaQuery, setEtaQuery] = useState('');
  const [etaChaptersLoading, setEtaChaptersLoading] = useState(true);
  const [suggestedChapters, setSuggestedChapters] = useState<EtaChapter[]>([]);
  const [etaSearchResults, setEtaSearchResults] = useState<EtaChapter[] | null>(null);
  const [etaSearching, setEtaSearching] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<Record<string, EtaChapter>>({});
  const etaSearchCache = useRef<Map<string, EtaChapter[]>>(new Map());

  useEffect(() => {
    getSuggestedEtaChapters()
      .then(({ suggested }) => setSuggestedChapters(suggested))
      .catch(() => {
        Toast.show({ type: 'error', text1: 'Failed to load ETA chapters. Try again.' });
      })
      .finally(() => setEtaChaptersLoading(false));
  }, []);

  useEffect(() => {
    const trimmed = etaQuery.trim();
    if (!trimmed) {
      setEtaSearchResults(null);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    const cached = etaSearchCache.current.get(cacheKey);
    if (cached) {
      setEtaSearchResults(cached);
      return;
    }

    const localMatch = suggestedChapters.filter(c => c.name.toLowerCase().includes(cacheKey));
    if (localMatch.length > 0) setEtaSearchResults(localMatch);

    const timer = setTimeout(async () => {
      setEtaSearching(true);
      try {
        const results = await searchEtaChapters(trimmed);
        etaSearchCache.current.set(cacheKey, results);
        setEtaSearchResults(results);
      } catch {
        if (localMatch.length === 0) setEtaSearchResults([]);
      } finally {
        setEtaSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [etaQuery, suggestedChapters]);

  const toggleEtaChapter = (chapter: EtaChapter) => {
    setSelectedChapters(prev => {
      let next = prev;
      if (prev[chapter.id]) {
        next = { ...prev };
        delete next[chapter.id];
      } else if (Object.keys(prev).length >= MAX_ETA_CHAPTERS) {
        Toast.show({ type: 'info', text1: `You can select up to ${MAX_ETA_CHAPTERS} cities.` });
        return prev;
      } else {
        next = { ...prev, [chapter.id]: chapter };
      }
      patch({ chapterIds: Object.keys(next) });
      return next;
    });
  };

  // Business Details — Part A's Suggested Interests, role-scoped exactly like onboarding's own
  // Step 3 (`getInterestSuggestions`, re-fetched whenever the chosen role/sub-category changes).
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);

  useEffect(() => {
    if (!draft.roleType) {
      setInterestSuggestions([]);
      return;
    }
    let cancelled = false;
    setInterestsLoading(true);
    getInterestSuggestions(ROLE_TYPE_MAP[draft.roleType] ?? draft.roleType, draft.subCategory)
      .then(list => {
        if (!cancelled) setInterestSuggestions(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setInterestsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [draft.roleType, draft.subCategory]);

  // Business Details — Part B, mirrors `OnboardingScreen.tsx`'s own Step 4 state exactly
  // (`uploads`/`uploadingKey` stay local UI-only state, same as there — `draft.uploadedUrls` is
  // what actually gets submitted).
  const [businessSubStep, setBusinessSubStep] = useState<'a' | 'b'>('a');
  const [industryGrouped, setIndustryGrouped] = useState<Record<string, string[]>>({});
  const [geographyGrouped, setGeographyGrouped] = useState<Record<string, string[]>>({});
  const [lookupLoading, setLookupLoading] = useState(true);
  const [uploads, setUploads] = useState<Record<string, PickedFile | null>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getIndustriesGrouped(), getGeographiesGrouped()])
      .then(([ind, geo]) => {
        if (cancelled) return;
        setIndustryGrouped(ind);
        setGeographyGrouped(geo);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLookupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleChipValue = (key: string, option: string) => {
    setDraft(prev => {
      const current = prev.chipValues[key] ?? [];
      const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
      return { ...prev, chipValues: { ...prev.chipValues, [key]: next } };
    });
  };

  const toggleIndustry = (option: string) => {
    setDraft(prev => ({
      ...prev,
      industries: prev.industries.includes(option) ? prev.industries.filter(o => o !== option) : [...prev.industries, option],
    }));
  };

  const toggleGeography = (option: string) => {
    setDraft(prev => ({
      ...prev,
      geographyFocus: prev.geographyFocus.includes(option)
        ? prev.geographyFocus.filter(o => o !== option)
        : [...prev.geographyFocus, option],
    }));
  };

  const toggleInterest = (item: string) => {
    setDraft(prev => ({
      ...prev,
      interests: prev.interests.includes(item) ? prev.interests.filter(i => i !== item) : [...prev.interests, item],
    }));
  };

  // Matches `OnboardingScreen.tsx`'s `setUpload` exactly: uploads immediately on pick (not
  // deferred to the final submit), storing the resulting URL in `draft.uploadedUrls` separately
  // from `uploads` (which just tracks what's locally picked, for display).
  const setUpload = async (key: string, file: PickedFile | null) => {
    setUploads(prev => ({ ...prev, [key]: file }));
    if (!file) {
      patch({ uploadedUrls: Object.fromEntries(Object.entries(draft.uploadedUrls).filter(([k]) => k !== key)) });
      return;
    }

    const fileType = ROLE_CONFIG[draft.roleType]?.uploads.find(u => u.key === key)?.fileType ?? key;
    setUploadingKey(key);
    try {
      const { fileUrl } = await uploadDocument(file, fileType);
      setDraft(prev => ({ ...prev, uploadedUrls: { ...prev.uploadedUrls, [key]: fileUrl } }));
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.response?.data?.error ?? err.message
        : 'Please try again.';
      Toast.show({ type: 'error', text1: 'Upload failed', text2: message });
      setUploads(prev => ({ ...prev, [key]: null }));
    } finally {
      setUploadingKey(null);
    }
  };

  // Payment — cosmetic-only local state (never read by `handleSubmit`, see `StepPayment.tsx`'s
  // doc comment), except `billingCycle`, which lives on `draft` since it's the one field here
  // that's at least display-relevant to a future profile-switcher/plan-management feature.
  const [payMethod, setPayMethod] = useState<'card' | 'ach' | 'invoice'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const step = WIZARD_STEPS[stepIndex];
  // Matches the mockup's `dpShowBack` (`step > 1 && step < 6`) — no Back button at all on step 1
  // or on the Confirmation screen, just the header's chevron/X (both close/step-back from there).
  const showBackButton = stepIndex > 0 && !submitted;

  const canNext = (() => {
    if (step.id === 'chooseRole') {
      // Matches real web exactly (`create-dual-profile/page.tsx`'s `canNext`): only role +
      // sub-category are required, no requirement on the "Other" free-text value.
      return draft.roleType !== '' && draft.subCategory !== '';
    }
    return true;
  })();

  // Business Details validation — see the header comment above for why this exists and what it
  // mirrors. `businessDetailsAttempted` gates whether errors are actually *shown* (matches
  // onboarding's own "only after a failed Continue tap" convention, not a preemptively-disabled
  // button); the error values themselves are always computed live off current `draft` state, so
  // as soon as the user fixes the offending field the message disappears on its own without
  // needing an explicit "clear on edit" handler.
  const [businessDetailsAttempted, setBusinessDetailsAttempted] = useState(false);
  const roleConfigEntry = ROLE_CONFIG[draft.roleType];
  const businessDetailsAError = !draft.designation
    ? 'Your role / designation is required.'
    : !draft.orgName.trim()
    ? 'Organization / company name is required.'
    : !draft.interests.length
    ? 'Please select at least one interest.'
    : null;
  const dealRangesTouched = draft.revRange !== null && draft.ebitdaRange !== null && draft.evRange !== null;
  const businessDetailsBValid = isStep4Complete(
    draft.roleType,
    draft.fieldValues,
    draft.chipValues,
    draft.industries,
    draft.geographyFocus,
    dealRangesTouched,
  );
  const businessDetailsError =
    businessDetailsAttempted && step.id === 'businessDetails'
      ? businessSubStep === 'a'
        ? businessDetailsAError
        : businessDetailsBValid
        ? null
        : 'Complete the required fields for your role.'
      : null;
  const rangeErrors =
    businessDetailsAttempted && roleConfigEntry?.hasDealRange
      ? {
          rev: draft.revRange === null ? 'Revenue range is required' : undefined,
          ebitda: draft.ebitdaRange === null ? 'EBITDA range is required' : undefined,
          ev: draft.evRange === null ? 'Enterprise value range is required' : undefined,
        }
      : undefined;

  const handleRoleChange = (role: string) => {
    if (role === draft.roleType) return;
    // Sub-category options depend on the selected role, so switching roles clears whatever was
    // picked for the previous one rather than leaving a now-invalid selection in place.
    patch({ roleType: role, subCategory: '', subCategoryOther: '' });
  };

  // Matches real web's `handleSubmit` exactly: `createDualProfile` (the dual-profile-specific
  // fields) followed by the same `submitRoleProfile` call onboarding's own Step 4 makes (the
  // role-specific `formData`), then a fire-and-forget `saveInterests` — see
  // `create-dual-profile/page.tsx`'s `handleSubmit` for the field-by-field mapping this mirrors.
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const subCategory =
        draft.subCategory === OTHER_SPECIFY_SUB ? draft.subCategoryOther.trim() || 'Other' : draft.subCategory;

      await createDualProfile({
        role_type: ROLE_TYPE_MAP[draft.roleType] ?? draft.roleType,
        sub_category: subCategory,
        bio: draft.bio || undefined,
        org_role: draft.designation || undefined,
        org_name: draft.orgName || undefined,
        chapter_ids: draft.chapterIds.length > 0 ? draft.chapterIds : undefined,
      });

      const config = ROLE_CONFIG[draft.roleType];
      const formData: Record<string, unknown> = {
        role: draft.designation,
        organizationName: draft.orgName,
        interests: draft.interests,
        ...draft.fieldValues,
        ...draft.chipValues,
        industries: draft.industries,
        geographyFocus: draft.geographyFocus,
      };
      if (config?.hasOrgWebsite) formData.organizationWebsite = draft.orgWebsite;
      if (config?.hasDealRange && draft.revRange && draft.ebitdaRange && draft.evRange) {
        formData.revenueMin = String(draft.revRange[0]);
        formData.revenueMax = String(draft.revRange[1]);
        formData.ebitdaMin = String(draft.ebitdaRange[0]);
        formData.ebitdaMax = String(draft.ebitdaRange[1]);
        formData.minEV = String(draft.evRange[0]);
        formData.maxEV = String(draft.evRange[1]);
      }
      config?.uploads.forEach(u => {
        if (draft.uploadedUrls[u.key]) formData[u.key] = draft.uploadedUrls[u.key];
      });
      await submitRoleProfile(ROLE_TYPE_MAP[draft.roleType] ?? draft.roleType, formData);

      if (draft.interests.length) {
        saveInterests(draft.interests).catch(() => null);
      }

      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
      setSubmitting(false);
      setSubmitted(true);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? err.response?.data?.message ?? err.message
        : 'Something went wrong. Please try again.';
      Toast.show({ type: 'error', text1: 'Could not activate your dual profile', text2: message });
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!canNext) return;
    if (step.id === 'businessDetails' && businessSubStep === 'a') {
      if (businessDetailsAError) {
        setBusinessDetailsAttempted(true);
        return;
      }
      setBusinessDetailsAttempted(false);
      setBusinessSubStep('b');
      return;
    }
    if (step.id === 'businessDetails' && businessSubStep === 'b') {
      if (!businessDetailsBValid) {
        setBusinessDetailsAttempted(true);
        return;
      }
      setBusinessDetailsAttempted(false);
      setStepIndex(i => i + 1);
      return;
    }
    if (step.id === 'payment') {
      handleSubmit();
      return;
    }
    setStepIndex(i => i + 1);
  };

  // Matches the mockup's `dpBack`: steps back one at a time, closes the wizard from step 1, and
  // returns from Confirmation to Payment — shared by both the header's back-chevron and the
  // footer's "← Back" button.
  const handleBack = () => {
    if (submitted) {
      setSubmitted(false);
      return;
    }
    if (step.id === 'businessDetails' && businessSubStep === 'b') {
      setBusinessDetailsAttempted(false);
      setBusinessSubStep('a');
      return;
    }
    if (stepIndex === 0) {
      onClose();
      return;
    }
    setBusinessDetailsAttempted(false);
    setStepIndex(i => i - 1);
  };

  const handleDone = () => {
    onClose();
    Toast.show({ type: 'success', text1: 'Dual profile is live ✓' });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.pageBg, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={({ pressed }) => [
              styles.iconButton,
              { borderColor: colors.border, borderWidth: borderWidth.thin, backgroundColor: colors.surface2, borderRadius: radius.md },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.backIcon}>
              <Icon name="chevronRight" size={13} color={colors.ink2} />
            </View>
          </Pressable>
          <Text style={[fonts.display, styles.title, { color: colors.ink }]} numberOfLines={1}>
            {submitted ? 'All set' : step.label}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: colors.surfaceSunken, borderRadius: radius.pill },
              pressed && styles.pressed,
            ]}
          >
            <Icon name="close" size={13} color={colors.ink2} />
          </Pressable>
        </View>

        <View style={styles.stepLabelRow}>
          <Text style={[fonts.bold, styles.stepIndex, { color: colors.ink3 }]}>
            STEP {submitted ? WIZARD_STEPS.length : stepIndex + 1} OF {WIZARD_STEPS.length}
          </Text>
          <Text style={[fonts.bold, styles.stepIndex, { color: colors.goldDark }]}>
            {submitted
              ? 'ALL SET'
              : // Matches the mockup's `dpSubNote` exactly: this right-hand label repeats the
              // step name at every other step, but shows "Part N of 2" during Business Details
              // instead of "Business Details" twice — its two sub-steps aren't separate entries
              // in `WIZARD_STEPS`, so this is the only place that distinction is surfaced.
              step.id === 'businessDetails'
              ? `PART ${businessSubStep === 'a' ? 1 : 2} OF 2`
              : step.label.toUpperCase()}
          </Text>
        </View>
        <View style={styles.progressRow}>
          {WIZARD_STEPS.map((s, i) => (
            <View
              key={s.id}
              style={[
                styles.progressSegment,
                { backgroundColor: i <= (submitted ? WIZARD_STEPS.length - 1 : stepIndex) ? colors.gold : colors.border },
              ]}
            />
          ))}
        </View>
      </View>

      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={20}
        keyboardOpeningTime={0}
        onScroll={e => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        {step.id === 'getStarted' && (
          <StepGetStarted currentName={currentName} currentImageUri={currentImageUri} currentRoleLabel={currentRoleLabel} />
        )}
        {step.id === 'chooseRole' && (
          <StepChooseRole
            currentRoleLabel={currentRoleLabel}
            roleType={draft.roleType}
            subCategory={draft.subCategory}
            subCategoryOther={draft.subCategoryOther}
            onRoleChange={handleRoleChange}
            onSubCategoryChange={value => patch({ subCategory: value, subCategoryOther: value === OTHER_SPECIFY_SUB ? draft.subCategoryOther : '' })}
            onSubCategoryOtherChange={value => patch({ subCategoryOther: value })}
            onSubCategoryFieldFocus={handleFieldFocus}
            onSubCategoryFieldBlur={handleFieldBlur}
          />
        )}
        {step.id === 'selectEtas' && (
          <StepSelectEtas
            roleLabel={draft.roleType}
            query={etaQuery}
            onQueryChange={setEtaQuery}
            chapters={etaSearchResults ?? suggestedChapters}
            selectedCount={Object.keys(selectedChapters).length}
            selectedIds={new Set(Object.keys(selectedChapters))}
            loading={etaChaptersLoading || etaSearching}
            onToggle={toggleEtaChapter}
          />
        )}
        {step.id === 'businessDetails' && (
          <StepBusinessDetails
            subStep={businessSubStep}
            roleLabel={draft.roleType}
            bio={draft.bio}
            onBioChange={value => patch({ bio: value })}
            designation={draft.designation}
            onDesignationChange={value => patch({ designation: value })}
            onDesignationFieldFocus={handleFieldFocus}
            onDesignationFieldBlur={handleFieldBlur}
            orgName={draft.orgName}
            onOrgNameChange={value => patch({ orgName: value })}
            interests={draft.interests}
            interestOptions={interestSuggestions}
            interestsLoading={interestsLoading}
            onInterestsToggle={toggleInterest}
            fieldValues={draft.fieldValues}
            onFieldChange={(key, value) => setDraft(prev => ({ ...prev, fieldValues: { ...prev.fieldValues, [key]: value } }))}
            chipValues={draft.chipValues}
            onChipToggle={toggleChipValue}
            industries={draft.industries}
            industryGrouped={industryGrouped}
            onIndustriesToggle={toggleIndustry}
            geographyFocus={draft.geographyFocus}
            geographyGrouped={geographyGrouped}
            onGeographyToggle={toggleGeography}
            lookupLoading={lookupLoading}
            orgWebsite={draft.orgWebsite}
            onOrgWebsiteChange={value => patch({ orgWebsite: value })}
            revRange={draft.revRange ?? RANGE_DEFAULTS.rev}
            ebitdaRange={draft.ebitdaRange ?? RANGE_DEFAULTS.ebitda}
            evRange={draft.evRange ?? RANGE_DEFAULTS.ev}
            onRevChange={(lo, hi) => patch({ revRange: [lo, hi] })}
            onEbitdaChange={(lo, hi) => patch({ ebitdaRange: [lo, hi] })}
            onEvChange={(lo, hi) => patch({ evRange: [lo, hi] })}
            uploads={uploads}
            onUploadChange={setUpload}
            uploadingKey={uploadingKey}
            rangeErrors={rangeErrors}
          />
        )}
        {submitted ? (
          <StepConfirmation
            currentName={currentName}
            currentImageUri={currentImageUri}
            currentRoleLabel={currentRoleLabel}
            newRoleLabel={draft.roleType}
          />
        ) : (
          step.id === 'payment' && (
            <StepPayment
              billingCycle={draft.billingCycle}
              onBillingCycleChange={value => patch({ billingCycle: value })}
              payMethod={payMethod}
              onPayMethodChange={setPayMethod}
              cardNumber={cardNumber}
              onCardNumberChange={setCardNumber}
              cardExpiry={cardExpiry}
              onCardExpiryChange={setCardExpiry}
              cardCvc={cardCvc}
              onCardCvcChange={setCardCvc}
              onFieldFocus={handleCardFieldFocus}
            />
          )
        )}
        {/* Real spacer, not extra `contentContainerStyle` padding — `KeyboardAwareScrollView`'s
            own `enableOnAndroid` mode rewrites `contentContainerStyle` on Android, appending its
            own `{paddingBottom: keyboardSpace}` as the *last* style in the merged array, which
            silently discarded any paddingBottom this component tried to set here itself (0 when
            no keyboard is open — exactly the dropdown-tap case, reintroducing the original
            "no room to scroll into" bug this space exists to prevent). A real child View's height
            isn't something the library's style rewriting touches at all. */}
        <View style={{ height: extraScrollSpace }} />
        {/* Modest keyboard top-up for Payment's Card/Expiry/CVC — see `handleCardFieldFocus`'s
            doc comment for the full reasoning (why this is a small fixed value, not 0 and not a
            full keyboard height). Same "real child View" reasoning as the spacer above. */}
        <View style={{ height: keyboardFieldSpace }} />
      </KeyboardAwareScrollView>

      {businessDetailsError ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.authErrorBg, borderColor: colors.authErrorBorder }]}>
          <Text style={[fonts.medium, styles.errorBannerText, { color: colors.authErrorText }]}>{businessDetailsError}</Text>
        </View>
      ) : null}

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin, paddingBottom: 16 + insets.bottom }]}>
        {showBackButton && (
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg, backgroundColor: colors.surface2 },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[fonts.semibold, styles.backLabel, { color: colors.ink2 }]}>← Back</Text>
          </Pressable>
        )}
        <Pressable
          onPress={submitted ? handleDone : handleNext}
          disabled={submitting}
          style={({ pressed }) => [
            styles.nextButton,
            { borderRadius: radius.lg, backgroundColor: canNext && !submitting ? '#182E43' : colors.surfaceSunken },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[fonts.bold, styles.nextLabel, { color: canNext && !submitting ? '#fff' : colors.ink3 }]}>
            {submitted
              ? 'Done'
              : step.id === 'getStarted'
              ? 'Get started'
              : step.id === 'businessDetails' && businessSubStep === 'b'
              ? 'Continue to payment'
              : step.id === 'payment'
              ? submitting
                ? 'Activating…'
                : `Pay ${draft.billingCycle === 'annual' ? '$378' : '$49'} & Activate`
              : 'Continue'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 18, lineHeight: 22, letterSpacing: -0.2 },
  iconButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  backIcon: { transform: [{ scaleX: -1 }] },
  stepLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, marginBottom: 6 },
  stepIndex: { fontSize: 10, letterSpacing: 0.7 },
  progressRow: { flexDirection: 'row', gap: 4 },
  progressSegment: { flex: 1, height: 4, borderRadius: 2 },
  body: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: BASE_BODY_PADDING_BOTTOM },
  errorBanner: { marginHorizontal: 16, marginTop: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  errorBannerText: { fontSize: 12.5 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, paddingTop: 11 },
  backButton: { flexDirection: 'row', alignItems: 'center', height: 48, paddingHorizontal: 18 },
  backLabel: { fontSize: 13 },
  nextButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  nextLabel: { fontSize: 14.5 },
  pressed: { opacity: 0.65 },
});
