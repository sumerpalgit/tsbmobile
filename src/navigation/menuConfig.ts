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
  { name: 'Post', label: 'Post', icon: 'create', phase: 'Phase 4' },
  { name: 'Matches', label: 'Matches', icon: 'matches', phase: 'Phase 5' },
  { name: 'Messages', label: 'Messages', icon: 'messages', phase: 'Phase 6' },
];

export type DrawerItem =
  | { kind: 'divider' }
  | {
      kind: 'screen';
      name: keyof Omit<DrawerParamList, 'Tabs'>;
      label: string;
      icon: IconName;
      phase?: string;
    }
  | { kind: 'action'; action: 'signOut'; label: string; icon: IconName };

/**
 * Dividers mirror the grouping the website uses in its sidebar
 * (`webSrc/src/app/dashboard/layout.tsx`): community, then personal, then
 * account.
 */
export const DRAWER_ITEMS: DrawerItem[] = [
  {
    kind: 'screen',
    name: 'EtaChapters',
    label: 'ETA Chapters',
    icon: 'etaChapters',
    phase: 'Phase 7',
  },
  {
    kind: 'screen',
    name: 'AiAssist',
    label: 'AI Assist',
    icon: 'aiAssist',
    phase: 'Phase 7',
  },
  { kind: 'divider' },
  {
    kind: 'screen',
    name: 'MyActivities',
    label: 'My Activities',
    icon: 'activities',
    phase: 'Phase 6',
  },
  {
    kind: 'screen',
    name: 'MyEvents',
    label: 'My Events',
    icon: 'events',
    phase: 'Phase 7',
  },
  {
    kind: 'screen',
    name: 'MyResources',
    label: 'My Resources',
    icon: 'resources',
    phase: 'Phase 7',
  },
  { kind: 'divider' },
  {
    kind: 'screen',
    name: 'AdManagement',
    label: 'Ad Management',
    icon: 'adManagement',
    phase: 'Phase 7',
  },
  {
    kind: 'screen',
    name: 'Settings',
    label: 'Settings',
    icon: 'settings',
    phase: 'Phase 7',
  },
  { kind: 'divider' },
  {
    kind: 'screen',
    name: 'SuggestFeature',
    label: 'Suggest a Feature',
    icon: 'suggest',
    phase: 'Phase 7',
  },
  { kind: 'action', action: 'signOut', label: 'Sign Out', icon: 'signOut' },
];
