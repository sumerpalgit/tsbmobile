import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { Check, TriangleAlert, X } from 'lucide-react-native';
import { useTheme } from '../../theme';

/** Verbatim from `ETAChapters_decoded.html`'s `guideRules` (~line 1927) — real, substantial
 * static copy, not paraphrased. */
const GUIDE_RULES: { n: string; title: string; body: string; bullets?: string[]; hard?: string }[] = [
  {
    n: '1',
    title: 'Confidentiality before specifics',
    body: 'Anything shared in the platform — deal names, target companies, financials, founder identities — is to be treated as privileged information. Do not screenshot, forward, or repeat specifics outside the chapter without explicit permission.',
    bullets: [
      'NDA before specifics. If a member asks for a target name, EBITDA, or customer concentration, request an NDA first.',
      'Discuss themes and ranges publicly (e.g. "vertical SaaS, $2–5M EBITDA, Bay Area"). Save names and exact numbers for NDA-gated channels.',
      'Anonymized posts stay anonymized until the poster opts to reveal themselves.',
    ],
    hard: 'Sharing screenshots of TSB conversations on LinkedIn, X, or group chats outside TSB is grounds for immediate removal.',
  },
  {
    n: '2',
    title: 'Be helpful and be specific',
    body: 'Generic advice and "+1" replies clutter the feed. Bring your full self — your sector experience, ticket size, geography, and the actual decision you\'re wrestling with.',
    bullets: [
      'When asking for help, share enough context that an experienced member can give a real answer.',
      'When answering, lead with your direct experience over speculation.',
      'Recommend specific people, firms or resources by name when you can.',
    ],
  },
  {
    n: '3',
    title: 'No unsolicited pitches or spam',
    body: 'TSB is not a lead-generation tool. Members frequently turn into clients, partners and LPs — but only after relationship and value-add come first.',
    bullets: [
      'Do not cold-pitch services to other members in DM or chat. Lead with helpful answers — people will reach out when they need you.',
      'Do not post recurring promotions, affiliate links, or recruiting blasts in chapter chat.',
      '"Looking for an introduction to X" is fine. "I\'d love 30 minutes to demo our platform" is not.',
    ],
  },
  {
    n: '4',
    title: 'Securities and legal compliance',
    body: 'Many members raise capital, pitch deals, or coordinate offerings on the platform. The same rules apply here as elsewhere.',
    bullets: [
      'No general solicitation of unaccredited investors. Capital-raising messages must be limited to members with Accredited Investor verification status.',
      'Investment opportunities must be posted, not DMed unsolicited. Use the structured deal-post flow so disclosures and accreditation gating are applied.',
      'Do not give legal, tax or investment advice that could be construed as a fiduciary opinion.',
    ],
  },
  {
    n: '5',
    title: 'Respect, candor and conduct',
    body: 'Disagreement — including blunt disagreement — is welcomed. Personal attacks, harassment, and identity-based hostility are not.',
    bullets: [
      'Critique the deal, the thesis, the structure, the price — not the person.',
      'Zero tolerance for harassment, doxxing, racist/sexist content, or sustained hostility. First incident: warning. Second: suspension. Third: removal.',
      'If a member asks you to stop a particular behavior in chat or DMs, stop.',
      'Report violations via the Report menu on any message. Reports are reviewed by chapter moderators, not made public.',
    ],
  },
  {
    n: '6',
    title: 'Verification and role accuracy',
    body: 'The role badge next to your name signals what you do: Searcher, Investor, Seller, Advisor, Lender. Members use that signal to decide who to talk to and how.',
    bullets: [
      'Pick the role that most accurately reflects what you do most of your time.',
      'Do not fabricate accreditation, AUM, deal track record, or sector experience. Verification is checked during onboarding and may be re-audited.',
      'If your role changes (e.g. you closed your search, joined a fund), update your profile within 30 days.',
    ],
  },
  {
    n: '7',
    title: 'Moderation and enforcement',
    body: 'Each chapter has volunteer moderators. TSB staff have final authority. Decisions on warnings, suspensions, and removals are explained when issued and can be appealed by emailing community@tsb.app within 14 days. These guidelines may be updated periodically. Material changes will be communicated in chapter chat and re-confirmation may be required.',
  },
];

/** Community Guidelines gate — matches `ETAChapters_decoded.html`'s sheet (~line 1167) and web's
 * real per-chapter, session-scoped behavior (`sessionStorage["tsb_cg_session_{groupId}"]`, from
 * the ETA Chapters research spec) rather than the mockup's own looser implementation (its
 * `closeGuide` lets you into chat even without accepting — a mockup-only shortcut, not real
 * gating; this requires the checkbox before "Accept and continue" actually opens the chat,
 * matching the described real behavior). Session-scoped == in-memory here (an app cold start is
 * the mobile equivalent of a new browser session), not `AsyncStorage`, which would wrongly
 * persist across app launches.
 *
 * `viewOnly` (reopened from the chat options menu) skips the "opens chat on accept" behavior —
 * closing or accepting both just dismiss the sheet. */
export function CommunityGuidelinesSheet({
  visible,
  viewOnly = false,
  onAccept,
  onClose,
}: {
  visible: boolean;
  viewOnly?: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (visible) setChecked(false);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingBottom: insets.bottom },
          ]}
        >
          <LinearGradient colors={[colors.hero1, colors.hero2]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerRow}>
              <Text style={[fonts.display, styles.title, { color: '#fff' }]}>Community Guidelines</Text>
              <Pressable onPress={onClose} accessibilityLabel="Close" style={styles.closeButton}>
                <X size={13} color="#fff" strokeWidth={1.8} />
              </Pressable>
            </View>
            <Text style={[fonts.regular, styles.headerSub, { color: 'rgba(255,255,255,0.72)' }]}>
              The standards every member agrees to before joining chapter discussions.
            </Text>
          </LinearGradient>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={[styles.introBox, { backgroundColor: colors.chip, borderLeftColor: colors.gold }]}>
              <Text style={[fonts.regular, styles.introText, { color: colors.ink2 }]}>
                TSB is a professional community for searchers, investors, advisors and operators. Violations may
                result in warnings, suspension, or removal.
              </Text>
            </View>

            {GUIDE_RULES.map(rule => (
              <View key={rule.n} style={styles.ruleRow}>
                <View style={[styles.ruleNumber, { backgroundColor: colors.feedFill }]}>
                  <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.feedOnFill }]}>{rule.n}</Text>
                </View>
                <View style={styles.ruleBody}>
                  <Text style={[fonts.bold, styles.ruleTitle, { color: colors.ink }]}>{rule.title}</Text>
                  <Text style={[fonts.regular, styles.ruleText, { color: colors.ink3 }]}>{rule.body}</Text>
                  {rule.bullets?.map((b, i) => (
                    <View key={i} style={styles.bulletRow}>
                      <View style={[styles.bulletDot, { backgroundColor: colors.goldDark }]} />
                      <Text style={[fonts.regular, styles.bulletText, { color: colors.ink3 }]}>{b}</Text>
                    </View>
                  ))}
                  {rule.hard && (
                    <View style={[styles.hardBox, { backgroundColor: colors.chip }]}>
                      <TriangleAlert size={14} color={colors.goldDark} strokeWidth={1.6} style={styles.hardIcon} />
                      <Text style={[fonts.regular, styles.hardText, { color: colors.goldDark }]}>
                        <Text style={fonts.bold}>Hard rule: </Text>
                        {rule.hard}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
            <View style={{ height: 12 }} />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
            <Pressable onPress={() => setChecked(c => !c)} style={styles.checkboxRow}>
              <View
                style={[
                  styles.checkbox,
                  { borderRadius: radius.sm, backgroundColor: checked ? colors.gold : colors.surface, borderColor: checked ? colors.gold : colors.border },
                ]}
              >
                {checked && <Check size={10} color="#fff" strokeWidth={2.4} />}
              </View>
              <Text style={[fonts.regular, styles.checkboxText, { color: colors.ink2 }]}>
                I have read and agree to the <Text style={[fonts.bold, { color: colors.ink }]}>TSB Community Guidelines</Text>, the
                Terms of Service, and the Privacy Policy. I understand that violations may result in warnings,
                suspension, or removal.
              </Text>
            </Pressable>
            <Text style={[fonts.semibold, styles.lastUpdated, { color: colors.ink3 }]}>Last updated May 2026</Text>

            <View style={styles.actions}>
              <Pressable
                onPress={onClose}
                style={[styles.readLaterButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}
              >
                <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Read later</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!checked) return;
                  onAccept();
                }}
                disabled={!checked}
                style={[styles.acceptButton, { backgroundColor: checked ? colors.gold : colors.surfaceSunken, borderRadius: radius.xl }]}
              >
                <Text style={[fonts.bold, { fontSize: fontSize.body, color: checked ? '#fff' : colors.ink3 }]}>
                  {viewOnly ? 'Close' : 'Accept and continue'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(9,17,26,0.6)',
  },
  sheet: {
    maxHeight: '86%',
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    flex: 1,
    minWidth: 0,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 8,
  },
  // `flexShrink: 1`, NOT `flex: 1` — the outer `sheet` has `maxHeight` but no definite
  // `height` (it's content-sized, capped), and `flex: 1`/`flexGrow` needs a parent with a
  // definite height to distribute space from; without one, Yoga collapses the flexed child to
  // ~0 instead of expanding (confirmed on-device: the whole rule list vanished, only the
  // header/footer remained). `flexShrink: 1` doesn't have that requirement — it sizes to
  // content when there's room, and only compresses (enabling internal scroll) once the header +
  // this + the footer would otherwise exceed the sheet's `maxHeight`. Same fix needed anywhere
  // else this header+scroll+footer capped-bottom-sheet shape recurs.
  scroll: {
    flexShrink: 1,
    paddingHorizontal: 16,
  },
  introBox: {
    padding: 11,
    borderRadius: 12,
    borderLeftWidth: 3,
    marginTop: 15,
  },
  introText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  ruleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 13,
  },
  ruleNumber: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleBody: {
    flex: 1,
    minWidth: 0,
    gap: 7,
  },
  ruleTitle: {
    fontSize: 13,
  },
  ruleText: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 7,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 6,
  },
  bulletText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
    lineHeight: 16,
  },
  hardBox: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 11,
  },
  hardIcon: {
    marginTop: 1,
  },
  hardText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    gap: 11,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 19,
    height: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxText: {
    flex: 1,
    minWidth: 0,
    fontSize: 11.5,
    lineHeight: 16,
  },
  lastUpdated: {
    fontSize: 10.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
  },
  readLaterButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
