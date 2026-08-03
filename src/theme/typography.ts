import { Platform, TextStyle } from 'react-native';

/**
 * TSB typography.
 *
 * The website loads DM Sans (body) and DM Serif Display (headings + labels) —
 * see `webSrc/src/app/layout.tsx` and the `h1..h6, label` rule in
 * `globals.css`. The same five TTFs live in `src/assets/fonts/`.
 *
 * IMPORTANT — we address each weight by its own family name and never use
 * React Native's `fontWeight`. On Android the family is the asset filename, so
 * `fontWeight: '600'` cannot pick DMSans-SemiBold; asking for the family
 * directly is the only approach that renders identically on both platforms.
 * Always spread a `fonts.*` entry rather than writing `fontWeight` by hand.
 */

export const fonts = {
  /** DM Sans 400 — body copy, most UI text. */
  regular: { fontFamily: 'DMSans-Regular' } as TextStyle,
  /** DM Sans 500 — nav items, labels. */
  medium: { fontFamily: 'DMSans-Medium' } as TextStyle,
  /** DM Sans 600 — active nav, card titles, buttons. */
  semibold: { fontFamily: 'DMSans-SemiBold' } as TextStyle,
  /** DM Sans 700 — emphasis, badges, section headings. */
  bold: { fontFamily: 'DMSans-Bold' } as TextStyle,
  /** DM Serif Display 400 — headings and form labels, per globals.css. */
  display: { fontFamily: 'DMSerifDisplay-Regular' } as TextStyle,
  /**
   * Georgia — headings on the new mobile auth screens (`TSBAuthSign up ·
   * Login · Forgot.html`), which specs `font-family:Georgia,'Times New
   * Roman',serif` in place of DM Serif Display. Georgia ships with iOS but
   * not Android, so this falls back to the platform's generic serif face
   * rather than DM Serif Display — no bundled Georgia TTF exists in
   * `assets/fonts/`. A system font takes `fontWeight` normally (unlike the
   * custom families above, which encode weight in the family name).
   */
  authDisplay: Platform.select<TextStyle>({
    ios: { fontFamily: 'Georgia', fontWeight: '700' },
    default: { fontFamily: 'serif', fontWeight: '700' },
  }) as TextStyle,
} as const;

/**
 * Font sizes taken from the sizes actually used across the web dashboard
 * (9px badges through 32px hero numerals).
 */
export const fontSize = {
  badge: 9,
  caption: 10.5,
  small: 11.5,
  body: 13,
  ui: 14,
  subtitle: 15,
  title: 16,
  h3: 20,
  h2: 24,
  h1: 32,

  /** Sizes unique to the new mobile auth screens (`TSBAuthSign up · Login · Forgot.html`). */
  authRemember: 12,
  authFootnote: 12.5,
  authButton: 13.5,
  authSubmit: 14.5,
  authHeading: 25,
  authHero: 34,
} as const;

/** Tracking values from the web's uppercase badge styles (.08em / .13em). */
export const letterSpacing = {
  normal: 0,
  wide: 0.08 * fontSize.badge,
  wider: 0.13 * fontSize.badge,
} as const;

export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
} as const;

/** Ready-made text styles for the shapes that repeat across screens. */
export const textStyles = {
  /** Bottom-tab and drawer item label — web uses 14px / 500. */
  navItem: {
    ...fonts.medium,
    fontSize: fontSize.ui,
  } as TextStyle,
  /** Active nav item — web bumps to 600. */
  navItemActive: {
    ...fonts.semibold,
    fontSize: fontSize.ui,
  } as TextStyle,
  /** Drawer sub-item — web uses 11.5px. */
  navSubItem: {
    ...fonts.medium,
    fontSize: fontSize.small,
  } as TextStyle,
  /** Uppercase pill badge (role chips, "NEW"). */
  badge: {
    ...fonts.bold,
    fontSize: fontSize.badge,
    letterSpacing: letterSpacing.wide,
    textTransform: 'uppercase',
  } as TextStyle,
  /** Card / row title. */
  cardTitle: {
    ...fonts.semibold,
    fontSize: fontSize.body,
  } as TextStyle,
  /** Secondary line under a title. */
  cardSubtitle: {
    ...fonts.regular,
    fontSize: fontSize.caption,
  } as TextStyle,
  body: {
    ...fonts.regular,
    fontSize: fontSize.body,
  } as TextStyle,
  /** Screen heading — display face, matching `h1..h6` on the web. */
  heading: {
    ...fonts.display,
    fontSize: fontSize.h3,
  } as TextStyle,
} as const;
