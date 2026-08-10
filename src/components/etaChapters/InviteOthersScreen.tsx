import React, { useEffect, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import Toast from 'react-native-toast-message';
import { Check, Search, UserPlus, X } from 'lucide-react-native';
import { WEB_BASE_URL } from '@env';
import { useTheme } from '../../theme';
import { inviteByEmail, inviteEtaChapterUser, searchEtaInviteCandidates } from '../../api/eta';
import type { InviteCandidate } from '../../api/eta';
import { ConfirmDialog } from '../events/ConfirmDialog';

type InviteTab = 'email' | 'members' | 'link';
const ROLES = ['Searcher', 'Investor', 'Seller', 'Advisor', 'Lender'];
const EXPIRY_OPTIONS: { key: string; label: string }[] = [
  { key: '24h', label: '24 hrs' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'never', label: 'Never' },
];
const SEARCH_DEBOUNCE_MS = 350;

/** Invite Others — matches `ETAChapters_decoded.html`'s "INVITE OTHERS" (~line 836), full-screen
 * slide-in like the other overlay screens in this feature (`CreateChapterScreen`, mirrors the
 * app's established `FilterPanel`-style pattern). Three tabs backed by real endpoints (Email →
 * `inviteByEmail`, Existing Members → debounced `searchEtaInviteCandidates` + per-user
 * `inviteEtaChapterUser`). Share Link is faithfully ported as fake on web itself — the link is a
 * client-constructed URL with no server-issued token, "Revoke link" makes no API call at all, and
 * "Link expiry" is never sent anywhere — this replicates that exact non-functional-but-present
 * facade rather than inventing new backend web doesn't have. */
export function InviteOthersScreen({
  visible,
  chapterId,
  chapterName,
  onClose,
}: {
  visible: boolean;
  chapterId: string | null;
  chapterName: string;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<InviteTab>('email');

  // Email tab
  const [emails, setEmails] = useState<string[]>([]);
  const [emailDraft, setEmailDraft] = useState('');
  const [role, setRole] = useState('Searcher');
  const [message, setMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Existing Members tab
  const [memberQuery, setMemberQuery] = useState('');
  const [candidates, setCandidates] = useState<InviteCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sentUsernames, setSentUsernames] = useState<Set<string>>(new Set());
  const [sendingMembers, setSendingMembers] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Share Link tab
  const [expiry, setExpiry] = useState('7d');
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTab('email');
    setEmails([]);
    setEmailDraft('');
    setRole('Searcher');
    setMessage('');
    setMemberQuery('');
    setCandidates([]);
    setSelected(new Set());
    setSentUsernames(new Set());
    setExpiry('7d');
  }, [visible]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!memberQuery.trim()) {
      setCandidates([]);
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      searchEtaInviteCandidates(memberQuery.trim())
        .then(res => setCandidates(res.filter(c => !sentUsernames.has(c.username))))
        .catch(() => setCandidates([]));
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sentUsernames only needs to filter results at search time, not re-trigger the debounce itself.
  }, [memberQuery]);

  if (!chapterId) return null;
  const inviteLink = `${WEB_BASE_URL}/dashboard/my-eta-chapters?invite=${chapterId}`;

  const addEmail = () => {
    const v = emailDraft.trim().replace(/,$/, '');
    if (!v) return;
    setEmails(prev => (prev.includes(v) ? prev : [...prev, v]));
    setEmailDraft('');
  };

  const handleSendEmail = async () => {
    if (emails.length === 0) {
      Toast.show({ type: 'error', text1: 'Add at least one email address' });
      return;
    }
    setSendingEmail(true);
    try {
      const res = await inviteByEmail(emails, role.toLowerCase(), message.trim(), chapterId);
      Toast.show({ type: 'success', text1: res.message ?? `Invited ${res.sent ?? emails.length} people` });
      onClose();
    } catch {
      Toast.show({ type: 'error', text1: 'Could not send invites', text2: 'Please try again.' });
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendMembers = async () => {
    const usernames = Array.from(selected);
    if (usernames.length === 0) {
      Toast.show({ type: 'error', text1: 'Select at least one member' });
      return;
    }
    setSendingMembers(true);
    try {
      await Promise.all(usernames.map(username => inviteEtaChapterUser(username, chapterId)));
      setSentUsernames(prev => new Set([...prev, ...usernames]));
      setCandidates(prev => prev.filter(c => !usernames.includes(c.username)));
      setSelected(new Set());
      Toast.show({ type: 'success', text1: `Invited ${usernames.length} member${usernames.length === 1 ? '' : 's'}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Could not send some invites', text2: 'Please try again.' });
    } finally {
      setSendingMembers(false);
    }
  };

  const confirmRevoke = () => {
    setRevokeConfirmOpen(false);
    setTimeout(() => Toast.show({ type: 'success', text1: 'Invite link revoked.' }), 500);
  };

  const submitLabel = tab === 'email' ? (sendingEmail ? 'Sending…' : 'Send invites') : tab === 'members' ? (sendingMembers ? 'Sending…' : 'Send invites') : null;
  const handleSubmit = tab === 'email' ? handleSendEmail : tab === 'members' ? handleSendMembers : undefined;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.screen, { backgroundColor: colors.pageBg }]}>
        <LinearGradient colors={[colors.hero1, colors.hero2]} style={[styles.header, { paddingTop: insets.top + 12 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.headerRow}>
            <View style={[styles.headerIconWell, { backgroundColor: 'rgba(255,255,255,0.12)' }]}>
              <UserPlus size={19} color={colors.goldLight} strokeWidth={1.6} />
            </View>
            <View style={styles.headerText}>
              <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldLight }]}>INVITE TO {chapterName.toUpperCase()}</Text>
              <Text style={[fonts.display, styles.headerTitle, { color: '#fff' }]}>Invite Others</Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Close" style={styles.closeButton}>
              <X size={12} color="#fff" strokeWidth={1.8} />
            </Pressable>
          </View>
          <Text style={[fonts.regular, styles.headerSub, { color: 'rgba(255,255,255,0.7)' }]}>
            Bring searchers, investors, advisors and operators into your chapter.
          </Text>

          <View style={styles.tabTrack}>
            {(['email', 'members', 'link'] as InviteTab[]).map(t => {
              const active = tab === t;
              const label = t === 'email' ? 'By Email' : t === 'members' ? 'Existing Members' : 'Share Link';
              return (
                <Pressable
                  key={t}
                  onPress={() => setTab(t)}
                  style={[styles.tabButton, { backgroundColor: active ? '#fff' : 'transparent', borderRadius: radius.md }]}
                >
                  <Text style={[fonts.semibold, styles.tabLabel, { color: active ? colors.hero1 : 'rgba(255,255,255,0.65)' }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
          {tab === 'email' && (
            <View style={styles.section}>
              <Text style={[fonts.bold, styles.label, { color: colors.ink3 }]}>EMAIL ADDRESSES</Text>
              <View style={[styles.chipInputWrap, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl }]}>
                {emails.map(e => (
                  <View key={e} style={[styles.emailChip, { backgroundColor: colors.chip }]}>
                    <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.goldDark }]}>{e}</Text>
                    <Pressable onPress={() => setEmails(prev => prev.filter(x => x !== e))} hitSlop={6}>
                      <X size={10} color={colors.goldDark} strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}
                <TextInput
                  value={emailDraft}
                  onChangeText={setEmailDraft}
                  onSubmitEditing={addEmail}
                  onBlur={addEmail}
                  placeholder="Add email and press Enter…"
                  placeholderTextColor={colors.ink3}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[fonts.regular, styles.chipTextInput, { fontSize: fontSize.body, color: colors.ink }]}
                />
              </View>

              <Text style={[fonts.bold, styles.label, { color: colors.ink3, marginTop: 14 }]}>INVITING THEM AS</Text>
              <View style={styles.roleRow}>
                {ROLES.map(r => {
                  const active = role === r;
                  return (
                    <Pressable
                      key={r}
                      onPress={() => setRole(r)}
                      style={[styles.rolePill, { borderColor: active ? colors.goldLight : colors.border, backgroundColor: active ? colors.chip : colors.surface, borderRadius: radius.lg }]}
                    >
                      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.goldDark : colors.ink2 }]}>{r}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[fonts.bold, styles.label, { color: colors.ink3, marginTop: 14 }]}>PERSONAL MESSAGE (OPTIONAL)</Text>
              <TextInput
                value={message}
                onChangeText={text => setMessage(text.slice(0, 240))}
                placeholder="Add a personal note — why you think they'd be a great fit for the chapter…"
                placeholderTextColor={colors.ink3}
                multiline
                style={[fonts.regular, styles.textarea, { borderColor: colors.border, backgroundColor: colors.surface, color: colors.ink, borderRadius: radius.xl }]}
              />
              <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>{message.length} / 240</Text>
            </View>
          )}

          {tab === 'members' && (
            <View style={styles.section}>
              <Text style={[fonts.bold, styles.label, { color: colors.ink3 }]}>FIND TSB MEMBERS</Text>
              <View style={[styles.searchWrap, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl }]}>
                <Search size={14} color={colors.ink3} strokeWidth={1.6} />
                <TextInput
                  value={memberQuery}
                  onChangeText={setMemberQuery}
                  placeholder="Search by name, role or username…"
                  placeholderTextColor={colors.ink3}
                  style={[fonts.regular, styles.searchInput, { fontSize: fontSize.body, color: colors.ink }]}
                />
              </View>

              <View style={styles.memberRows}>
                {candidates.map(c => {
                  const isSelected = selected.has(c.username);
                  return (
                    <Pressable
                      key={c.username}
                      onPress={() =>
                        setSelected(prev => {
                          const next = new Set(prev);
                          if (next.has(c.username)) next.delete(c.username);
                          else next.add(c.username);
                          return next;
                        })
                      }
                      style={[styles.memberRow, { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin }]}
                    >
                      <View style={[styles.memberAvatar, { backgroundColor: colors.feedFill, borderRadius: radius.pill }]}>
                        <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.feedOnFill }]}>
                          {c.name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberText}>
                        <Text style={[fonts.bold, { fontSize: fontSize.body, color: colors.ink }]} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3 }]} numberOfLines={1}>
                          {[c.roleType, c.subCategory].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <View style={[styles.checkbox, { borderRadius: radius.sm, backgroundColor: isSelected ? colors.gold : colors.surface, borderColor: isSelected ? colors.gold : colors.border }]}>
                        {isSelected && <Check size={10} color="#fff" strokeWidth={2.4} />}
                      </View>
                    </Pressable>
                  );
                })}
                {memberQuery.trim().length > 0 && candidates.length === 0 && (
                  <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>No eligible members found.</Text>
                )}
              </View>
            </View>
          )}

          {tab === 'link' && (
            <View style={styles.section}>
              <Text style={[fonts.bold, styles.label, { color: colors.ink3 }]}>CHAPTER INVITE LINK</Text>
              <View style={styles.linkRow}>
                <View style={[styles.linkBox, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl }]}>
                  <Text numberOfLines={1} style={[fonts.regular, { fontSize: fontSize.small, color: colors.ink3 }]}>
                    {inviteLink}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Clipboard.setString(inviteLink);
                    Toast.show({ type: 'success', text1: 'Link copied' });
                  }}
                  style={[styles.copyButton, { backgroundColor: colors.feedFill, borderRadius: radius.xl }]}
                >
                  <Text style={[fonts.bold, { fontSize: fontSize.small, color: colors.feedOnFill }]}>Copy</Text>
                </Pressable>
              </View>
              <Text style={[fonts.regular, styles.hint, { color: colors.ink3 }]}>
                Expires {EXPIRY_OPTIONS.find(o => o.key === expiry)?.label.toLowerCase() ?? 'in 7 days'}
              </Text>

              <Text style={[fonts.bold, styles.label, { color: colors.ink3, marginTop: 14 }]}>LINK EXPIRY</Text>
              <View style={styles.roleRow}>
                {EXPIRY_OPTIONS.map(o => {
                  const active = expiry === o.key;
                  return (
                    <Pressable
                      key={o.key}
                      onPress={() => setExpiry(o.key)}
                      style={[
                        styles.expiryPill,
                        active
                          ? { backgroundColor: colors.feedFill, borderRadius: radius.lg }
                          : { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: borderWidth.thin },
                      ]}
                    >
                      <Text style={[fonts.semibold, { fontSize: fontSize.small, color: active ? colors.feedOnFill : colors.ink2 }]}>{o.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.linkActionsRow}>
                <Pressable
                  onPress={() => Linking.openURL(`mailto:?subject=${encodeURIComponent(`Join ${chapterName} on TSB`)}&body=${encodeURIComponent(inviteLink)}`)}
                  style={[styles.linkActionButton, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}
                >
                  <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>Email link</Text>
                </Pressable>
                <Pressable
                  onPress={() => setRevokeConfirmOpen(true)}
                  style={[styles.linkActionButton, { borderColor: colors.dangerSurface, backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}
                >
                  <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.danger }]}>Revoke link</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
          <Text style={[fonts.regular, styles.footerText, { color: colors.ink3 }]}>
            Invitees see chapter <Text style={[fonts.bold, { color: colors.ink2 }]}>{chapterName}</Text>
          </Text>
          <Pressable
            onPress={onClose}
            style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: colors.surface2, borderRadius: radius.xl, borderWidth: borderWidth.thin }]}
          >
            <Text style={[fonts.semibold, { fontSize: fontSize.small, color: colors.ink2 }]}>{tab === 'link' ? 'Close' : 'Cancel'}</Text>
          </Pressable>
          {handleSubmit && (
            <Pressable onPress={handleSubmit} style={[styles.submitButton, { backgroundColor: colors.gold, borderRadius: radius.xl }]}>
              <Text style={[fonts.bold, { fontSize: fontSize.small, color: '#fff' }]}>{submitLabel}</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ConfirmDialog
        visible={revokeConfirmOpen}
        title="Revoke invite link?"
        message="Anyone with the current link will no longer be able to use it."
        confirmLabel="Revoke"
        destructive
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeConfirmOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerIconWell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 21,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSub: {
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 14,
  },
  tabTrack: {
    flexDirection: 'row',
    gap: 3,
    padding: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabButton: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 24,
  },
  section: {
    gap: 7,
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  chipInputWrap: {
    minHeight: 52,
    padding: 9,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  chipTextInput: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 5,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rolePill: {
    height: 36,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  textarea: {
    height: 80,
    padding: 11,
    borderWidth: 1,
    fontSize: 13,
    lineHeight: 19,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 10.5,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 44,
    paddingHorizontal: 13,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    padding: 0,
  },
  memberRows: {
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 10,
  },
  memberAvatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberText: {
    flex: 1,
    minWidth: 0,
  },
  checkbox: {
    width: 19,
    height: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12.5,
    textAlign: 'center',
    paddingVertical: 24,
  },
  linkRow: {
    flexDirection: 'row',
    gap: 8,
  },
  linkBox: {
    flex: 1,
    minWidth: 0,
    height: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderWidth: 1,
  },
  copyButton: {
    height: 44,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expiryPill: {
    height: 38,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  linkActionButton: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  footerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 10.5,
  },
  cancelButton: {
    height: 44,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    height: 44,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
