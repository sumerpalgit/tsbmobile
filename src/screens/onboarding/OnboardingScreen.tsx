import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronLeft, ChevronRight, Flag, Lock, Shield, UserX } from 'lucide-react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';
import { PickedFile, PrimaryButton } from '../../components';
import { useAuth } from '../../store/AuthContext';
import { checkLinkedin, completeProfile, submitRoleProfile } from '../../api/auth';
import { batchJoinEtaChapters, EtaChapter, getSuggestedEtaChapters, searchEtaChapters } from '../../api/eta';
import { getInterestSuggestions, saveInterests } from '../../api/interests';
import { getIndustriesGrouped, getGeographiesGrouped } from '../../api/lookup';
import { getMe, uploadDocument } from '../../api/profile';
import {
  LINKEDIN_PATTERN,
  MAX_ETA_CHAPTERS,
  Measurable,
  ROLE_TYPE_MAP,
  Step,
  STEP_LABELS,
} from './constants';
import { isStep4Complete, ROLE_CONFIG } from './roleConfig';
import {
  CitySelection,
  GroundRuleCard,
  RoleSheet,
  Step1Fields,
  Step2Fields,
  Step3Fields,
  Step4Fields,
} from './components';

const AUTH_LOGO = require('../../assets/images/AuthLogo.png');

/** Per-step heading + subtitle, as in the design's `titles` map — steps without an entry
 * (Step 3/4) fall back to the generic "Step N · Label" heading. */
const STEP_COPY: Partial<Record<Step, [string, string]>> = {
  1: ['What brings you to The Search Bridge?', "We'll personalize your experience based on your role."],
  2: ['Step Into a City That Thinks Ahead', "Pick your preferred cities — we'll customize accordingly."],
};

/** Step 5 — matches webSrc's `/onboarding-rules` gate page verbatim (copy, order, icons inferred
 * from its screenshot since the source SVGs aren't in this checkout). Not part of the numbered
 * Basic Info/ETAs/Business Details wizard on web either — same here, hence no `STEP_COPY` entry. */
const GROUND_RULES: { icon: typeof Shield; title: string; description: string }[] = [
  {
    icon: Shield,
    title: 'Use your real identity',
    description:
      'You must register and operate using your true name and accurate professional credentials. Any form of impersonation, misrepresentation, or incomplete disclosure will lead to immediate suspension or permanent removal from the platform.',
  },
  {
    icon: Lock,
    title: 'Maintain strict confidentiality',
    description:
      'All information on The Search Bridge is confidential and protected under platform-wide NDA obligations. You are strictly prohibited from sharing, copying, or distributing any deal materials, financial data, or participant information outside the platform without explicit authorization.',
  },
  {
    icon: Lock,
    title: 'Participate responsibly in city chapters',
    description:
      'City chapters are designed to enable high-trust, local collaboration. All interactions within chapter groups, events, or discussions must remain professional, relevant, and aligned with platform objectives. Misuse of chapters for unrelated promotion, or unrelated activities is strictly prohibited.',
  },
  {
    icon: UserX,
    title: 'Engage in good faith',
    description:
      'All users are expected to interact with professional integrity, transparency and genuine intent. Spam, unsolicited mass outreach, misrepresentation of intent, or coercive engagement will not be tolerated.',
  },
  {
    icon: Flag,
    title: 'Report violations proactively',
    description:
      'If you encounter fraudulent listings, misrepresentation, or inappropriate behavior, report it immediately using the platform tools. All reports are reviewed promptly, and appropriate action is taken to protect the integrity of the ecosystem.',
  },
  {
    icon: Flag,
    title: 'No misuse of platform insights or data',
    description:
      'You may not use bots, scripts, crawlers, plugins, or any automated means to extract, scrape, or harvest data from The Search Bridge. Any attempt to systematically collect user data, deal information, or platform content will result in immediate suspension and possible legal action.',
  },
];

/** Default starting range for a Financial Criteria slider — matches webSrc's
 * `UnifiedRoleForm.tsx` literal fallbacks (`formData.revenueMax ?? 50` etc.) exactly, not the
 * slider's full bounds. */
const RANGE_DEFAULTS: Record<'rev' | 'ebitda' | 'ev', [number, number]> = {
  rev: [0, 50],
  ebitda: [0, 10],
  ev: [0, 50],
};

function rangeDefault(key: 'rev' | 'ebitda' | 'ev'): [number, number] {
  return RANGE_DEFAULTS[key];
}

/** Matches webSrc's `complete-profile` page's `normalizeLinkedinUrl` exactly — used to compare
 * a typed LinkedIn URL against the signed-in user's already-saved one, ignoring protocol/`www.`/
 * trailing-slash differences that would otherwise make an identical profile look like a
 * mismatch. */
function normalizeLinkedinUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/$/, '');
}

/**
 * Onboarding — mobile port of `TSBOnboarding.html` (repo root), reached
 * after Signup. Built as one component with a `step` state, matching the
 * design file's own architecture (a single wizard, not five separate
 * screens/routes) — steps share a header/stepper/card/footer shell and need
 * to see each other's answers on Back, which a stack of routes would only
 * complicate (see the Login/Signup "roaming" bug this app already hit once
 * from over-using navigation for what's really just view-state).
 *
 * Building this "one step at a time" per request: the shell + all four steps (Step 1: role
 * picker, sub-category, LinkedIn, city; Step 2: search + join ETA chapters; Step 3: designation,
 * organization name, suggested interests; Step 4: role-specific Business Details) are real.
 * Step 5 is the ground-rules gate screen.
 *
 * The design's native `<select>` dropdown for Sub Category is ported via `FieldDropdown`
 * (react-native-element-dropdown), an inline floating-list dropdown — not the bottom-sheet
 * pattern used for the (richer) Category picker. City is a live search instead
 * (`CitySearchField`, same library in search mode, backed by `GET /api/location/cities`) rather
 * than a fixed list, matching web's real autocomplete.
 *
 * LinkedIn also validates live against the backend (`check-linkedin`, debounced 600ms, mirroring
 * web's `complete-profile` page exactly) — Step 1's "Continue" is blocked until that check comes
 * back available, not just regex-shaped.
 *
 * Step 4 is config-driven off `./roleConfig`'s `ROLE_CONFIG`, mirroring web's `UnifiedRoleForm`:
 * one `Step4Fields` component renders whichever fields/sections/uploads the selected role's
 * config declares, instead of 8 hand-built forms. `fieldValues`/`chipValues`/`uploads` below are
 * therefore generic `Record<key, ...>` maps keyed by each field's config key, not individual
 * named state per field — the config is the single source of truth for which keys exist per
 * role. Industries/Geography Focus (Step 4) and Suggested Interests (Step 3) are live API data
 * now too (`src/api/lookup.ts`, `src/api/interests.ts`), same as Step 2's ETA chapters
 * (`src/api/eta.ts`) and Step 1's LinkedIn/city (`check-linkedin`/`location/cities`). Step 3+4's
 * combined fields submit via `submitRoleProfile` (`src/api/auth.ts`, `PUT /auth/{roleEndpoint}`)
 * on Step 4's Continue, matching web's single two-sub-step submit.
 *
 * `ChipMultiSelect` (Step 3's "Suggested Interests", Step 4's Industries/Geography/chip-type
 * fields) and `DualRangeSlider`/`ScrollViewWithScrollbar` (Step 4's Financial Criteria sliders
 * and the Suggestions box's scrollbar) are all deliberately option-list-agnostic /
 * content-agnostic rather than built one-off — RN has no native dual-range slider or
 * desktop-style scrollbar, so these were hand-built once (via `Gesture.Pan()` from
 * `react-native-gesture-handler`, already a dependency for this app's drawer swipe — not the
 * legacy `PanResponder`, which couldn't reliably win the gesture away from the page's own
 * scrolling) and are reusable anywhere else in this app that needs the same pattern.
 *
 * Step 4's uploads use `FileUploadButton` (`src/components`) — a real OS document/photo picker
 * (`@react-native-documents/picker`), one instance per upload key a role's config declares
 * (CIM, pitch deck, resume, etc. — several roles declare none).
 *
 * Each step's body (`Step1Fields`..`Step4Fields`), the role picker, sub-category/city sheets, ETA
 * chapter cards, and their pieces (cards, headers, triggers) each live in their own file under
 * `./components`, each with its own styles — matching how every other screen in this app keeps its
 * `StyleSheet.create` local to itself, and keeping this file from growing into one giant render.
 * This screen still owns all the step state/handlers; the step components are dumb — they render
 * and forward onChange. Shared data (roles, cities, sub-categories, ETA chapters, interests,
 * financial ranges, the `Step` type) lives in `./constants`; per-role Step 4 field/upload
 * definitions live in `./roleConfig`.
 */

function OnboardingScreen() {
  const { colors, fonts, fontSize, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  // Shared by Step 1's complete-profile call and Step 2's batch-join call — only one can be
  // mid-flight at a time in this linear wizard.
  const [submitting, setSubmitting] = useState(false);

  const [role, setRole] = useState('');
  const [sub, setSub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [linkedinStatus, setLinkedinStatus] = useState<{
    checking: boolean;
    valid: boolean | null;
    message: string;
  }>({ checking: false, valid: null, message: '' });
  const [citySelection, setCitySelection] = useState<CitySelection | null>(null);

  // The signed-in user's already-saved LinkedIn (if any) — matches webSrc's
  // `complete-profile` page: lets the debounced check below recognize "this is still just my
  // own LinkedIn" without a false "already in use" result from `check-linkedin`. Fetched once;
  // a failure here just means the bypass isn't available, not a blocking error.
  const [currentUserLinkedin, setCurrentUserLinkedin] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then(user => {
        if (cancelled || !user) return;
        const profile = user.profile as Record<string, unknown> | undefined;
        const linkedinFromApi = String(profile?.linkedin_url ?? profile?.linkedinUrl ?? '').trim();
        if (linkedinFromApi) setCurrentUserLinkedin(linkedinFromApi);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Live `check-linkedin` validation, debounced 600ms — matches webSrc's `complete-profile`
  // page exactly (same debounce, same endpoint, same own-LinkedIn bypass, same message text).
  useEffect(() => {
    const trimmed = linkedin.trim();
    if (!trimmed) {
      setLinkedinStatus({ checking: false, valid: null, message: '' });
      return;
    }
    if (!LINKEDIN_PATTERN.test(trimmed)) {
      setLinkedinStatus({ checking: false, valid: false, message: 'Enter a valid LinkedIn profile URL.' });
      return;
    }

    const normalizedInput = normalizeLinkedinUrl(trimmed);
    const normalizedCurrent = normalizeLinkedinUrl(currentUserLinkedin);
    if (normalizedCurrent && normalizedInput === normalizedCurrent) {
      setLinkedinStatus({ checking: false, valid: true, message: '✅ This is your current LinkedIn profile.' });
      return;
    }

    setLinkedinStatus({ checking: true, valid: null, message: '' });
    const timer = setTimeout(async () => {
      try {
        const result = await checkLinkedin(trimmed);
        if (result.available) {
          setLinkedinStatus({ checking: false, valid: true, message: '✅ LinkedIn profile is available.' });
          return;
        }
        if (normalizedCurrent && normalizedInput === normalizedCurrent) {
          setLinkedinStatus({ checking: false, valid: true, message: '✅ This is your current LinkedIn profile.' });
          return;
        }
        setLinkedinStatus({
          checking: false,
          valid: false,
          message: result.message || 'Invalid or already used LinkedIn profile.',
        });
      } catch (err) {
        // Web's `fetch` never throws on a non-2xx response, so it can always read
        // `data.message` straight off the body. Axios does throw on non-2xx — the backend's
        // "unavailable" result (`{ available: false, message: "..." }`) comes back as a
        // non-2xx status, so without this the real reason gets lost behind a generic message.
        const backendMessage = axios.isAxiosError(err)
          ? (err.response?.data as { message?: string } | undefined)?.message
          : undefined;
        setLinkedinStatus({
          checking: false,
          valid: false,
          message: backendMessage || 'Error checking LinkedIn URL.',
        });
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [linkedin, currentUserLinkedin]);

  const [etaQuery, setEtaQuery] = useState('');
  const [etaChaptersLoading, setEtaChaptersLoading] = useState(false);
  const [suggestedChapters, setSuggestedChapters] = useState<EtaChapter[]>([]);
  const [otherChapters, setOtherChapters] = useState<EtaChapter[]>([]);
  const [etaSearchResults, setEtaSearchResults] = useState<EtaChapter[] | null>(null);
  const [etaSearching, setEtaSearching] = useState(false);
  const [selectedChapters, setSelectedChapters] = useState<Record<string, EtaChapter>>({});
  const etaSearchCache = useRef<Map<string, EtaChapter[]>>(new Map());

  // Matches webSrc's `fetchEtaChapters`: on web this only ever runs once `/join-eta-chapter`
  // mounts, which only happens after `complete-profile`'s POST has already succeeded — so the
  // backend always has the user's location by the time this fires. Since mobile is one
  // component (not separate routed pages), this is called explicitly from `next()` right after
  // Step 1's `completeProfile` succeeds, not on `OnboardingScreen`'s own mount — firing it on
  // mount raced ahead of Step 1 entirely and always hit the backend's "coordinates not found"
  // 400 (falls back to the flat all-chapters list inside `getSuggestedEtaChapters` on failure).
  const fetchEtaSuggestions = () => {
    setEtaChaptersLoading(true);
    getSuggestedEtaChapters()
      .then(({ suggested, others }) => {
        setSuggestedChapters(suggested);
        setOtherChapters(others);
      })
      .catch(() => {
        Toast.show({ type: 'error', text1: 'Failed to load ETA chapters. Try again.' });
      })
      .finally(() => {
        setEtaChaptersLoading(false);
      });
  };

  // Debounced 150ms search, matching webSrc's `join-eta-chapter` page exactly — shows an
  // instant local substring match from what's already loaded while the API call is in flight,
  // then swaps in the server's results; a query-string cache avoids re-hitting the API for a
  // query already searched this session (same as web's `searchCache`).
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

    const localMatch = [...suggestedChapters, ...otherChapters].filter(c =>
      c.name.toLowerCase().includes(cacheKey),
    );
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
  }, [etaQuery, suggestedChapters, otherChapters]);

  // Matches webSrc's `join-eta-chapter` `renderContent` exactly: `suggested` only by default;
  // if the user's Step 1 city/country is known and there's no active search, re-sort
  // `[...suggested, ...others]` so chapters whose name/description mention that city (or whose
  // name mentions the country) sort first — same asymmetric match web uses (country is only
  // checked against the chapter name, not its description). Always capped to the top 4 outside
  // of an active search; an active search replaces the list with `searchResults` entirely.
  const displayedEtaChapters = (() => {
    if (etaSearchResults !== null) return etaSearchResults;

    let list = suggestedChapters;
    if (citySelection) {
      const city = citySelection.city.toLowerCase();
      const country = citySelection.countryName.toLowerCase();
      list = [...suggestedChapters, ...otherChapters].sort((a, b) => {
        const aMatches =
          a.name.toLowerCase().includes(city) ||
          a.description.toLowerCase().includes(city) ||
          a.name.toLowerCase().includes(country);
        const bMatches =
          b.name.toLowerCase().includes(city) ||
          b.description.toLowerCase().includes(city) ||
          b.name.toLowerCase().includes(country);
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }
    return list.slice(0, 4);
  })();

  const [designation, setDesignation] = useState('');
  const [org, setOrg] = useState('');
  const [interests, setInterests] = useState<string[]>([]);

  // Live role-scoped interest suggestions (Step 3) — matches webSrc's `useInterestSuggestions`.
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>([]);
  const [interestsLoading, setInterestsLoading] = useState(false);

  useEffect(() => {
    if (!role) {
      setInterestSuggestions([]);
      return;
    }
    let cancelled = false;
    setInterestsLoading(true);
    getInterestSuggestions(ROLE_TYPE_MAP[role] ?? role, sub)
      .then(list => {
        if (!cancelled) setInterestSuggestions(list);
      })
      .catch(() => {
        // Matches web's `useInterestSuggestions`: fails silently, leaves the list empty.
      })
      .finally(() => {
        if (!cancelled) setInterestsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, sub]);

  // Generic per-role Step 4 state — keyed by whatever field keys the selected role's
  // `ROLE_CONFIG` entry declares (see ./roleConfig), not individual named fields, since the
  // field set itself varies by role.
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [chipValues, setChipValues] = useState<Record<string, string[]>>({});
  const [industries, setIndustries] = useState<string[]>([]);
  const [geographyFocus, setGeographyFocus] = useState<string[]>([]);
  const [orgWebsite, setOrgWebsite] = useState('');
  // `null` until the user actually drags a thumb — matches webSrc's `formData.revenueMin`/etc.
  // staying `undefined` until `onMinChange`/`onMaxChange` fires, which is what makes its Step 4
  // validation ("Revenue range is required") mean anything. `DualRangeSlider` only calls
  // `onChange` from a real drag gesture (never on mount), so "state is non-null" is exactly
  // "user touched this slider" — see `isStep4Complete`'s `dealRangesTouched` check below.
  const [revRange, setRevRange] = useState<[number, number] | null>(null);
  const [ebitdaRange, setEbitdaRange] = useState<[number, number] | null>(null);
  const [evRange, setEvRange] = useState<[number, number] | null>(null);
  const [uploads, setUploads] = useState<Record<string, PickedFile | null>>({});
  // Backend URL returned per uploaded document key (e.g. `cimUrl`), separate from `uploads`
  // (which just tracks what's locally picked) — this is what actually goes in the submit payload.
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Industries/Geography lookup lists (Step 4, shared by every role) — role-agnostic, fetched
  // once, matching webSrc's `useIndustries()`/`useGeographies()`. Grouped shape (not flattened)
  // since both are now real searchable `SearchableMultiSelect`s, matching web's own component.
  const [industryGrouped, setIndustryGrouped] = useState<Record<string, string[]>>({});
  const [geographyGrouped, setGeographyGrouped] = useState<Record<string, string[]>>({});
  const [lookupLoading, setLookupLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getIndustriesGrouped(), getGeographiesGrouped()])
      .then(([ind, geo]) => {
        if (cancelled) return;
        setIndustryGrouped(ind);
        setGeographyGrouped(geo);
      })
      .catch(() => {
        // Matches web's `useIndustries`/`useGeographies`: fails silently, leaves lists empty.
      })
      .finally(() => {
        if (!cancelled) setLookupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [roleSheetOpen, setRoleSheetOpen] = useState(false);

  // `KeyboardAwareScrollView`'s own automatic scroll-to-focused-input (its whole reason for
  // being used here — see the comment above it below) doesn't reliably reach Step 1's bottom-most
  // fields: LinkedIn/City stayed hidden behind the keyboard on-device even with `enableOnAndroid`
  // + `extraScrollHeight` set. Same manual-scroll fix as `CreateChapterScreen.tsx`'s doc comment
  // (measure the focused field, scroll it clear of the keyboard) rather than trusting the
  // library's own internal position math — but calling *its* exposed `scrollToPosition` (not a
  // raw `ScrollView.scrollTo`) so this doesn't fight the library's own scroll-offset tracking.
  // Only Step 1's LinkedIn/City are wired to `onFieldFocus` below — that's the one demonstrated
  // broken on-device; Steps 2-4 keep relying on the library's own automatic behavior unchanged.
  //
  // `onFieldFocus` does double duty beyond the initial tap-in: `CitySearchField` also calls it
  // again once its live search results arrive, re-pointing `focusedFieldRef` at the suggestion
  // list itself instead of the input — so the same clear-the-keyboard scroll runs a second time
  // and lands far enough down that the first result or two are actually visible, not just the
  // empty input, confirming to the user that something came back. `keyboardHeightRef` (not just
  // a value captured inside the `keyboardDidShow` closure) is what makes that second call work —
  // results arrive *after* the keyboard is already open, so there's no new `keyboardDidShow`
  // event to read a fresh height from.
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const scrollOffsetRef = useRef(0);
  const focusedFieldRef = useRef<Measurable | null>(null);
  const keyboardHeightRef = useRef(0);

  const scrollFocusedFieldClear = () => {
    const kbHeight = keyboardHeightRef.current;
    const field = focusedFieldRef.current;
    if (!field || !kbHeight) return;
    field.measureInWindow((_x, y, _width, height) => {
      const keyboardTop = Dimensions.get('window').height - kbHeight;
      const overlap = y + height - keyboardTop;
      if (overlap > 0) {
        scrollRef.current?.scrollToPosition(0, scrollOffsetRef.current + overlap + 12, true);
      }
    });
  };

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      keyboardHeightRef.current = e.endCoordinates?.height ?? 0;
      requestAnimationFrame(scrollFocusedFieldClear);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      keyboardHeightRef.current = 0;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const toggleEta = (chapter: EtaChapter) => {
    setSelectedChapters(prev => {
      if (prev[chapter.id]) {
        const next = { ...prev };
        delete next[chapter.id];
        return next;
      }
      if (Object.keys(prev).length >= MAX_ETA_CHAPTERS) {
        Toast.show({ type: 'info', text1: `You can select up to ${MAX_ETA_CHAPTERS} cities.` });
        return prev;
      }
      return { ...prev, [chapter.id]: chapter };
    });
    setError('');
  };

  const toggleInterest = (item: string) => {
    setInterests(prev => (prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]));
    setError('');
  };

  const setFieldValue = (key: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const toggleChipValue = (key: string, option: string) => {
    setChipValues(prev => {
      const current = prev[key] ?? [];
      const next = current.includes(option) ? current.filter(o => o !== option) : [...current, option];
      return { ...prev, [key]: next };
    });
    setError('');
  };

  const toggleIndustry = (option: string) => {
    setIndustries(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]));
    setError('');
  };

  const toggleGeography = (option: string) => {
    setGeographyFocus(prev => (prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]));
    setError('');
  };

  // Matches webSrc's `UnifiedRoleForm.tsx` `uploadFile`: uploads immediately on pick (not
  // deferred to Step 4's final Continue), storing the resulting URL separately in
  // `uploadedUrls` — `uploads` itself just tracks what's locally picked, for display.
  const setUpload = async (key: string, file: PickedFile | null) => {
    setUploads(prev => ({ ...prev, [key]: file }));
    if (!file) {
      setUploadedUrls(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    const fileType = ROLE_CONFIG[role]?.uploads.find(u => u.key === key)?.fileType ?? key;
    setUploadingKey(key);
    try {
      const { fileUrl } = await uploadDocument(file, fileType);
      setUploadedUrls(prev => ({ ...prev, [key]: fileUrl }));
    } catch (err) {
      // The real backend returns both `message` (the specific reason, e.g. "Internal server
      // error") and `error` (a generic wrapper label, e.g. "Something went wrong!") — prefer the
      // more specific `message` so the toast shows the actual failure, not just the wrapper.
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message ?? err.response?.data?.error ?? err.message
        : 'Please try again.';
      Toast.show({ type: 'error', text1: 'Upload failed', text2: message });
      setUploads(prev => ({ ...prev, [key]: null }));
    } finally {
      setUploadingKey(null);
    }
  };

  const canBack = step > 1;
  const inFlow = step < 5;
  const stepIndex = step >= 4 ? 3 : step;

  // Step 3-4's heading includes the role picked in Step 1 ("{role}'s Details"), per the design's
  // `titles` map — can't live in the static `STEP_COPY` lookup since it depends on `role` state.
  const stepTitle =
    step === 3 || step === 4
      ? `${role}'s Details`
      : STEP_COPY[step]?.[0] ?? `Step ${step} · ${STEP_LABELS[Math.min(stepIndex, 3) - 1]}`;
  const stepSubtitle =
    step === 3
      ? 'Tell us more about your profile — this helps us match you better.'
      : step === 4
      ? 'A few details specific to your role to finish up.'
      : STEP_COPY[step]?.[1] ?? '';

  const back = () => {
    setError('');
    setStep(s => Math.max(1, s - 1) as Step);
  };

  const next = async () => {
    if (step === 1) {
      if (!role) return setError('Pick the category that describes you.');
      if (!sub) return setError('Select a sub category.');
      if (!LINKEDIN_PATTERN.test(linkedin)) return setError('Add your LinkedIn profile URL.');
      if (linkedinStatus.checking) return setError('Still checking your LinkedIn URL — one moment.');
      if (linkedinStatus.valid !== true) {
        return setError(linkedinStatus.message || 'Enter a valid, available LinkedIn URL.');
      }
      if (!citySelection) return setError('Select your city.');

      setError('');
      setSubmitting(true);
      try {
        await completeProfile({
          linkedinUrl: linkedin,
          roleType: ROLE_TYPE_MAP[role] ?? role,
          subCategory: sub,
          userSelectedLocation: citySelection.city,
          stateCode: citySelection.stateCode,
          countryCode: citySelection.countryCode,
        });
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error ?? err.message
          : 'Something went wrong. Please try again.';
        Toast.show({ type: 'error', text1: 'Could not save profile', text2: message });
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      // Now that the profile (and its location) is actually saved server-side, it's safe to
      // ask for location-based suggestions — see `fetchEtaSuggestions`'s comment.
      fetchEtaSuggestions();
    }
    if (step === 2) {
      const chapterIds = Object.keys(selectedChapters);
      if (!chapterIds.length) return setError('Join at least one city ETA.');

      setError('');
      setSubmitting(true);
      try {
        const result = await batchJoinEtaChapters(chapterIds);
        if (result.error && !result.joinedChapters?.length && !result.pendingChapters?.length) {
          Toast.show({ type: 'error', text1: result.error || result.message || 'Failed to join chapters.' });
          setSubmitting(false);
          return;
        }
        if (result.failedChapters?.length) {
          Toast.show({
            type: 'info',
            text1: `${result.failedChapters.length} chapter(s) couldn't be joined`,
            text2: result.failedChapters[0]?.error,
          });
        }
        if (result.pendingChapters?.length) {
          Toast.show({ type: 'info', text1: `${result.pendingChapters.length} chapter(s) pending approval` });
        }
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error ?? err.message
          : 'Something went wrong. Please try again.';
        Toast.show({ type: 'error', text1: 'Could not join chapters', text2: message });
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }
    if (step === 3) {
      if (!designation) return setError('Select your role / designation.');
      if (!org.trim()) return setError('Enter your organization name.');
      if (!interests.length) return setError('Choose at least one interest.');

      // Step 3 has no API call of its own (its fields submit together with Step 4's on Step
      // 4's Continue) — but the footer button's "Saving…"/disabled state is driven by
      // `submitting`, so without this it never shows any feedback here unlike every other
      // step, and a fast double-tap could re-run this block before the first tap's `setStep`
      // even re-renders. Flip it briefly (yielding one frame so it actually paints) purely for
      // that consistent feedback + double-tap guard, not because anything is really loading.
      setError('');
      setSubmitting(true);
      await new Promise(resolve => requestAnimationFrame(resolve));
      setSubmitting(false);
    }
    if (step === 4) {
      const dealRangesTouched = revRange !== null && ebitdaRange !== null && evRange !== null;
      if (!isStep4Complete(role, fieldValues, chipValues, industries, geographyFocus, dealRangesTouched)) {
        return setError('Complete the required fields for your role.');
      }

      // Matches webSrc's `role-form/page.tsx` `handleComplete`: Step 3 + Step 4's fields
      // submit together as one `formData` object, in a single `PUT /auth/{roleEndpoint}`.
      const config = ROLE_CONFIG[role];
      const formData: Record<string, unknown> = {
        role: designation,
        organizationName: org,
        interests,
        ...fieldValues,
        ...chipValues,
        industries,
        geographyFocus,
      };
      if (config?.hasOrgWebsite) formData.organizationWebsite = orgWebsite;
      // `dealRangesTouched` above already guarantees all three are non-null by this point.
      if (config?.hasDealRange && revRange && ebitdaRange && evRange) {
        formData.revenueMin = String(revRange[0]);
        formData.revenueMax = String(revRange[1]);
        formData.ebitdaMin = String(ebitdaRange[0]);
        formData.ebitdaMax = String(ebitdaRange[1]);
        formData.minEV = String(evRange[0]);
        formData.maxEV = String(evRange[1]);
      }
      config?.uploads.forEach(u => {
        if (uploadedUrls[u.key]) formData[u.key] = uploadedUrls[u.key];
      });

      setError('');
      setSubmitting(true);
      try {
        await submitRoleProfile(ROLE_TYPE_MAP[role] ?? role, formData);
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error ?? err.message
          : 'Something went wrong. Please try again.';
        Toast.show({ type: 'error', text1: 'Could not save profile', text2: message });
        setSubmitting(false);
        return;
      }
      // Fire-and-forget, matching web exactly — a failure here doesn't block onboarding.
      if (interests.length) {
        saveInterests(interests).catch(() => null);
      }
      setSubmitting(false);
    }
    setError('');
    setStep(step < 4 ? ((step + 1) as Step) : 5);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.obPage }}
      // Android already resizes the window for the keyboard via `windowSoftInputMode="adjustResize"`
      // in the manifest — stacking `behavior="height"` on top of that double-compensates and leaves a
      // large residual gap under the footer even with no keyboard visible.
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.obPage} />

      {/* Header — logo + stepper, stays put across steps */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 4, borderBottomColor: colors.obLine2, backgroundColor: colors.obPage },
        ]}
      >
        <View style={styles.brandRow}>
          <Image source={AUTH_LOGO} resizeMode="contain" style={styles.brandIcon} />
          <Text style={[fonts.bold, styles.brandText, { color: colors.obInk }]}>TSB</Text>
        </View>
        <Text style={[fonts.semibold, styles.brandTagline, { color: colors.obInk }]}>
          Find. Connect. Close.
        </Text>
        <View style={styles.stepper}>
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = stepIndex > n;
            const active = stepIndex === n;
            return (
              <View key={label} style={styles.stepCell}>
                <View style={styles.railRow}>
                  <View
                    style={[
                      styles.rail,
                      { backgroundColor: i === 0 ? 'transparent' : done || active ? colors.obInk : colors.obLine2 },
                    ]}
                  />
                  <View
                    style={[
                      styles.dot,
                      done || active
                        ? { backgroundColor: colors.obInk, borderColor: colors.obInk }
                        : { backgroundColor: colors.obPage, borderColor: colors.obLine2 },
                    ]}
                  >
                    {done ? (
                      // `obInk` inverts between themes (near-black in light, near-white in
                      // dark) — `obPage` inverts the same way in the opposite direction, so it
                      // stays readable against this dot's fill in both themes, unlike `onAccent`
                      // (always white — correct for the gold buttons, wrong here).
                      <Check size={11} color={colors.obPage} strokeWidth={2.5} />
                    ) : (
                      <Text
                        style={[fonts.bold, styles.dotLabel, { color: active ? colors.obPage : colors.obInk3 }]}
                      >
                        {n}
                      </Text>
                    )}
                  </View>
                  <View
                    style={[styles.rail, { backgroundColor: i === 2 ? 'transparent' : done ? colors.obInk : colors.obLine2 }]}
                  />
                </View>
                <Text
                  style={[
                    active ? fonts.bold : fonts.medium,
                    styles.stepLabel,
                    { color: active || done ? colors.obInk : colors.obInk3 },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Plain `ScrollView` never scrolls a focused input into view on its own — a lower field
          like LinkedIn ends up hidden behind the keyboard. `enableOnAndroid` is required since
          this library only auto-scrolls on Android when explicitly told to. */}
      <KeyboardAwareScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid
        extraScrollHeight={20}
        keyboardOpeningTime={0}
        onScroll={e => {
          scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.obLine2 }]}>
          {inFlow && (
            <View style={{ marginBottom: 16 }}>
              <Text style={[fonts.authDisplay, styles.title, { color: colors.obInk }]}>{stepTitle}</Text>
              <Text style={[fonts.regular, styles.subtitle, { color: colors.obInk3 }]}>{stepSubtitle}</Text>
            </View>
          )}

          {step === 1 && (
            <Step1Fields
              role={role}
              sub={sub}
              linkedin={linkedin}
              linkedinStatus={linkedinStatus}
              onRolePress={() => setRoleSheetOpen(true)}
              onSubChange={v => {
                setSub(v);
                setError('');
              }}
              onLinkedinChange={setLinkedin}
              onCitySelect={city => {
                setCitySelection(city);
                setError('');
              }}
              onFieldFocus={ref => {
                focusedFieldRef.current = ref.current;
                // Immediate attempt too, not just the `keyboardDidShow` listener — covers the
                // "results just arrived, keyboard's already open" case, where no new
                // `keyboardDidShow` event fires to trigger a rescroll.
                requestAnimationFrame(scrollFocusedFieldClear);
              }}
            />
          )}

          {step === 2 && (
            <Step2Fields
              query={etaQuery}
              onQueryChange={setEtaQuery}
              selectedChapters={Object.values(selectedChapters)}
              chapters={displayedEtaChapters}
              loading={etaChaptersLoading || etaSearching}
              onToggle={toggleEta}
            />
          )}

          {step === 3 && (
            <Step3Fields
              designation={designation}
              designationOptions={ROLE_CONFIG[role]?.designationOptions ?? []}
              org={org}
              interests={interests}
              interestOptions={interestSuggestions}
              interestsLoading={interestsLoading}
              onDesignationChange={v => {
                setDesignation(v);
                setError('');
              }}
              onOrgChange={setOrg}
              onInterestsToggle={toggleInterest}
            />
          )}

          {step === 4 && (
            <Step4Fields
              role={role}
              fieldValues={fieldValues}
              onFieldChange={setFieldValue}
              chipValues={chipValues}
              onChipToggle={toggleChipValue}
              industries={industries}
              industryGrouped={industryGrouped}
              onIndustriesToggle={toggleIndustry}
              geographyFocus={geographyFocus}
              geographyGrouped={geographyGrouped}
              onGeographyToggle={toggleGeography}
              lookupLoading={lookupLoading}
              orgWebsite={orgWebsite}
              onOrgWebsiteChange={setOrgWebsite}
              revRange={revRange ?? rangeDefault('rev')}
              ebitdaRange={ebitdaRange ?? rangeDefault('ebitda')}
              evRange={evRange ?? rangeDefault('ev')}
              onRevChange={(lo, hi) => setRevRange([lo, hi])}
              onEbitdaChange={(lo, hi) => setEbitdaRange([lo, hi])}
              onEvChange={(lo, hi) => setEvRange([lo, hi])}
              uploads={uploads}
              onUploadChange={setUpload}
              uploadingKey={uploadingKey}
            />
          )}

          {step === 5 && (
            <View style={{ gap: 18 }}>
              <View style={{ gap: 6 }}>
                <Text style={[fonts.authDisplay, styles.rulesTitle, { color: colors.obInk }]}>
                  A few ground rules
                </Text>
                <Text style={[fonts.regular, styles.rulesSubtitle, { color: colors.obInk3 }]}>
                  The Search Bridge is a professional community. Here&apos;s what that means.
                </Text>
              </View>

              <View style={{ gap: 12 }}>
                {GROUND_RULES.map(rule => (
                  <GroundRuleCard key={rule.title} icon={rule.icon} title={rule.title} description={rule.description} />
                ))}
              </View>

              <View style={{ gap: 10 }}>
                <PrimaryButton label="I understand, continue" onPress={login} letterSpacing={0} />
                <Text style={[fonts.regular, styles.rulesDisclaimer, { color: colors.obInk3 }]}>
                  Read full <Text style={[fonts.semibold, { color: colors.obGold }]}>Terms of Service</Text>
                </Text>
              </View>
            </View>
          )}
        </View>
      </KeyboardAwareScrollView>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: colors.authErrorBg, borderColor: colors.authErrorBorder }]}>
          <Text style={[fonts.medium, { color: colors.authErrorText, fontSize: fontSize.authFootnote }]}>{error}</Text>
        </View>
      ) : null}

      {inFlow && (
        <View
          style={[
            styles.footer,
            { paddingBottom: 12 + insets.bottom, borderTopColor: colors.obLine2, backgroundColor: colors.surface },
          ]}
        >
          {canBack && (
            <Pressable onPress={back} style={[styles.backButton, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
              <ChevronLeft size={15} color={colors.obInk2} strokeWidth={1.6} />
              <Text style={[fonts.semibold, { color: colors.obInk2, fontSize: fontSize.ui }]}>Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={next}
            disabled={submitting}
            style={[styles.nextButton, { backgroundColor: colors.obGold, opacity: submitting ? 0.6 : 1 }]}
          >
            <Text style={[fonts.bold, { color: colors.onAccent, fontSize: fontSize.ui }]}>
              {submitting ? 'Saving…' : step === 4 ? 'Complete' : 'Continue'}
            </Text>
            <ChevronRight size={15} color={colors.onAccent} strokeWidth={1.7} />
          </Pressable>
        </View>
      )}

      <RoleSheet
        visible={roleSheetOpen}
        selected={role}
        onSelect={r => {
          setRole(r);
          setSub(''); // sub category options depend on role — old value may not exist in the new role's list
          setRoleSheetOpen(false);
          setError('');
        }}
        onClose={() => setRoleSheetOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  brandIcon: {
    width: 22,
    height: 20,
  },
  brandText: {
    fontSize: 19,
    letterSpacing: 0.3,
  },
  brandTagline: {
    marginTop: 2,
    fontSize: 9,
    textAlign: 'center',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  stepper: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  railRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  rail: {
    flex: 1,
    height: 1.5,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: {
    fontSize: 11,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 14,
    paddingBottom: 18,
  },
  card: {
    // No `flexGrow: 1` here — that stretched the card to fill the whole scroll viewport
    // whenever a step's fields were shorter than the screen (e.g. Step 1), leaving a much
    // bigger empty gap below the last field than the fixed `padding` gap above the title.
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  rulesTitle: {
    fontSize: 21,
    lineHeight: 26,
    textAlign: 'center',
  },
  rulesSubtitle: {
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  rulesDisclaimer: {
    fontSize: 11,
    textAlign: 'center',
  },
  errorBanner: {
    marginHorizontal: 14,
    marginBottom: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
  },
});

export default OnboardingScreen;
