import { Platform, ViewStyle } from 'react-native';
import { ThemeColors } from './colors';

/**
 * Radii, spacing and elevation.
 *
 * Radii derive from the web's `--radius: 0.625rem` (10px) and the literal
 * values used on dashboard surfaces (10px rows, 14px cards/panels, 18px modals,
 * 24px pills).
 */

export const radius = {
  sm: 6,
  md: 8,
  /** Default — nav rows, inputs, buttons. */
  lg: 10,
  /** Cards, sidebar panels, dropdowns. */
  xl: 14,
  /** Modals. */
  xxl: 18,
  /** Fully rounded pills / avatars. */
  pill: 999,
} as const;

/** 4pt spacing scale, plus the odd web-specific gaps that recur. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  /** Web's most common gap/padding step (`gap-[11px]`, `py-[11px]`). */
  md: 11,
  lg: 14,
  xl: 16,
  xxl: 24,
  xxxl: 32,
} as const;

/** Fixed chrome heights, mirroring the web shell. */
export const sizes = {
  /** `h-[70px]` on DashboardNavbar. */
  topBar: 70,
  /** `w-[260px]` on the web's mobile drawer. */
  drawerWidth: 288,
  /** Icon button hit target (`w-9 h-9`). */
  iconButton: 36,
  avatar: 36,
  avatarLarge: 42,
  navIcon: 20,
} as const;

/**
 * Cross-platform elevation. RN needs `shadow*` on iOS and `elevation` on
 * Android, so this returns both from one call rather than every component
 * re-deriving it.
 */
export function elevation(
  colors: ThemeColors,
  level: 'none' | 'sm' | 'md' | 'lg' = 'sm',
): ViewStyle {
  if (level === 'none') {
    return {};
  }

  const config = {
    sm: { radius: 4, offsetY: 1, opacity: 1, android: 2 },
    md: { radius: 12, offsetY: 4, opacity: 1, android: 6 },
    lg: { radius: 24, offsetY: 10, opacity: 1, android: 12 },
  }[level];

  return Platform.select<ViewStyle>({
    ios: {
      // `colors.shadow` already carries the alpha from the web token, so
      // shadowOpacity stays at 1 to avoid multiplying it a second time.
      shadowColor: level === 'lg' ? colors.shadowLarge : colors.shadow,
      shadowOffset: { width: 0, height: config.offsetY },
      shadowOpacity: config.opacity,
      shadowRadius: config.radius,
    },
    android: {
      elevation: config.android,
      shadowColor: level === 'lg' ? colors.shadowLarge : colors.shadow,
    },
    default: {},
  })!;
}

/** Border width — the web uses hairline 0.5px on cards and sidebars. */
export const borderWidth = {
  hairline: 0.5,
  thin: 1,
  thick: 1.5,
} as const;
