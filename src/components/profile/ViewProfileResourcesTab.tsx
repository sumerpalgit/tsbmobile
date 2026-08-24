import React, { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronRight, FileStack, Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';
import { ProfileResourceCard } from './resources/ProfileResourceCard';
import { ResourceCardSkeleton } from '../resources/ResourceCardSkeleton';
import { ConfirmDialog } from '../events/ConfirmDialog';
import { useSavedResources } from '../../hooks/useSavedResources';
import { getMyResources, trackView, deleteResource } from '../../api/resources';
import type { ResourceItem } from '../../types/resources';
import type { AppStackParamList } from '../../navigation/types';

const PREVIEW_COUNT = 3;

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * View Profile's Resources tab — Phase 5. The mockup's own version of this tab (`vpIsResources`,
 * decoded) is deliberately shallow: two "group" summary cards (My Contributions / Saved
 * Resources) that ALWAYS render empty in its own demo data, plus a dead-stub "Add New Resource"
 * button (`vpToastResource` just shows a toast, no real form) — confirmed there's no real
 * resource-item card design to copy from the mockup at all. Web's real `ResourcesSection`
 * component (`my-profile/page.tsx` renders `<Resources username=... showDeleteButton />`) is what
 * this tab actually matches functionally: two sections (Contributed / Saved), each preview-capped
 * at 3 with a View All/Show Less toggle, "Nothing here yet." empty copy (matches the mockup's own
 * empty-state text exactly — the one place both sources agree), and a static "Share Your
 * Knowledge" CTA banner.
 *
 * Reuses this app's OWN already-built Resources infrastructure for DATA (not visuals) rather than
 * re-fetching: `getMyResources()` (`GET /resource/my`) already returns exactly "resources this
 * signed-in user has contributed", the same scope web's `GET /resource/user/:username` needs.
 * `useSavedResources()` is this app's existing AsyncStorage-backed save list
 * (`MyResourcesScreen.tsx`'s own "Saved" tab) — a faithful port of web's own architecture (real
 * web's "saved" is ALSO 100% localStorage, not a backend relationship; confirmed via direct
 * research, not assumed).
 *
 * The CARD itself is `ProfileResourceCard.tsx` — CORRECTED after an earlier pass reused this
 * app's own `ResourceCard` (built for the unrelated My Resources browsing screen's own mockup,
 * visually much more elaborate: a per-type colored top border, an icon well, a views/downloads
 * metric row, an author avatar). Confirmed by reading web's actual `ContributedCard`/`SavedCard`
 * source (`ResourcesSection.tsx`, the real components THIS page renders) that none of that exists
 * — real cards are just title/description/badge/date, see that file's own doc comment for the
 * full writeup. No download button either (neither real card has one) — `onOpen` is a reasonable,
 * minimal addition since a card you can't interact with at all would be worse UX, and it reuses
 * the already-real `trackView` endpoint rather than inventing anything new.
 *
 * Delete is real (`DELETE /resource/delete/:id`, confirmed against web's own `ResourcesSection`
 * delete call — new `deleteResource()` in `api/resources.ts`), gated to the Contributed section
 * only (a saved-but-not-owned resource can't be deleted, same as web's `showDeleteButton` never
 * applying to `SavedCard`). "Share Your Knowledge" routes to the existing, REAL `ContributeResource`
 * screen — better than the mockup's own dead toast-stub, since this app already has a working
 * contribute flow (no reason to fake one when a real destination exists).
 */
export function ViewProfileResourcesTab() {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [contributed, setContributed] = useState<ResourceItem[]>([]);
  const [contributedExpanded, setContributedExpanded] = useState(false);
  const [savedExpanded, setSavedExpanded] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { savedResources, toggleSave, isLoaded: savedLoaded } = useSavedResources();

  /** `useFocusEffect`, NOT a plain mount-only `useEffect` — same fix `MyResourcesScreen.tsx`
   * already established for this exact problem (its own doc comment: "submitting a new resource
   * on `ContributeResourceScreen` and navigating back left this" stale). A mount-only fetch never
   * re-ran when the user came back from successfully creating a resource via "Share Your
   * Knowledge" → `ContributeResource`, since this tab stays mounted underneath that pushed screen
   * the whole time. `loading` is only ever set back to `false` here, never re-armed to `true` on
   * refocus, so a refocus-triggered refetch updates the list silently once it resolves instead of
   * flashing the skeleton loader again every time the user simply returns to this tab. */
  const loadContributed = useCallback(() => {
    getMyResources()
      .then(res => setContributed(res.resources))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContributed();
    }, [loadContributed]),
  );

  const handleOpen = (item: ResourceItem) => {
    const url = item.resource_link || item.file_url;
    if (url) {
      Linking.openURL(normalizeUrl(url)).catch(() => Toast.show({ type: 'error', text1: 'Could not open this resource' }));
    }
    // Fire-and-forget — no local `view_count` to bump anymore since the real card doesn't
    // display that number (see this file's own doc comment on why it was dropped).
    trackView(item.id).catch(() => {});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteResource(deleteTarget.id);
      setContributed(prev => prev.filter(r => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      Toast.show({ type: 'error', text1: 'Could not delete resource', text2: 'Please try again.' });
    } finally {
      setDeleting(false);
    }
  };

  const contributedVisible = contributedExpanded ? contributed : contributed.slice(0, PREVIEW_COUNT);
  const savedVisible = savedExpanded ? savedResources : savedResources.slice(0, PREVIEW_COUNT);

  return (
    <View style={styles.container}>
      <ResourceSection
        title="My Contributions"
        subtitle="Resources you've shared with the community"
        subhead="Contributed Resources"
        loading={loading}
        items={contributedVisible}
        totalCount={contributed.length}
        expanded={contributedExpanded}
        onToggleExpand={() => setContributedExpanded(v => !v)}
        renderItem={item => (
          <ProfileResourceCard
            key={item.id}
            item={item}
            variant="contributed"
            onOpen={() => handleOpen(item)}
            onDelete={() => setDeleteTarget(item)}
            deleting={deleting && deleteTarget?.id === item.id}
          />
        )}
      />

      <ResourceSection
        title="Saved Resources"
        subtitle="Resources you've bookmarked for later"
        subhead="Your Saved Collection"
        loading={!savedLoaded}
        items={savedVisible}
        totalCount={savedResources.length}
        expanded={savedExpanded}
        onToggleExpand={() => setSavedExpanded(v => !v)}
        renderItem={item => (
          <ProfileResourceCard
            key={item.id}
            item={item}
            variant="saved"
            onOpen={() => handleOpen(item)}
            onUnsave={() => toggleSave(item)}
          />
        )}
      />

      {/* Matches the decoded mockup's own CTA card exactly (`vpIsResources` block, the
          `border-radius:16px;background:var(--fill);padding:20px 16px;text-align:center` div) —
          no icon above the title (an earlier pass added one that isn't in the mockup at all),
          everything centered, and the button is its own auto-width pill (`display:inline-flex`),
          not stretched full-width. Copy text is the mockup's own real string verbatim. */}
      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <Text style={[fonts.display, styles.ctaTitle]}>Share Your Knowledge</Text>
        <Text style={styles.ctaBody}>
          Contribute to the community by sharing your insights, analyses, and resources with
          fellow investors and professionals.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('ContributeResource')}
          style={[styles.ctaButton, { backgroundColor: colors.gold }]}
        >
          <Plus size={13} color="#fff" strokeWidth={2.2} />
          <Text style={[fonts.bold, styles.ctaButtonText]}>Add New Resource</Text>
        </Pressable>
      </View>

      <ConfirmDialog
        visible={!!deleteTarget}
        eyebrow="DELETE RESOURCE"
        title="Are you sure?"
        message={`"${deleteTarget?.title ?? ''}" will be permanently deleted and cannot be recovered.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        destructive
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />
    </View>
  );
}

function ResourceSection({
  title,
  subtitle,
  subhead,
  loading,
  items,
  totalCount,
  expanded,
  onToggleExpand,
  renderItem,
}: {
  title: string;
  subtitle: string;
  subhead: string;
  loading: boolean;
  items: ResourceItem[];
  totalCount: number;
  expanded: boolean;
  onToggleExpand: () => void;
  renderItem: (item: ResourceItem) => React.ReactElement;
}) {
  const { colors, fonts } = useTheme();

  return (
    // Matches the mockup's own group-card markup exactly (`rsGroups` block): a single card
    // (`border-radius:16px, border:1px solid var(--line2), padding:14px`) whose gold accent
    // (`width:3px, border-radius:2px, background:var(--gold)`) is a flex sibling of ONLY the
    // title+subtitle text — inside a `display:flex;gap:10px` row — so it stretches to match
    // just that row's height (RN's own default `alignItems:'stretch'` on a row reproduces this
    // automatically). Web's real `SectionWrapper` confirms the same shape independently
    // (`borderLeft:4px solid gold` scoped to its own heading `div`, not the whole card). An
    // earlier pass got this wrong: the accent was a full-height sibling of the ENTIRE card body,
    // reading as "one whole edge of the card is a different color" instead of a small heading
    // accent — caught by the user, not something either real source actually shows.
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.homeCardBorder }]}>
      <View style={styles.headingRow}>
        <View style={[styles.headingAccent, { backgroundColor: colors.gold }]} />
        <View style={styles.headingText}>
          <Text style={[fonts.display, styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
          <Text style={[fonts.regular, styles.sectionSubtitle, { color: colors.ink3 }]}>{subtitle}</Text>
        </View>
      </View>

      {/* Subhead label (mockup-styled, unchanged) + View All/Show Less — position/copy/icon match
          web's real `SectionWrapper` exactly (`ResourcesSection.tsx`): inline next to the subhead
          text, plain "View All"/"Show Less" with no count number, trailing chevron-right icon.
          Visibility is a DELIBERATE deviation from web's own literal behavior, not a missed
          match: web shows this whenever `hasItems` (loading OR count > 0), even when there are
          only 1-2 items and toggling it wouldn't reveal anything more — confirmed as a genuine
          web quirk, then explicitly asked to be fixed rather than preserved once seen live. Only
          shown here when there's actually more to reveal (`totalCount > PREVIEW_COUNT`). */}
      <View style={styles.subheadRow}>
        <Text style={[fonts.bold, styles.sectionSubhead, { color: colors.ink2 }]}>{subhead}</Text>
        {totalCount > PREVIEW_COUNT && (
          <Pressable onPress={onToggleExpand} style={styles.toggleButton}>
            <Text style={[fonts.medium, styles.toggleButtonText, { color: colors.gold }]}>
              {expanded ? 'Show Less' : 'View All'}
            </Text>
            <ChevronRight size={14} color={colors.gold} strokeWidth={2.5} />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.skeletonList}>
          <ResourceCardSkeleton />
        </View>
      ) : items.length === 0 ? (
        <View style={[styles.emptyBox, { borderColor: colors.homeCardBorder, backgroundColor: colors.surfaceSunken }]}>
          <FileStack size={18} color={colors.ink3} strokeWidth={1.6} />
          <Text style={[fonts.semibold, styles.emptyText, { color: colors.ink3 }]}>Nothing here yet.</Text>
        </View>
      ) : (
        <View style={styles.itemsList}>{items.map(renderItem)}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 14 },
  section: { borderRadius: 16, borderWidth: 1, padding: 14 },
  headingRow: { flexDirection: 'row', gap: 10 },
  headingAccent: { width: 3, borderRadius: 2 },
  headingText: { flex: 1, minWidth: 0 },
  sectionTitle: { fontSize: 16, letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 11, marginTop: 3 },
  subheadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 13 },
  sectionSubhead: { fontSize: 12 },
  skeletonList: { marginTop: 10 },
  emptyBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 26,
    paddingHorizontal: 12,
    marginTop: 9,
  },
  emptyText: { fontSize: 12 },
  itemsList: { gap: 10, marginTop: 10 },
  toggleButton: { flexDirection: 'row', alignItems: 'center', gap: 1, flexShrink: 0 },
  toggleButtonText: { fontSize: 12 },
  ctaCard: { borderRadius: 16, paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center' },
  ctaTitle: { fontSize: 18, color: '#fff', textAlign: 'center' },
  ctaBody: { fontSize: 11.5, color: 'rgba(255,255,255,0.62)', lineHeight: 18, marginTop: 7, textAlign: 'center' },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'center',
    marginTop: 14,
  },
  ctaButtonText: { fontSize: 13, color: '#fff' },
});
