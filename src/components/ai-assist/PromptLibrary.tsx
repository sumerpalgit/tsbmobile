import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, Sparkles, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import type { PromptCategory, PromptLibraryEntry } from '../../types/ai-assist';

/** Ported verbatim from webSrc's `PROMPT_CATEGORIES`/`PROMPT_LIBRARY` (`ai-assist/page.tsx`) —
 * business content, not UI, so it's a direct port regardless of the mockup-vs-web UI split. */
export const PROMPT_CATEGORIES: PromptCategory[] = [
  { id: 'all', label: 'All' },
  { id: 'dd', label: 'Due Diligence' },
  { id: 'val', label: 'Valuation' },
  { id: 'tax', label: 'Tax & Structure' },
  { id: 'str', label: 'Deal Structure' },
  { id: 'lender', label: 'Lender / SBA' },
];

export const PROMPT_LIBRARY: PromptLibraryEntry[] = [
  { cat: 'dd', label: 'Due Diligence', text: 'What are the key red flags to look for in 3 years of financial statements during QoE?', desc: 'Financial statement review' },
  { cat: 'dd', label: 'Due Diligence', text: 'Give me a due diligence checklist for a B2B SaaS acquisition under $5M ARR.', desc: 'SaaS DD checklist' },
  { cat: 'dd', label: 'Due Diligence', text: 'What questions should I ask the seller about customer concentration risk?', desc: 'Customer risk assessment' },
  { cat: 'dd', label: 'Due Diligence', text: 'How do I verify the working capital peg in a manufacturing business?', desc: 'Working capital verification' },
  { cat: 'dd', label: 'Due Diligence', text: 'What does a Proof of Cash analysis involve and when should I request one?', desc: 'Proof of Cash overview' },
  { cat: 'dd', label: 'Due Diligence', text: 'Explain deferred capex and how it should be treated in EBITDA normalisation.', desc: 'Capex normalisation' },
  { cat: 'val', label: 'Valuation', text: 'What EBITDA multiple should I apply for a $1.2M EBITDA landscaping business in 2025?', desc: 'Multiple benchmarking' },
  { cat: 'val', label: 'Valuation', text: 'How do I calculate a normalised EBITDA from an owner-operated P&L?', desc: 'EBITDA normalisation' },
  { cat: 'val', label: 'Valuation', text: 'What are the most defensible add-backs when presenting to an SBA lender?', desc: 'Add-back strategy' },
  { cat: 'val', label: 'Valuation', text: 'Compare DCF vs. EBITDA multiple approach for a service business acquisition.', desc: 'Valuation methodology' },
  { cat: 'val', label: 'Valuation', text: 'How does seller discretionary earnings (SDE) differ from EBITDA for micro-cap deals?', desc: 'SDE vs EBITDA' },
  { cat: 'tax', label: 'Tax & Structure', text: 'Explain the 338(h)(10) election and when it benefits the buyer vs. seller.', desc: 'Tax election guide' },
  { cat: 'tax', label: 'Tax & Structure', text: 'What is an F-reorganisation and why is it used in ETA deals?', desc: 'F-reorg overview' },
  { cat: 'tax', label: 'Tax & Structure', text: 'What are the main tax diligence items for a target with multi-state operations?', desc: 'Multi-state tax risk' },
  { cat: 'tax', label: 'Tax & Structure', text: 'How does IRC §382 affect a buyer acquiring an S-corp with prior NOLs?', desc: 'NOL limitation rules' },
  { cat: 'tax', label: 'Tax & Structure', text: 'Walk me through successor liability risk in an asset purchase agreement.', desc: 'Successor liability' },
  { cat: 'str', label: 'Deal Structure', text: 'How should I structure roll-over equity to align the seller post-close?', desc: 'Roll-over equity design' },
  { cat: 'str', label: 'Deal Structure', text: 'What earnout metrics are most founder-friendly vs. buyer-protective?', desc: 'Earnout structuring' },
  { cat: 'str', label: 'Deal Structure', text: 'Draft key SPA tax clauses I should negotiate as a buyer in an asset purchase.', desc: 'SPA tax clause guide' },
  { cat: 'str', label: 'Deal Structure', text: 'What is a management incentive plan (MIP) and how is it sized in ETA deals?', desc: 'MIP structuring' },
  { cat: 'lender', label: 'Lender / SBA', text: 'Compare SBA 7(a) vs 504 loan for acquiring a $4M EBITDA manufacturing business.', desc: 'SBA loan comparison' },
  { cat: 'lender', label: 'Lender / SBA', text: 'What does an SBA lender look for in a QoE report before approving a deal?', desc: 'SBA QoE requirements' },
  { cat: 'lender', label: 'Lender / SBA', text: 'How much equity injection do I need for a $3M SBA acquisition?', desc: 'Equity injection calc' },
  { cat: 'lender', label: 'Lender / SBA', text: 'What are the most common reasons SBA deals fall through at the lender stage?', desc: 'SBA deal killers' },
];

/** Search + category tabs + prompt cards, matching the mockup's `libraryOpen` block — a dedicated
 * pushed screen (`PromptLibraryScreen.tsx`, registered in `AppNavigator.tsx`) rather than the
 * `Modal` this used to be, for the same `useSafeAreaInsets()`-inside-`Modal` reliability reasons
 * as `CreateCampaignWizard`/`ContributeResourceSheet`. `initialCategory` lets the empty-state
 * topic chips deep-link straight into a filtered view; no reset-on-reopen effect needed anymore
 * since a screen push mounts this fresh every time, unlike the old always-mounted `Modal`. */
export function PromptLibrary({
  initialCategory,
  onClose,
  onSelectPrompt,
}: {
  initialCategory: string;
  onClose: () => void;
  onSelectPrompt: (text: string) => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth, elevation } = useTheme();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(initialCategory);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: PROMPT_LIBRARY.length };
    PROMPT_CATEGORIES.slice(1).forEach(c => {
      map[c.id] = PROMPT_LIBRARY.filter(p => p.cat === c.id).length;
    });
    return map;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROMPT_LIBRARY.filter(p => {
      const matchCat = category === 'all' || p.cat === category;
      const matchQ = !q || `${p.text} ${p.desc} ${p.label}`.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [query, category]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.pageBg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: colors.gold, borderRadius: radius.lg }]}>
            <Sparkles size={16} color="#fff" strokeWidth={1.6} />
          </View>
          <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]}>Prompt library</Text>
          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderRadius: radius.lg }]}
          >
            <X size={14} color={colors.ink2} strokeWidth={1.7} />
          </Pressable>
        </View>

        <View
          style={[
            styles.searchRow,
            { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl },
          ]}
        >
          <Search size={15} color={colors.ink3} strokeWidth={1.6} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search prompts…"
            placeholderTextColor={colors.ink3}
            style={[fonts.regular, styles.searchInput, { fontSize: fontSize.ui, color: colors.ink }]}
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PROMPT_CATEGORIES}
          keyExtractor={c => c.id}
          contentContainerStyle={styles.tabRow}
          renderItem={({ item }) => {
            const active = category === item.id;
            return (
              <Pressable
                onPress={() => setCategory(item.id)}
                style={[
                  styles.tab,
                  {
                    borderRadius: radius.lg,
                    backgroundColor: active ? colors.feedFill : colors.surfaceSunken,
                    borderColor: active ? colors.feedFill : colors.border,
                    borderWidth: borderWidth.thin,
                  },
                ]}
              >
                <Text style={[fonts.semibold, styles.tabLabel, { color: active ? colors.feedOnFill : colors.ink2 }]}>
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.tabCount,
                    { borderRadius: radius.sm, backgroundColor: active ? 'rgba(255,255,255,0.18)' : colors.chip },
                  ]}
                >
                  <Text style={[fonts.bold, styles.tabCountText, { color: active ? '#fff' : colors.goldDark }]}>
                    {counts[item.id]}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={[styles.list, { paddingBottom: 16 + insets.bottom }]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[fonts.bold, { fontSize: fontSize.subtitle, color: colors.ink }]}>No prompts found</Text>
            <Text style={[fonts.regular, styles.emptySub, { fontSize: fontSize.small + 1, color: colors.ink2 }]}>
              Try another keyword or pick a different category.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onSelectPrompt(item.text)}
            style={[
              styles.card,
              elevation('sm'),
              { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl, backgroundColor: colors.surface },
            ]}
          >
            <Text style={[fonts.bold, styles.cardCategory, { color: colors.goldDark }]}>{item.label}</Text>
            <Text style={[fonts.semibold, styles.cardText, { color: colors.ink }]}>{item.text}</Text>
            <Text style={[fonts.regular, { fontSize: fontSize.small + 1, color: colors.ink2 }]}>{item.desc}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  iconBadge: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 13,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  tabRow: {
    gap: 8,
    marginTop: 11,
    paddingRight: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 12.5,
  },
  tabCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabCountText: {
    fontSize: 10,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    padding: 14,
    gap: 8,
    marginBottom: 10,
  },
  cardCategory: {
    fontSize: 9.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18.5,
  },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptySub: {
    marginTop: 6,
    textAlign: 'center',
  },
});
