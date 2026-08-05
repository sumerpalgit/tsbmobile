import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, FileText, Landmark, LineChart, Scale } from 'lucide-react-native';
import { useTheme } from '../../theme';

const TOPICS: { label: string; category: string }[] = [
  { label: 'Diligence', category: 'dd' },
  { label: 'Valuation', category: 'val' },
  { label: 'Tax', category: 'tax' },
  { label: 'SBA', category: 'lender' },
];

const STARTERS: { label: string; Icon: typeof LineChart }[] = [
  { label: 'What are common red flags in financial statements?', Icon: LineChart },
  { label: 'How do earn-outs typically work in M&A deals?', Icon: FileText },
  { label: 'What legal risks should I watch for pre-acquisition?', Icon: Scale },
  { label: 'What will an SBA lender need before a term sheet?', Icon: Landmark },
];

/** AI Assist's empty/landing state — greeting, topic chips (open the Prompt Library pre-filtered
 * to that category) and 4 starter prompts (ask immediately). Matches the mockup's "empty" view
 * (`isEmpty` block in the decoded template) structurally; greeting name and starter/topic copy
 * are ported verbatim since they're content, not layout.
 *
 * Root is a `ScrollView` (`contentContainerStyle` carries the `flexGrow:1, justifyContent:
 * 'center'` centering), not a plain centered `View` — when the keyboard opens and shrinks the
 * available height (via the manifest's `windowSoftInputMode="adjustResize"` and/or
 * `AiAssistScreen`'s `KeyboardAvoidingView`), a `justifyContent:'center'` `View` whose content is
 * taller than its shrunk container overflows equally in *both* directions instead of clipping —
 * this rendered the headline overlapping the header/status bar. A `ScrollView` clips to its own
 * viewport and lets the user scroll instead, so it degrades gracefully no matter how much height
 * the keyboard takes. `keyboardShouldPersistTaps="handled"` so a topic chip/starter prompt is
 * tappable in one tap while the composer's keyboard is still up, not swallowed as a dismiss. */
export function EmptyState({
  greetingName,
  onAsk,
  onOpenLibraryForCategory,
}: {
  greetingName?: string | null;
  onAsk: (text: string) => void;
  onOpenLibraryForCategory: (category: string) => void;
}) {
  const { colors, fonts, radius, borderWidth, spacing, elevation } = useTheme();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greetingBlock}>
        {greetingName ? (
          <Text style={[fonts.semibold, styles.eyebrow, { color: colors.ink3 }]}>
            Good morning, {greetingName}
          </Text>
        ) : null}
        <Text style={[fonts.display, styles.headline, { color: colors.ink }]}>
          What&apos;s on your mind today?
        </Text>
        <Text style={[fonts.regular, styles.sub, { color: colors.ink2 }]}>
          M&amp;A, ETA, deal structuring, valuations, tax — or anything about your live deals on
          TSB.
        </Text>
      </View>

      <View style={styles.topicsRow}>
        {TOPICS.map(t => (
          <Pressable
            key={t.category}
            onPress={() => onOpenLibraryForCategory(t.category)}
            style={({ pressed }) => [
              styles.topicChip,
              {
                borderColor: colors.borderSoft,
                borderWidth: borderWidth.thin,
                borderRadius: radius.lg,
                backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
              },
            ]}
          >
            <Text style={[fonts.semibold, styles.topicText, { color: colors.ink2 }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <View>
        <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>Start with</Text>
        <View style={{ gap: spacing.sm }}>
          {STARTERS.map(s => (
            <Pressable
              key={s.label}
              onPress={() => onAsk(s.label)}
              style={({ pressed }) => [
                styles.starterRow,
                elevation('sm'),
                {
                  borderColor: colors.borderSoft,
                  borderWidth: borderWidth.thin,
                  borderRadius: radius.xl,
                  backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
                },
              ]}
            >
              <View style={[styles.starterIconWell, { backgroundColor: colors.chip, borderRadius: radius.lg }]}>
                <s.Icon size={17} color={colors.goldDark} strokeWidth={1.6} />
              </View>
              <Text style={[fonts.semibold, styles.starterText, { color: colors.ink }]}>{s.label}</Text>
              <ChevronRight size={15} color={colors.gold} strokeWidth={1.8} />
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 24,
  },
  greetingBlock: {
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11.5,
  },
  headline: {
    fontSize: 27,
    lineHeight: 32,
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: -0.3,
  },
  sub: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 9,
    maxWidth: 300,
    alignSelf: 'center',
  },
  topicsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 7,
  },
  topicChip: {
    height: 32,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicText: {
    fontSize: 12,
  },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 2,
  },
  starterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
  },
  starterIconWell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starterText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18.5,
  },
});
