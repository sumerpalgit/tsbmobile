/**
 * TSB colour tokens.
 *
 * Ported 1:1 from the website's design tokens in `webSrc/src/app/globals.css`
 * (`:root` block for light, `.dark` block for dark). Token names match the CSS
 * custom properties with the `--tsb-` prefix dropped and camelCased, so a value
 * can always be traced back to the web source.
 *
 * Do not hardcode hex values anywhere else in the app — add a token here.
 */

export type ThemeColors = {
  /** Navy scale. In dark mode this inverts to a light scale (same as web). */
  navy: string;
  navy2: string;
  navy3: string;

  /** Gold — the brand accent. */
  gold: string;
  goldLight: string;
  goldExtraLight: string;
  goldDark: string;
  goldAccent: string;

  /** Cream — sunken/hover surfaces. */
  cream: string;
  creamBg: string;
  creamDark: string;
  creamBorder: string;
  creamBorderBold: string;

  /** Active-row background (drawer, and anywhere else a selected-chip fill is needed).
   * No equivalent exists in `globals.css` — sourced from the `TSB Home FV.html` app
   * bar/drawer reference instead, the one exception to this file's "port from web" rule. */
  chip: string;

  /** `SegmentedControl`'s track background (the Filters panel's "Posted within" control). The
   * reference hardcodes this as a literal translucent white (`#FFFFFF79`) with no dark-mode
   * variant defined — the light value matches that exactly; dark substitutes the reference's
   * own `--sunken` tone instead of literal white-on-dark, which would look broken. */
  segmentedTrack: string;

  /** Page + surfaces. */
  pageBg: string;
  surface: string;
  surface2: string;
  surfaceSunken: string;

  /** Borders. */
  border: string;
  borderSoft: string;

  /** `ProfileCompletionCard`'s border (`--line2` in the app bar/drawer/home reference,
   * `TSB Home FV.html`) — distinct from `border`/`borderSoft` (neither matches its value), the
   * same one-exception-to-"port-from-web" case as `chip` above. */
  homeCardBorder: string;

  /** `PostCard`'s outer border + its actions-row divider (`--line` in the same reference) — a
   * third, slightly different border value from `border`/`borderSoft`/`homeCardBorder`, all
   * four genuinely distinct in that file. */
  feedCardLine: string;

  /** Ink = text colours, strongest to weakest. */
  ink: string;
  ink2: string;
  ink3: string;

  /** `PostCardHeader`'s avatar fallback fill + text, and `PostCardTags`' 2nd-tier solid chip
   * (`--fill`/`--onfill` in `TSB Home FV.html`) — a dark-navy background that must stay dark in
   * both themes since it's a solid fill, not text (unlike `navy`, which deliberately inverts to
   * near-white in dark mode to keep navy-coloured *text* legible). Distinct from the existing
   * `avatarFallback` (a different reference's gradient approximation) since this is a flat value
   * copied verbatim from this specific mockup instead. */
  feedFill: string;
  feedOnFill: string;

  /** Solid accent used for primary buttons / active nav in light mode. */
  accentSolid: string;
  accentSolidHover: string;

  /** Hero gradient stops. */
  hero1: string;
  hero2: string;

  /** Shadow colours (used with elevation helpers in `layout.ts`). */
  shadow: string;
  shadowLarge: string;

  /** Semantic colours. Web uses these inline rather than as tokens. */
  danger: string;
  dangerSurface: string;

  /** "Registered" / "Happening now" status badges (My Events). Sourced from the My Events
   * mobile mockup's `--ok`/`--okbg` tokens, not webSrc (which inlines these per-badge-class
   * instead of naming them) — same one-exception-to-"port-from-web" case as `chip` above. */
  success: string;
  successSurface: string;

  /** My Resources' per-content-type accents (Templates/Tools/Case Studies — Articles reuses
   * `goldDark`/`chip`, Checklists reuses `success`/`successSurface` above). Sourced from
   * `Resources.html`'s own `--indigo`/`--indigobg` tokens plus its two literal, undefined-as-
   * tokens hex values (`#3B6FA0`/`#8B5A9E`) — same one-exception-to-"port-from-web" case as
   * `chip`. Dark variants for the two literal ones are ours, following this file's existing
   * invert-lightness-keep-hue approach (matching how the mockup's own `--indigo` lightens from
   * light to dark). */
  indigo: string;
  indigoSurface: string;
  toolsAccent: string;
  toolsAccentSurface: string;

  /** `MemberCard`'s LinkedIn icon well (Directory) — a subtle brand-blue-tinted background behind
   * the LinkedIn glyph, which already draws its own solid-blue rounded square. Was hardcoded as a
   * single light-only hex (`#E6F0FB`) with no dark variant, so it rendered as a stark bright box
   * against a dark card — same one-exception-to-"port-from-web" case as `chip` (no web
   * equivalent, this is mobile-only chrome). Dark variant is a translucent wash of LinkedIn's own
   * brand blue (`#0A66C2`, matching `LinkedInIcon`'s own fill), same alpha-tint convention as
   * `indigoSurface`/`successSurface` above rather than a flat light color. */
  linkedinIconSurface: string;
  caseStudyAccent: string;
  caseStudyAccentSurface: string;

  /** Fixed white/black that must not flip between themes. */
  onGold: string;
  onAccent: string;

  /**
   * Fill behind avatar initials. The web uses a navy gradient
   * (`from-[#3a5573] to-[#5a7995]`); this is its mid-tone, since RN has no
   * gradient primitive without another dependency.
   */
  avatarFallback: string;

  /**
   * Login / sign-up screens.
   *
   * Ported from the mobile-specific auth redesign, `TSBAuthSign up · Login ·
   * Forgot.html` (repo root) — a bottom-sheet layout with a dark hero above
   * it, replacing the old side-by-side desktop layout this screen used to
   * mirror. Its `--ink`/`--gold`/`--goldl`/`--goldd` tokens landed on the
   * exact hex values already in `navy`/`gold`/`goldLight`/`goldDark` above,
   * so the hero, headings, and gold accents reuse those directly at the call
   * site instead of duplicating them here — only the values that genuinely
   * differ from the general scale get a dedicated token below.
   *
   * The design file is light-only. The dark values are ours, derived from
   * the dark tokens above so the theme toggle still works on this screen.
   */
  /**
   * Hero background behind the logo/tagline (`--fill: #182E43`) — fixed in
   * both themes, unlike `navy`, which deliberately inverts to a light shade
   * in dark mode so navy-coloured *text* stays legible. This is a dark brand
   * surface, not text, so it must not flip.
   */
  authPanel: string;
  /** Body copy in the dark hero (`rgba(255,255,255,.68)`) — fixed, for the same reason as `authPanel`. */
  authPanelText: string;
  /** Footer / helper copy below the form (`--ink2: #46597A`). */
  authBody: string;
  /** Subtitle, divider caption, and field/eye-toggle icons (`--ink3: #8496A8`). */
  authMuted: string;
  /** Input fill when unfocused (`--surf2: #F8F6F1`); white on focus (reuse `surface`). */
  authField: string;
  /** Input and social-button border (`--line2: #DED9CC`); gold on focus (reuse `gold`). */
  authFieldBorder: string;
  /** Input border when the field fails validation (`#DDA9A0`). */
  authFieldBorderError: string;
  /** Error banner fill (`#FDF1EF`). */
  authErrorBg: string;
  /** Error banner border (`#F3D6D1`). */
  authErrorBorder: string;
  /** Error banner text (`#9B4436`). */
  authErrorText: string;
  /** "Check your inbox" icon badge fill on Forgot Password (`#F3ECD8`). */
  authIconBadgeBg: string;

  /**
   * Onboarding wizard (`TSBOnboarding.html`, repo root) — its own light-mode
   * palette, distinct from both the general tokens and the `auth*` ones:
   * near-black ink instead of navy, a more muted gold. `obSurface` isn't
   * listed separately — it's an exact match for `surface`, so call sites
   * just reuse that; same for `obLine` and `borderSoft`, and `obOnFill` and
   * `onAccent`. Dark-mode values below are ours, following the same
   * invert-lightness-keep-hue approach as the rest of this file.
   */
  obPage: string;
  obSurface2: string;
  obSunken: string;
  obInk: string;
  obInk2: string;
  obInk3: string;
  obLine2: string;
  obGold: string;
  obGoldLight: string;
  obGoldDark: string;
  obChip: string;
  /** Required-field asterisk / validation red (`#D5453B`). */
  obRequired: string;
  /** "Joined" / success state (`#3F6B45`). */
  obSuccess: string;
};

/** `:root` in globals.css — TSB Design Tokens, Light Mode. */
export const lightColors: ThemeColors = {
  navy: '#182E43',
  navy2: '#1f3a52',
  navy3: '#2a4d66',

  gold: '#A7852D',
  goldLight: '#c9a84c',
  goldExtraLight: '#f0e6cc',
  goldDark: '#7a6020',
  goldAccent: '#A7852D',

  cream: '#F7F6F2',
  creamBg: '#F7F6F2',
  creamDark: '#edeae2',
  creamBorder: '#d8d4c8',
  creamBorderBold: '#cac5b8',
  chip: '#F3ECD8',
  segmentedTrack: 'rgba(255,255,255,0.47)',

  // Matches the app bar/drawer/home reference's `--page` exactly (`#fafaf7` was the real web
  // app's `--tsb-page-bg` — the HTML design takes priority for visuals, same rule as `chip`
  // above; webSrc stays the reference for functionality/API contracts, not visuals).
  pageBg: '#F1EEE7',
  surface: '#ffffff',
  surface2: '#ffffff',
  surfaceSunken: '#F7F6F2',

  border: '#d8d4c8',
  borderSoft: '#edeae2',
  homeCardBorder: '#DED9CC',
  feedCardLine: '#EBE7DD',

  ink: '#182E43',
  ink2: '#3d5472',
  ink3: '#7a90a6',
  feedFill: '#182E43',
  feedOnFill: '#F2F5F8',

  accentSolid: '#182E43',
  accentSolidHover: '#1f3a52',

  hero1: '#182E43',
  hero2: '#1f3a52',

  shadow: 'rgba(24,46,67,0.14)',
  shadowLarge: 'rgba(24,46,67,0.26)',

  danger: '#cc4444',
  dangerSurface: '#fdf3f1',

  success: '#2F7A5B',
  successSurface: 'rgba(47,122,91,0.12)',

  indigo: '#5B57A3',
  indigoSurface: 'rgba(91,87,163,0.12)',
  toolsAccent: '#3B6FA0',
  toolsAccentSurface: 'rgba(59,111,160,0.12)',
  caseStudyAccent: '#8B5A9E',
  caseStudyAccentSurface: 'rgba(139,90,158,0.12)',

  linkedinIconSurface: '#E6F0FB',

  onGold: '#ffffff',
  onAccent: '#ffffff',

  avatarFallback: '#4a6784',

  authPanel: '#182E43',
  authPanelText: 'rgba(255,255,255,0.68)',
  authBody: '#46597A',
  authMuted: '#8496A8',
  authField: '#F8F6F1',
  authFieldBorder: '#DED9CC',
  authFieldBorderError: '#DDA9A0',
  authErrorBg: '#FDF1EF',
  authErrorBorder: '#F3D6D1',
  authErrorText: '#9B4436',
  authIconBadgeBg: '#F3ECD8',

  obPage: '#F5F2EC',
  obSurface2: '#F7F5F0',
  obSunken: '#F1EEE7',
  obInk: '#171717',
  obInk2: '#4A5560',
  obInk3: '#8B949E',
  obLine2: '#E1DCD1',
  obGold: '#8A6D1E',
  obGoldLight: '#BFAE8C',
  obGoldDark: '#6E5616',
  obChip: '#F6F1E3',
  obRequired: '#D5453B',
  obSuccess: '#3F6B45',
};

/** `.dark` in globals.css — TSB Design Tokens, Dark Mode. */
export const darkColors: ThemeColors = {
  // Note: the navy scale deliberately inverts in dark mode — this matches the
  // web, where `--tsb-navy` becomes a near-white so navy-coloured text stays
  // readable without every call site needing a dark-mode branch.
  navy: '#e8edf2',
  navy2: '#d6dee7',
  navy3: '#b9c6d3',

  gold: '#c9a84c',
  goldLight: '#e0c878',
  goldExtraLight: '#3a3320',
  goldDark: '#d9bd6a',
  goldAccent: '#d4b25e',

  cream: '#1d2c3b',
  // Web sets this to `transparent`; on RN an explicit colour is safer since
  // there is no cascade to fall back to.
  creamBg: 'transparent',
  creamDark: '#243549',
  creamBorder: 'rgba(255,255,255,0.10)',
  creamBorderBold: 'rgba(255,255,255,0.16)',
  chip: '#332C1A',
  segmentedTrack: '#101B26',

  pageBg: '#0C1520',
  surface: '#16222f',
  surface2: '#1d2c3b',
  surfaceSunken: '#101b26',

  border: 'rgba(255,255,255,0.10)',
  borderSoft: 'rgba(255,255,255,0.06)',
  homeCardBorder: 'rgba(255,255,255,0.15)',
  feedCardLine: 'rgba(255,255,255,0.09)',

  ink: '#e8edf2',
  ink2: '#a9b8c6',
  ink3: '#6f8294',
  feedFill: '#22364A',
  feedOnFill: '#FFFFFF',

  accentSolid: '#2c4660',
  accentSolidHover: '#36546f',

  hero1: '#1f3142',
  hero2: '#28415a',

  shadow: 'rgba(0,0,0,0.4)',
  shadowLarge: 'rgba(0,0,0,0.55)',

  danger: '#e07a86',
  dangerSurface: '#2a1a1a',

  success: '#4FA37D',
  successSurface: 'rgba(79,163,125,0.16)',

  indigo: '#8B87D6',
  indigoSurface: 'rgba(139,135,214,0.18)',
  toolsAccent: '#6FA0D9',
  toolsAccentSurface: 'rgba(111,160,217,0.16)',
  caseStudyAccent: '#B98BCB',
  caseStudyAccentSurface: 'rgba(185,139,203,0.16)',

  linkedinIconSurface: 'rgba(10,102,194,0.18)',

  onGold: '#15212e',
  onAccent: '#ffffff',

  avatarFallback: '#3a5573',

  // authPanel/authPanelText/authAvatarRing* stay fixed — same values as
  // light, since the hero is a brand surface that never flips with theme.
  authPanel: '#182E43',
  authPanelText: 'rgba(255,255,255,0.68)',
  authBody: '#a9b8c6',
  authMuted: '#6f8294',
  authField: '#1d2c3b',
  authFieldBorder: 'rgba(255,255,255,0.14)',
  authFieldBorderError: '#8c5049',
  authErrorBg: '#2a1a1a',
  authErrorBorder: '#4a2c2a',
  authErrorText: '#e07a86',
  authIconBadgeBg: '#3d3520',

  obPage: '#121212',
  obSurface2: '#1c1c1c',
  obSunken: '#171717',
  obInk: '#F2F0EC',
  obInk2: '#B8C0C6',
  obInk3: '#7D8790',
  obLine2: 'rgba(255,255,255,0.14)',
  obGold: '#C9A84C',
  obGoldLight: '#D9C9A3',
  obGoldDark: '#A88A3A',
  obChip: '#2A2519',
  obRequired: '#E67C73',
  obSuccess: '#6FA37A',
};
