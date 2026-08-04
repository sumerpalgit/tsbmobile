import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

/**
 * TSB icon set.
 *
 * Every path is copied verbatim from the website so the mobile chrome matches
 * the desktop one stroke for stroke:
 *   - nav icons        → `webSrc/src/app/dashboard/layout.tsx` (`NavIcons`)
 *   - settings / ads / sign-out → `webSrc/src/components/DashboardNavbar.tsx`
 *   - bell             → `webSrc/src/components/NotificationPanel.tsx`
 *
 * `toolkit`, `search`, `filter`, `docList`, `people`, `grid`, `clock`, `check`, `bookmark`,
 * `calendar` and `trendingUp` have no web counterpart — new to the app bar/drawer/home
 * reference (`TSB Home FV.html`, mainly its Filters panel), which has no equivalent on the
 * website. Paths copied verbatim from there instead, same ~1.3–1.5-stroke style as the rest.
 */

export type IconName =
  | 'home'
  | 'directory'
  | 'matches'
  | 'messages'
  | 'etaChapters'
  | 'aiAssist'
  | 'activities'
  | 'events'
  | 'resources'
  | 'adManagement'
  | 'settings'
  | 'suggest'
  | 'toolkit'
  | 'search'
  | 'filter'
  | 'docList'
  | 'people'
  | 'grid'
  | 'clock'
  | 'check'
  | 'checkmark'
  | 'bookmark'
  | 'calendar'
  | 'trendingUp'
  | 'star'
  | 'arrowRight'
  | 'arrowRightLong'
  | 'heart'
  | 'share'
  | 'comment'
  | 'idCard'
  | 'lightbulb'
  | 'barChart'
  | 'link'
  | 'downloadTray'
  | 'briefcase'
  | 'pin'
  | 'starOutline'
  | 'chartUp'
  | 'building'
  | 'signOut'
  | 'bell'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'chevronRight'
  | 'close'
  | 'account'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eyeOff';

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  /** Overrides the per-icon default (1.5 on the web, 1.3 on the bell). */
  strokeWidth?: number;
  /** Renders solid-filled instead of outlined — the mockup's "active" state for `heart`/
   * `bookmark` (liked/saved) swaps from an `--ink3` outline to a `--gold`-filled shape rather
   * than a separate icon. Ignored by icons that don't define a filled variant. */
  filled?: boolean;
};

/** Each icon's native viewBox, so paths stay untouched from the source. */
const VIEW_BOX: Partial<Record<IconName, string>> = {
  bell: '0 0 22 22',
  adManagement: '0 0 18 18',
  settings: '0 0 18 18',
  signOut: '0 0 18 18',
  account: '0 0 18 18',
  chevronRight: '0 0 11 11',
  close: '0 0 20 20',
  search: '0 0 15 15',
  filter: '0 0 15 15',
  docList: '0 0 16 16',
  people: '0 0 16 16',
  grid: '0 0 16 16',
  clock: '0 0 16 16',
  check: '0 0 16 16',
  checkmark: '0 0 15 15',
  bookmark: '0 0 16 16',
  calendar: '0 0 12 12',
  trendingUp: '0 0 12 12',
  star: '0 0 18 18',
  arrowRight: '0 0 11 11',
  arrowRightLong: '0 0 14 14',
  heart: '0 0 16 16',
  share: '0 0 16 16',
  comment: '0 0 16 16',
  idCard: '0 0 16 16',
  lightbulb: '0 0 12 12',
  barChart: '0 0 12 12',
  link: '0 0 10 10',
  downloadTray: '0 0 14 14',
  briefcase: '0 0 16 16',
  pin: '0 0 12 12',
  starOutline: '0 0 12 12',
  chartUp: '0 0 12 12',
  building: '0 0 12 12',
  // The login page's field glyphs come from lucide-react, which draws on 24×24.
  mail: '0 0 24 24',
  lock: '0 0 24 24',
  eye: '0 0 24 24',
  eyeOff: '0 0 24 24',
};

const DEFAULT_VIEW_BOX = '0 0 20 20';

export function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.5,
  filled = false,
}: IconProps) {
  const stroke = color;
  const sw = strokeWidth;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={VIEW_BOX[name] ?? DEFAULT_VIEW_BOX}
      fill="none"
    >
      {renderPaths(name, stroke, sw, filled)}
    </Svg>
  );
}

function renderPaths(name: IconName, stroke: string, sw: number, filled: boolean) {
  switch (name) {
    case 'home':
      return (
        <Path
          d="M3 8.5l7-5.5 7 5.5v8.5a.5.5 0 01-.5.5H12v-5H8v5H3.5a.5.5 0 01-.5-.5z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );

    case 'directory':
      return (
        <>
          <Circle cx="7" cy="7" r="2.8" stroke={stroke} strokeWidth={sw} />
          <Circle cx="14" cy="7" r="2.8" stroke={stroke} strokeWidth={sw} />
          <Path
            d="M2 16.5c0-2.5 2.2-4.5 5-4.5M11 16.5c0-2.5 2.2-4.5 5-4.5"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      );

    case 'matches':
      return (
        <>
          <Path
            d="M3 9.5l3.5-2 1.5 1.5 4-3.5 1 1"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="6.5" cy="14" r="2.2" stroke={stroke} strokeWidth={sw} />
          <Circle cx="14.5" cy="6.5" r="2.2" stroke={stroke} strokeWidth={sw} />
          <Path
            d="M8 13l4-4M8 15l4-4"
            stroke={stroke}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </>
      );

    case 'messages':
      return (
        <Path
          d="M3 4.5c0-.6.4-1 1-1h12c.6 0 1 .4 1 1v8c0 .6-.4 1-1 1h-5l-3.5 3v-3H4c-.6 0-1-.4-1-1z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );

    case 'etaChapters':
      return (
        <Path
          d="M2 4.5c2-1 5-1 8 .5v12c-3-1.5-6-1.5-8-.5zM18 4.5c-2-1-5-1-8 .5v12c3-1.5 6-1.5 8-.5z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );

    case 'aiAssist':
      return (
        <>
          <Path
            d="M9 2l1.6 4.4L15 8l-4.4 1.6L9 14l-1.6-4.4L3 8l4.4-1.6z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path
            d="M15 12l.7 1.6 1.8.4-1.8.4-.7 1.6-.7-1.6-1.8-.4 1.8-.4z"
            stroke={stroke}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
        </>
      );

    case 'activities':
      return (
        <Path
          d="M3 11l2.5-3.5L7.5 11l3-7 2.5 5L15 9.5L17 11"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'events':
      return (
        <>
          <Rect
            x="3"
            y="4.5"
            width="14"
            height="12"
            rx="1"
            stroke={stroke}
            strokeWidth={sw}
          />
          <Path
            d="M3 8.5h14M6.5 2.5v3M13.5 2.5v3"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      );

    case 'resources':
      return (
        <>
          <Path
            d="M5 3h10a1 1 0 011 1v13l-6-3-6 3V4a1 1 0 011-1z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <Path
            d="M7.5 8.5l1.5 1.5L13 6"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );

    case 'adManagement':
      return (
        <>
          <Path
            d="M2 4.5h14M2 9h14M2 13.5h9"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <Circle cx="14.5" cy="13.5" r="2" stroke={stroke} strokeWidth={sw} />
        </>
      );

    case 'settings':
      return (
        <>
          <Circle cx="9" cy="9" r="2.5" stroke={stroke} strokeWidth={sw} />
          <Path
            d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.5 3.5l1.4 1.4M13.1 13.1l1.4 1.4M3.5 14.5l1.4-1.4M13.1 4.9l1.4-1.4"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      );

    case 'suggest':
      return (
        <>
          <Path
            d="M10 2a5 5 0 015 5c0 2-.9 3.7-2.3 4.8-.4.3-.7.8-.7 1.3v.4H8v-.4c0-.5-.3-1-.7-1.3A5 5 0 015 7a5 5 0 015-5z"
            stroke={stroke}
            strokeWidth={sw}
          />
          <Path
            d="M8 16h4M9 18h2"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      );

    // No web counterpart (new to the app bar/drawer reference, `TSB Home FV.html`) — path
    // copied verbatim from there instead, same convention as `create`'s doc comment above.
    case 'toolkit':
      return (
        <Path
          d="M10 2.5l1.8 4.2 4.2.5-3.1 2.9 1 4.2L10 12.2 6.1 14.3l1-4.2L4 7.2l4.2-.5z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );

    case 'search':
      return (
        <>
          <Circle cx="6.5" cy="6.5" r="4.5" stroke={stroke} strokeWidth={sw} />
          <Path d="M10 10l3.5 3.5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        </>
      );

    case 'filter':
      return (
        <Path
          d="M2 4h11M4 7.5h7M6 11h3"
          stroke={stroke}
          strokeWidth={1.6}
          strokeLinecap="round"
        />
      );

    case 'docList':
      return (
        <>
          <Rect x="3" y="2.5" width="10" height="11" rx="1" stroke={stroke} strokeWidth={1.2} />
          <Path
            d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </>
      );

    case 'people':
      return (
        <>
          <Circle cx="6" cy="6" r="2.3" stroke={stroke} strokeWidth={1.3} />
          <Path
            d="M2.5 13c0-2 1.6-3.5 3.5-3.5S9.5 11 9.5 13"
            stroke={stroke}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
          <Path
            d="M11 4.2a2.3 2.3 0 010 4.4M12 13c0-1.6-.8-2.9-2-3.4"
            stroke={stroke}
            strokeWidth={1.3}
            strokeLinecap="round"
          />
        </>
      );

    case 'grid':
      return (
        <>
          <Rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" stroke={stroke} strokeWidth={1.3} />
          <Rect x="9" y="2.5" width="4.5" height="4.5" rx="1" stroke={stroke} strokeWidth={1.3} />
          <Rect x="2.5" y="9" width="4.5" height="4.5" rx="1" stroke={stroke} strokeWidth={1.3} />
          <Rect x="9" y="9" width="4.5" height="4.5" rx="1" stroke={stroke} strokeWidth={1.3} />
        </>
      );

    case 'clock':
      return (
        <>
          <Circle cx="8" cy="8" r="6" stroke={stroke} strokeWidth={1.3} />
          <Path d="M8 4.5V8l2.5 1.5" stroke={stroke} strokeWidth={1.3} strokeLinecap="round" />
        </>
      );

    case 'check':
      return (
        <>
          <Circle cx="8" cy="8" r="6" stroke={stroke} strokeWidth={1.3} />
          <Path
            d="M5.5 8l1.8 1.8L11 6"
            stroke={stroke}
            strokeWidth={1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );

    case 'checkmark':
      return (
        <Path
          d="M2.5 7.5l3 3 6.5-7"
          stroke={stroke}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'bookmark':
      return filled ? (
        <Path d="M3.5 2.5A1 1 0 014.5 1.5h7a1 1 0 011 1v11.5l-4.5-2.8-4.5 2.8z" fill={stroke} />
      ) : (
        <Path
          d="M3.5 2.5A1 1 0 014.5 1.5h7a1 1 0 011 1v11.5l-4.5-2.8-4.5 2.8z"
          stroke={stroke}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      );

    case 'calendar':
      return (
        <>
          <Rect x="1.5" y="2.5" width="9" height="8" rx="1" stroke={stroke} strokeWidth={1.2} />
          <Path
            d="M1.5 5h9M4 1.5v2M8 1.5v2"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
        </>
      );

    case 'trendingUp':
      return (
        <>
          <Path
            d="M2 10l3-3 2 1.5 4-5"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M8 3.5h3v3" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );

    // Filled, not stroked — matches the "Complete Your Profile" banner's icon badge
    // (`webSrc/src/app/dashboard/page.tsx`'s inline star SVG) copied verbatim, `fill` instead
    // of `stroke` since that reference renders it solid.
    case 'star':
      return (
        <Path
          d="M9 1l1.9 4.5 4.9.5-3.6 3.4 1 4.8L9 11.7 4.8 14.2l1-4.8L2.2 6l4.9-.5z"
          fill={stroke}
        />
      );

    // Shaft + arrowhead, not a bare caret (`chevronRight` is too small a mark for a full CTA
    // arrow) — copied verbatim from the "Complete Profile" CTA's inline SVG in
    // `webSrc/src/app/dashboard/page.tsx`.
    case 'arrowRight':
      return (
        <Path
          d="M2 5.5h7M5.5 2l3.5 3.5L5.5 9"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    // Events' "View Details" CTA — a separate, longer arrow than `arrowRight` (different
    // confirmed path/viewBox from its own mockup source, not a reuse).
    case 'arrowRightLong':
      return (
        <Path
          d="M2 7h10M7.5 2.5L12 7l-4.5 4.5"
          stroke={stroke}
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    // `PostCardActions`' like/comment/share row and `PostCardHeader`'s save button — paths
    // copied verbatim from the feed-card examples hand-authored in `TSB Home FV.html` (each
    // card's `onLike`/`toastComment`/`toastShare`/`onSave` SVGs), which do exist in that file —
    // an earlier, too-shallow search of it missed them.
    case 'heart':
      return filled ? (
        <Path d="M8 13.5S2 9.9 2 5.8a3.2 3.2 0 016-1.5 3.2 3.2 0 016 1.5C14 9.9 8 13.5 8 13.5z" fill={stroke} />
      ) : (
        <Path
          d="M8 13.5S2 9.9 2 5.8a3.2 3.2 0 016-1.5 3.2 3.2 0 016 1.5C14 9.9 8 13.5 8 13.5z"
          stroke={stroke}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      );

    case 'comment':
      return (
        <Path
          d="M2 2.5h12a.5.5 0 01.5.5v8a.5.5 0 01-.5.5H9L6 14v-2.5H2a.5.5 0 01-.5-.5V3a.5.5 0 01.5-.5z"
          stroke={stroke}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      );

    case 'share':
      return (
        <Path
          d="M2 8.5 7 5v2.5c3.5 0 6 1.5 6.5 5C12 10 10 9 7 9v2.5z"
          stroke={stroke}
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      );

    // Feed card's "quick profile" preview button.
    case 'idCard':
      return (
        <>
          <Rect x="2.4" y="3" width="11.2" height="10" rx="1.6" stroke={stroke} strokeWidth={1.4} />
          <Path d="M2.4 6.1h11.2" stroke={stroke} strokeWidth={1.4} />
          <Path d="M4.4 4.55h.01M6 4.55h.01" stroke={stroke} strokeWidth={1.3} strokeLinecap="round" />
        </>
      );

    // "Ask the Community" badge icon.
    case 'lightbulb':
      return (
        <Path
          d="M6 1a3.5 3.5 0 00-3.5 3.5c0 1.5 1 2.3 1.5 3v1.5h4V7.5c.5-.7 1.5-1.5 1.5-3A3.5 3.5 0 006 1zM4.5 9.5h3M4.5 11h3"
          stroke={stroke}
          strokeWidth={1.1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    // "Polls" badge icon.
    case 'barChart':
      return <Path d="M2 10V6M5 10V2M8 10V7M11 10V4" stroke={stroke} strokeWidth={1.3} strokeLinecap="round" />;

    // "Find My Match" badge icon (two-link chain).
    case 'link':
      return (
        <>
          <Path
            d="M4.5 5.5L2.8 7.2a1.6 1.6 0 002.3 2.3l1.2-1.2M7.5 6.5l1.7-1.7a1.6 1.6 0 00-2.3-2.3L5.4 3.6"
            stroke={stroke}
            strokeWidth={1.1}
            strokeLinecap="round"
          />
          <Path d="M5 7l2-2" stroke={stroke} strokeWidth={1.1} strokeLinecap="round" />
        </>
      );

    // "Express Interest"/"Pitch Your Deal" CTA icon.
    case 'downloadTray':
      return (
        <Path
          d="M7 1.5v6M3 7.5l4 4 4-4M2 12.5h10"
          stroke={stroke}
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    // "Jobs" badge icon.
    case 'briefcase':
      return (
        <>
          <Rect x="2" y="5" width="12" height="8" rx="1.5" stroke={stroke} strokeWidth={1.3} />
          <Path d="M5.5 5V3.7a1 1 0 011-1h3a1 1 0 011 1V5" stroke={stroke} strokeWidth={1.3} />
          <Path d="M2 9h12" stroke={stroke} strokeWidth={1.3} />
        </>
      );

    // Event card's location line.
    case 'pin':
      return (
        <>
          <Path
            d="M6 1a3.5 3.5 0 013.5 3.5c0 2.5-3.5 6-3.5 6s-3.5-3.5-3.5-6A3.5 3.5 0 016 1z"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinejoin="round"
          />
          <Circle cx="6" cy="4.5" r="1.2" stroke={stroke} strokeWidth={1.1} />
        </>
      );

    // Investor Corner "Back a Searcher" badge icon.
    case 'starOutline':
      return (
        <Path
          d="M6 1l1.3 2.8H10L7.9 5.5l.8 2.9L6 6.9 3.3 8.4l.8-2.9L2 3.8h2.7z"
          stroke={stroke}
          strokeWidth={1}
          strokeLinejoin="round"
        />
      );

    // Investor Corner "Invest in a Deal" badge icon (also Deal's "Raising Capital" variant).
    case 'chartUp':
      return (
        <>
          <Path
            d="M2 9l3-3 2 2 4-5"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M8 3h3v3" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
        </>
      );

    // Deal's "Looking for a Buyer" badge icon.
    case 'building':
      return (
        <>
          <Path
            d="M2 5L6 2l4 3v5.5a.4.4 0 01-.4.5H2.4a.4.4 0 01-.4-.5z"
            stroke={stroke}
            strokeWidth={1.1}
            strokeLinejoin="round"
          />
          <Path d="M5 11V8h2v3" stroke={stroke} strokeWidth={1.1} strokeLinejoin="round" />
        </>
      );

    case 'signOut':
      return (
        <>
          <Path
            d="M12 5V4a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h7a1 1 0 001-1v-1"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
          <Path
            d="M8 9h8M13 6l3 3-3 3"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );

    case 'bell':
      return (
        <Path
          d="M11 2.5a5 5 0 00-5 5v3.5L4 14h14l-2-3V7.5a5 5 0 00-5-5zM8.5 17a2.5 2.5 0 005 0"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'sun':
      return (
        <>
          <Circle cx="10" cy="10" r="3.5" stroke={stroke} strokeWidth={sw} />
          <Path
            d="M10 2v2M10 16v2M2 10h2M16 10h2M4.3 4.3l1.4 1.4M14.3 14.3l1.4 1.4M4.3 15.7l1.4-1.4M14.3 5.7l1.4-1.4"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      );

    case 'moon':
      return (
        <Path
          d="M16 12.3A6.8 6.8 0 017.7 4a7 7 0 108.3 8.3z"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'menu':
      return (
        <Path
          d="M3 6h14M3 10h14M3 14h14"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      );

    case 'chevronRight':
      return (
        <Path
          d="M4 2.5l3 3-3 3"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    case 'close':
      return (
        <Path
          d="M5 5l10 10M15 5L5 15"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
        />
      );

    case 'account':
      return (
        <>
          <Circle cx="9" cy="6" r="3" stroke={stroke} strokeWidth={sw} />
          <Path
            d="M3 16c0-3 2.7-5 6-5s6 2 6 5"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      );

    // Login-form glyphs — lucide's Mail, Lock, Eye and EyeOff, matching the
    // `<Mail />` / `<Lock />` / `<Eye />` imports in the web login page.
    case 'mail':
      return (
        <>
          <Rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="2"
            stroke={stroke}
            strokeWidth={sw}
          />
          <Path
            d="M22 7l-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      );

    case 'lock':
      return (
        <>
          <Rect
            x="3"
            y="11"
            width="18"
            height="11"
            rx="2"
            stroke={stroke}
            strokeWidth={sw}
          />
          <Path
            d="M7 11V7a5 5 0 0110 0v4"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
          />
        </>
      );

    case 'eye':
      return (
        <>
          <Path
            d="M2.06 12.35a1 1 0 010-.7 10.75 10.75 0 0119.88 0 1 1 0 010 .7 10.75 10.75 0 01-19.88 0z"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="12" r="3" stroke={stroke} strokeWidth={sw} />
        </>
      );

    case 'eyeOff':
      return (
        <Path
          d="M10.73 5.08a10.74 10.74 0 0111.21 6.57 1 1 0 010 .7 10.75 10.75 0 01-1.45 2.49M14.08 14.16a3 3 0 01-4.24-4.24M17.48 17.5A10.75 10.75 0 012.06 12.35a1 1 0 010-.7 10.75 10.75 0 014.45-5.14M2 2l20 20"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );

    default:
      return null;
  }
}
