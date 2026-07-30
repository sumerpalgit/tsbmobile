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
 * `create` is the one icon with no web counterpart — the website composes posts
 * inline instead of from a nav item, so the mobile "Post" tab needs its own
 * glyph. It is drawn in the same 20×20 / 1.5-stroke style as the rest.
 */

export type IconName =
  | 'home'
  | 'directory'
  | 'create'
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
      {renderPaths(name, stroke, sw)}
    </Svg>
  );
}

function renderPaths(name: IconName, stroke: string, sw: number) {
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

    case 'create':
      return (
        <>
          <Rect
            x="3"
            y="3"
            width="14"
            height="14"
            rx="3"
            stroke={stroke}
            strokeWidth={sw}
          />
          <Path
            d="M10 7v6M7 10h6"
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
