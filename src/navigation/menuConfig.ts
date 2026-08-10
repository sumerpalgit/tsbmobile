import type { IconName } from '../components/icons/Icon';
import type { DrawerParamList, MainTabParamList } from './types';

/**
 * The app menu, in one place.
 *
 * Both navigators and the drawer UI read from here, so adding a destination is
 * a single edit. Order and labels come straight from Phase 0 item 3 of
 * TSB_MOBILE_PLAN.txt.
 *
 * `phase` records which plan phase replaces the placeholder with the real
 * screen — handy while walking the app in Phase 0, and a reminder of what is
 * still stubbed.
 */

export type TabItem = {
  name: keyof MainTabParamList;
  label: string;
  icon: IconName;
  phase?: string;
};

export const TAB_ITEMS: TabItem[] = [
  { name: 'Home', label: 'Home', icon: 'home', phase: 'Phase 3' },
  { name: 'Directory', label: 'Directory', icon: 'directory', phase: 'Phase 7' },
  { name: 'AiAssist', label: 'AI Assist', icon: 'aiAssist' },
  { name: 'Messages', label: 'Messages', icon: 'messages' },
  { name: 'Profile', label: 'Profile', icon: 'account' },
];

export type DrawerItem =
  | { kind: 'divider' }
  /** Routes into a bottom tab (and closes the drawer) rather than a drawer-only screen —
   * Home/Directory/Messages exist as both, matching the app bar/drawer reference. */
  | { kind: 'tab'; name: keyof MainTabParamList; label: string; icon: IconName }
  | {
      kind: 'screen';
      name: keyof Omit<DrawerParamList, 'Tabs'>;
      label: string;
      icon: IconName;
      phase?: string;
    };

/**
 * Item list, order, icons and labels match the app bar/drawer reference (`TSB Home FV.html`)
 * exactly — see `DrawerParamList`'s doc comment for how that reference's item set differs from
 * Phase 0's original plan (no dividers there either, so none here).
 */
export const DRAWER_ITEMS: DrawerItem[] = [
  { kind: 'tab', name: 'Home', label: 'Home', icon: 'home' },
  { kind: 'tab', name: 'Directory', label: 'Directory', icon: 'directory' },
  { kind: 'screen', name: 'EtaChapters', label: 'ETA Chapters', icon: 'etaChapters' },
  { kind: 'tab', name: 'AiAssist', label: 'AI Assist', icon: 'aiAssist' },
  {
    kind: 'screen',
    name: 'MyMatches',
    label: 'My Matches',
    icon: 'matches',
    phase: 'Phase 5',
  },
  { kind: 'tab', name: 'Messages', label: 'Messages', icon: 'messages' },
  {
    kind: 'screen',
    name: 'MyEvents',
    label: 'My Events',
    icon: 'events',
    phase: 'Phase 7',
  },
  {
    kind: 'screen',
    name: 'AiToolkit',
    label: 'AI Toolkit',
    icon: 'toolkit',
    phase: 'Phase 7',
  },
  {
    kind: 'screen',
    name: 'Settings',
    label: 'Settings',
    icon: 'settings',
    phase: 'Phase 7',
  },
];
