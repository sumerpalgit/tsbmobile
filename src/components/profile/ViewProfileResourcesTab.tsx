import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FileStack, Plus } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';
import { ResourceCard } from '../resources/ResourceCard';
import { ResourceCardSkeleton } from '../resources/ResourceCardSkeleton';
import { ConfirmDialog } from '../events/ConfirmDialog';
import { useSavedResources } from '../../hooks/useSavedResources';
import { getMyResources, trackDownload, trackView, deleteResource } from '../../api/resources';
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
 * Reuses this app's OWN already-built Resources infrastructure rather than re-implementing it —
 * confirmed via research this was the right call, not a shortcut: `getMyResources()` (`GET
 * /resource/my`) already returns exactly "resources this signed-in user has contributed", the
 * same scope web's `GET /resource/user/:username` needs. `useSavedResources()` is this app's
 * existing AsyncStorage-backed save list (`MyResourcesScreen.tsx`'s own "Saved" tab) — a faithful
 * port of web's own architecture (real web's "saved" is ALSO 100% localStorage, not a backend
 * relationship; confirmed via direct research, not assumed). `ResourceCard` is reused verbatim
 * (gained an optional `onDelete` prop for this tab only — `MyResourcesScreen` never passes it, so
 * its own cards are unaffected). Open/download handling (`handleOpen`/`handleDownload`) is copied
 * from `MyResourcesScreen.tsx` verbatim — same `trackView`/`trackDownload` "confirmed-then-applied"
 * local count-bump behavior, not re-derived.
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

  const { savedResources, savedIds, toggleSave, isLoaded: savedLoaded } = useSavedResources();

  useEffect(() => {
    getMyResources()
      .then(res => setContributed(res.resources))
      .finally(() => setLoading(false));
  }, []);

  const incrementViewCount = (id: number) =>
    setContributed(prev => prev.map(r => (r.id === id ? { ...r, view_count: r.view_count + 1 } : r)));
  const incrementDownloadCount = (id: number) =>
    setContributed(prev => prev.map(r => (r.id === id ? { ...r, download_count: r.download_count + 1 } : r)));

  const handleOpen = (item: ResourceItem) => {
    const url = item.resource_link || item.file_url;
    if (url) {
      Linking.openURL(normalizeUrl(url)).catch(() => Toast.show({ type: 'error', text1: 'Could not open this resource' }));
    }
    trackView(item.id)
      .then(res => {
        if (!res?.skipped) incrementViewCount(item.id);
      })
      .catch(() => {});
  };

  const handleDownload = (item: ResourceItem) => {
    trackDownload(item.id)
      .then(res => {
        if (res?.fileUrl) {
          Linking.openURL(res.fileUrl).catch(() => {});
          if (!res?.skipped) incrementDownloadCount(item.id);
        }
      })
      .catch(() => {
        if (item.file_url) Linking.openURL(item.file_url).catch(() => {});
      });
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
          <ResourceCard
            key={item.id}
            item={item}
            saved={savedIds.has(item.id)}
            onOpen={() => handleOpen(item)}
            onToggleSave={() => toggleSave(item)}
            onDownload={() => handleDownload(item)}
            onDelete={() => setDeleteTarget(item)}
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
          <ResourceCard
            key={item.id}
            item={item}
            saved
            onOpen={() => handleOpen(item)}
            onToggleSave={() => toggleSave(item)}
            onDownload={() => handleDownload(item)}
          />
        )}
      />

      <View style={[styles.ctaCard, { backgroundColor: colors.hero1 }]}>
        <FileStack size={22} color={colors.goldLight} strokeWidth={1.6} />
        <Text style={[fonts.display, styles.ctaTitle]}>Share Your Knowledge</Text>
        <Text style={styles.ctaBody}>
          Contribute a guide, template, or tool the community can benefit from.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('ContributeResource')}
          style={[styles.ctaButton, { backgroundColor: colors.gold }]}
        >
          <Plus size={15} color="#fff" strokeWidth={2.2} />
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
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.sectionAccent, { backgroundColor: colors.gold }]} />
      <View style={styles.sectionBody}>
        <Text style={[fonts.display, styles.sectionTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[fonts.regular, styles.sectionSubtitle, { color: colors.ink3 }]}>{subtitle}</Text>
        <Text style={[fonts.bold, styles.sectionSubhead, { color: colors.ink2 }]}>{subhead.toUpperCase()}</Text>

        {loading ? (
          <View style={styles.skeletonList}>
            <ResourceCardSkeleton />
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.surfaceSunken }]}>
            <FileStack size={18} color={colors.ink3} strokeWidth={1.6} />
            <Text style={[fonts.semibold, styles.emptyText, { color: colors.ink3 }]}>Nothing here yet.</Text>
          </View>
        ) : (
          <View style={styles.itemsList}>{items.map(renderItem)}</View>
        )}

        {totalCount > PREVIEW_COUNT && (
          <Pressable onPress={onToggleExpand} style={styles.toggleButton}>
            <Text style={[fonts.bold, styles.toggleButtonText, { color: colors.gold }]}>
              {expanded ? 'Show Less' : `View All (${totalCount})`}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28, gap: 14 },
  section: { flexDirection: 'row', borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionAccent: { width: 3 },
  sectionBody: { flex: 1, padding: 14 },
  sectionTitle: { fontSize: 16.5, letterSpacing: -0.2 },
  sectionSubtitle: { fontSize: 11, marginTop: 2 },
  sectionSubhead: { fontSize: 11, letterSpacing: 0.4, marginTop: 10 },
  skeletonList: { marginTop: 10 },
  emptyBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 22,
    marginTop: 10,
  },
  emptyText: { fontSize: 12 },
  itemsList: { gap: 10, marginTop: 10 },
  toggleButton: { alignSelf: 'center', paddingVertical: 10, marginTop: 2 },
  toggleButtonText: { fontSize: 12 },
  ctaCard: { borderRadius: 16, padding: 18, alignItems: 'flex-start', gap: 6 },
  ctaTitle: { fontSize: 18, color: '#fff', marginTop: 4 },
  ctaBody: { fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 17 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: 12,
    alignSelf: 'stretch',
    marginTop: 10,
  },
  ctaButtonText: { fontSize: 13, color: '#fff' },
});
