import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { types } from '@react-native-documents/picker';
import { Check, ExternalLink, FileText, MessageSquare, X } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { FileUploadButton, PickedFile } from '../FileUploadButton';
import { uploadDocument } from '../../api/profile';
import { useFeedActions } from '../../hooks/useFeedActions';
import { useMessageMutations } from '../../hooks/useMessageMutations';
import type { MyActivityFeedItem } from '../../api/myActivity';
import type { DrawerParamList } from '../../navigation/types';

const GREEN = '#059669';
const GREEN_BG = 'rgba(5,150,105,0.07)';
const GREEN_BORDER = 'rgba(5,150,105,0.2)';
const AMBER = '#D97706';
const TEAL = '#0e7490';
const TEAL_BG = 'rgba(14,116,144,0.07)';
const TEAL_BORDER = 'rgba(14,116,144,0.2)';
const RED = '#DC2626';
const RED_BG = 'rgba(220,38,38,0.07)';
const RED_BORDER = 'rgba(220,38,38,0.2)';
const NAVY = '#182E43';

type SentStatus = 'requested' | 'nda_sent' | 'nda_signed' | 'cim_sent' | 'declined' | 'withdrawn' | string;

function statusBadge(status: SentStatus): { label: string; color: string } {
  switch (status) {
    case 'nda_sent':
    case 'nda_signed':
      return { label: status === 'nda_signed' ? 'NDA Signed' : 'NDA Received', color: GREEN };
    case 'cim_sent':
      return { label: 'CIM Received', color: TEAL };
    case 'declined':
      return { label: 'Declined', color: RED };
    case 'withdrawn':
      return { label: 'Withdrawn', color: '#8496A8' };
    default:
      return { label: 'Awaiting Response', color: AMBER };
  }
}

function fmt(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

type SentTab = 'details' | 'timeline' | 'note';

/**
 * "View My Request" — the interacted-posts card's own sent-request tracker, opened from a
 * `ViewMyRequestButton` press. Matches web's real `SentRequestOverlay.tsx`: same 3-tab layout
 * (Request Details / Timeline / My Note) under a fixed header (status + "Sent {date}") and owner
 * toolbar, status colors, timeline steps, and action gating (sign NDA while `nda_sent`, withdraw
 * while `requested`/`nda_sent`) — built from the post's own already-embedded `interaction_details`
 * (no separate fetch). Web's own "Timeline" tab duplicates the same steps already shown on
 * "Request Details" — replicated as-is rather than "deduplicated", since that's the real, if
 * redundant, web behavior. No "Mark as Done" — web's own page never wires `onMarkDone`, so it's
 * dead there too, not ported. Reachable rows here are always NDA/PPM (My Activity's
 * `interacted-posts` tab excludes job/event posts, matching web's own exclusion — see
 * `ActivityFilterPanel.tsx`'s `applyActivityFilters`).
 *
 * "My Request Note" is empty for requests actually sent from this app: mobile's own request
 * buttons (`requestDealNda`/`requestPpm`/`handleInvestorCornerAction`, see
 * `utils/feedPrimaryAction.ts` and every mini-card's `handlePress`) never collect or send a
 * `requester_note` — there's no note-input step anywhere in mobile's request flow yet, unlike
 * web's `RequestModal.tsx`. That's a real gap in the request flow, not a display bug here — the
 * "My Note" tab shows web's own "No note was added with this request." copy for that case instead
 * of silently hiding the section, so it reads as expected-empty rather than broken.
 */
export function SentRequestSheet({
  visible,
  item,
  onClose,
}: {
  visible: boolean;
  item: MyActivityFeedItem | null;
  onClose: () => void;
}) {
  const { colors, fonts, radius } = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const feedActions = useFeedActions();
  const { startConversation } = useMessageMutations();

  const [signedFile, setSignedFile] = useState<PickedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [activeTab, setActiveTab] = useState<SentTab>('details');

  useEffect(() => {
    if (visible) {
      setSignedFile(null);
      setActiveTab('details');
    }
  }, [visible]);

  const det = item?.interaction_details ?? {};
  const status: SentStatus = det.status ?? 'requested';
  const documentType = det.document_type ?? 'nda';
  const docLabel = documentType === 'cim' ? 'CIM' : documentType === 'pitch_deck' ? 'Pitch Deck' : documentType === 'ppm' ? 'PPM' : 'NDA';
  const docType: 'nda' | 'ppm' = documentType === 'ppm' ? 'ppm' : 'nda';
  const interactionType: 'nda_request' | 'ppm_request' = documentType === 'ppm' ? 'ppm_request' : 'nda_request';
  const requestId = det.requestId;
  const requestedAt = item?.interaction_date ?? item?.created_at ?? '';
  const postTitle = item ? (item.item as { post_title?: string }).post_title : undefined;
  const owner = item?.profile;

  const badge = statusBadge(status);
  const canWithdraw = status === 'requested' || status === 'nda_sent';
  const canSign = status === 'nda_sent';

  const handleMessage = async () => {
    if (!owner?.username || messaging) return;
    setMessaging(true);
    try {
      const conversationId = await startConversation({ username: owner.username, name: owner.name ?? 'Member', profileImg: owner.profile_img });
      onClose();
      navigation.navigate('Tabs', {
        screen: 'Messages',
        params: {
          openConversation: { id: conversationId, name: owner.name ?? 'Member', profileImg: owner.profile_img ?? null, participantId: conversationId, unreadCount: 0 },
        },
      });
    } catch {
      // startConversation's own mutation surfaces no toast on failure (matches web) — silently no-op.
    } finally {
      setMessaging(false);
    }
  };

  const handleWithdraw = async () => {
    if (!requestId) return;
    try {
      await feedActions.withdrawRequest({ requestId, type: docType });
    } catch {
      // Toast already shown by the mutation's onError.
    }
  };

  const handleSubmitSignedNda = async () => {
    if (!requestId || !signedFile) return;
    setUploading(true);
    try {
      const { fileUrl } = await uploadDocument(signedFile, 'signed_nda');
      await feedActions.signNda({ requestId, signedNdaUrl: fileUrl, interactionType });
      setSignedFile(null);
    } catch {
      Toast.show({ type: 'error', text1: 'Upload failed', text2: 'Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  const openUrl = (url?: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  const timelineBlock = (
    <View style={styles.timeline}>
      <TimelineStep label={`${docLabel} requested`} sub="You sent a request on this post." date={fmt(requestedAt)} color={colors.accentSolid} last={!det.nda_sent_at && !det.signed_at && !det.declined_at && !det.withdrawn_at} />
      {det.nda_sent_at ? (
        <TimelineStep label="NDA received from owner" sub="Your request was approved. Sign the NDA to unlock deal documents." date={fmt(det.nda_sent_at)} color={GREEN} last={!det.signed_at && !det.declined_at} />
      ) : det.declined_at || det.withdrawn_at ? null : (
        <TimelineStep label="Awaiting owner response" sub={`${owner?.name ?? 'The owner'} has been notified. Most owners respond within 24–48 hours.`} date="Pending" color={AMBER} last />
      )}
      {!!det.signed_at && <TimelineStep label="Signed & returned" sub="Deal documents are now unlocked." date={fmt(det.signed_at)} color={GREEN} last={!det.cim_sent_at && !det.declined_at} />}
      {!!det.cim_sent_at && <TimelineStep label="CIM received" sub="The owner has shared the Confidential Information Memorandum." date={fmt(det.cim_sent_at)} color={TEAL} last={!det.declined_at} />}
      {!!det.declined_at && (
        <TimelineStep label="Request declined" sub={`${owner?.name ?? 'The owner'} reviewed your profile and chose not to proceed at this time.`} date={fmt(det.declined_at)} color={RED} last />
      )}
      {!!det.withdrawn_at && <TimelineStep label="Request withdrawn" sub="You withdrew this request." date={fmt(det.withdrawn_at)} color={colors.ink3} last />}
    </View>
  );

  const noteBlock = det.requester_note ? (
    <View style={[styles.noteBox, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
      <Text style={[fonts.regular, styles.noteText, { color: colors.ink2 }]}>"{det.requester_note}"</Text>
      <Text style={[fonts.regular, styles.noteFooter, { color: colors.ink3 }]}>Sent with request · {fmt(requestedAt)}</Text>
    </View>
  ) : (
    <Text style={[fonts.regular, styles.noteEmpty, { color: colors.ink3 }]}>No note was added with this request.</Text>
  );

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[fonts.regular, styles.eyebrow, { color: colors.ink3 }]}>MY REQUEST FOR</Text>
          <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]} numberOfLines={2}>
            {postTitle || '—'}
          </Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: badge.color }]} />
            <Text style={[fonts.semibold, styles.statusLabel, { color: badge.color }]}>{badge.label}</Text>
            <Text style={[fonts.regular, styles.statusSep, { color: colors.ink3 }]}>·</Text>
            <Text style={[fonts.regular, styles.statusSent, { color: colors.ink3 }]}>Sent {fmt(requestedAt)}</Text>
          </View>
        </View>
        <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
          <X size={14} color={colors.ink3} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {(['details', 'timeline', 'note'] as const).map(t => {
          const labels: Record<SentTab, string> = { details: 'Request Details', timeline: 'Timeline', note: 'My Note' };
          const active = activeTab === t;
          return (
            <Pressable key={t} onPress={() => setActiveTab(t)} style={[styles.tab, active && { borderBottomColor: colors.accentSolid }]}>
              <Text style={[active ? fonts.bold : fonts.semibold, styles.tabLabel, { color: active ? colors.ink : colors.ink3 }]}>{labels[t]}</Text>
            </Pressable>
          );
        })}
      </View>

      {!!owner && (
        <View style={[styles.ownerRow, { borderColor: colors.border, backgroundColor: colors.surfaceSunken }]}>
          <View style={[styles.ownerAvatar, { backgroundColor: NAVY }]}>
            <Text style={[fonts.display, styles.ownerInitials]}>{(owner.name ?? 'M').slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[fonts.semibold, styles.ownerName, { color: colors.ink }]} numberOfLines={1}>
              {owner.name ?? 'Member'}
            </Text>
            {!!owner.sub_category && (
              <Text style={[fonts.regular, styles.ownerRole, { color: colors.ink3 }]} numberOfLines={1}>
                {owner.sub_category}
              </Text>
            )}
          </View>
          <MessageButton onPress={handleMessage} loading={messaging} />
        </View>
      )}

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {activeTab === 'timeline' && (
          <>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>REQUEST TIMELINE</Text>
            {timelineBlock}
          </>
        )}

        {activeTab === 'note' && (
          <>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>MY REQUEST NOTE</Text>
            {noteBlock}
          </>
        )}

        {activeTab === 'details' && (
          <>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>REQUEST TIMELINE</Text>
            {timelineBlock}

            {status === 'nda_sent' && (
          <View style={[styles.box, { backgroundColor: GREEN_BG, borderColor: GREEN_BORDER }]}>
            <View style={styles.boxHeader}>
              <View style={[styles.boxIcon, { backgroundColor: GREEN }]}>
                <FileText size={13} color="#fff" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[fonts.bold, styles.boxTitle, { color: GREEN }]}>NDA Ready to Sign</Text>
                <Text style={[fonts.regular, styles.boxSub, { color: colors.ink3 }]}>
                  The post owner approved your request. Review and sign to unlock deal documents.
                </Text>
              </View>
            </View>
            {!!(det.nda_url ?? det.ppm_url) && (
              <Pressable onPress={() => openUrl(det.nda_url ?? det.ppm_url)} style={styles.linkRow}>
                <ExternalLink size={11} color={GREEN} strokeWidth={2} />
                <Text style={[fonts.semibold, styles.linkText, { color: GREEN }]}>View NDA document</Text>
              </Pressable>
            )}

            <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.ink2 }]}>Upload your signed NDA</Text>
            <FileUploadButton value={signedFile} onChange={setSignedFile} acceptedTypes={[types.pdf, types.docx, types.doc]} placeholder="Tap to choose file…" loading={uploading} />
            <Pressable
              onPress={handleSubmitSignedNda}
              disabled={!signedFile || uploading || feedActions.isSigningNda}
              style={[styles.primaryButton, { backgroundColor: !signedFile || uploading ? colors.creamBorderBold : GREEN, borderRadius: radius.lg }]}
            >
              {uploading || feedActions.isSigningNda ? (
                <ActivityIndicator size="small" color={!signedFile ? colors.ink3 : '#fff'} />
              ) : (
                <Check size={13} color={!signedFile ? colors.ink3 : '#fff'} strokeWidth={2.2} />
              )}
              <Text style={[fonts.semibold, styles.primaryButtonLabel, { color: !signedFile || uploading ? colors.ink3 : '#fff' }]}>
                {uploading ? 'Submitting…' : 'Submit Signed NDA'}
              </Text>
            </Pressable>
          </View>
        )}

        {(status === 'nda_signed' || status === 'cim_sent') && (
          <View style={[styles.box, styles.boxRow, { backgroundColor: GREEN_BG, borderColor: GREEN_BORDER }]}>
            <View style={[styles.boxIcon, styles.boxIconSmall, { backgroundColor: GREEN }]}>
              <Check size={12} color="#fff" strokeWidth={2.4} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[fonts.bold, styles.boxTitle, { color: GREEN }]}>NDA Signed — Documents Unlocked</Text>
              {!!det.signed_nda_url && (
                <Pressable onPress={() => openUrl(det.signed_nda_url)}>
                  <Text style={[fonts.semibold, styles.linkTextUnderline, { color: GREEN }]}>View signed NDA →</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {status === 'cim_sent' && (
          <View style={[styles.box, { backgroundColor: TEAL_BG, borderColor: TEAL_BORDER }]}>
            <View style={styles.boxHeader}>
              <View style={[styles.boxIcon, { backgroundColor: TEAL }]}>
                <FileText size={13} color="#fff" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[fonts.bold, styles.boxTitle, { color: TEAL }]}>CIM Received</Text>
                <Text style={[fonts.regular, styles.boxSub, { color: colors.ink3 }]}>The owner has shared the Confidential Information Memorandum.</Text>
              </View>
            </View>
            {!!det.cim_url && (
              <Pressable onPress={() => openUrl(det.cim_url)} style={styles.linkRow}>
                <ExternalLink size={11} color={TEAL} strokeWidth={2} />
                <Text style={[fonts.semibold, styles.linkText, { color: TEAL }]}>View CIM document</Text>
              </Pressable>
            )}
          </View>
        )}

        {status === 'declined' && (
          <View style={[styles.box, { backgroundColor: RED_BG, borderColor: RED_BORDER }]}>
            <Text style={[fonts.bold, styles.boxTitle, { color: RED, marginBottom: 4 }]}>Request Declined</Text>
            <Text style={[fonts.regular, styles.declinedBody, { color: RED }]}>
              {owner?.name ?? 'The owner'} reviewed your profile and chose not to share deal documents at this time. This is often a
              mandate fit issue rather than a personal decision — you can reach out to clarify.
            </Text>
          </View>
        )}

        {!!det.requester_note && (
          <>
            <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>MY REQUEST NOTE</Text>
            <View style={[styles.noteBox, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
              <Text style={[fonts.regular, styles.noteText, { color: colors.ink2 }]}>"{det.requester_note}"</Text>
              <Text style={[fonts.regular, styles.noteFooter, { color: colors.ink3 }]}>Sent with request · {fmt(requestedAt)}</Text>
            </View>
          </>
        )}

        {canWithdraw && !canSign && (
          <View style={styles.actionRow}>
            <Pressable onPress={handleMessage} disabled={messaging} style={[styles.secondaryButton, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderRadius: radius.lg }]}>
              <MessageSquare size={12} color={colors.ink2} strokeWidth={2} />
              <Text style={[fonts.semibold, styles.secondaryLabel, { color: colors.ink2 }]}>Message</Text>
            </Pressable>
            <Pressable
              onPress={handleWithdraw}
              disabled={feedActions.isWithdrawingRequest}
              style={[styles.secondaryButton, { backgroundColor: RED_BG, borderColor: RED_BORDER, borderRadius: radius.lg }]}
            >
              {feedActions.isWithdrawingRequest ? <ActivityIndicator size="small" color={RED} /> : <X size={12} color={RED} strokeWidth={2.2} />}
              <Text style={[fonts.semibold, styles.secondaryLabel, { color: RED }]}>
                {feedActions.isWithdrawingRequest ? 'Withdrawing…' : 'Withdraw request'}
              </Text>
            </Pressable>
          </View>
        )}

        {(status === 'declined' || status === 'withdrawn') && (
          <View style={[styles.staticNotice, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
            <Text style={[fonts.semibold, styles.staticNoticeText, { color: colors.ink3 }]}>
              {status === 'declined' ? 'Request Declined — No Further Action' : 'Request Withdrawn'}
            </Text>
          </View>
        )}
          </>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

function TimelineStep({ label, sub, date, color, last }: { label: string; sub: string; date: string; color: string; last?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.step, last && { marginBottom: 0 }]}>
      <View style={styles.stepIconCol}>
        <View style={[styles.stepDot, { backgroundColor: color }]} />
        {!last && <View style={[styles.stepLine, { backgroundColor: colors.border }]} />}
      </View>
      <View style={styles.stepText}>
        <Text style={[fonts.bold, styles.stepLabel, { color }]}>{label}</Text>
        <Text style={[fonts.regular, styles.stepSub, { color: colors.ink3 }]}>{sub}</Text>
        <Text style={[fonts.regular, styles.stepDate, { color: colors.ink3 }]}>{date}</Text>
      </View>
    </View>
  );
}

function MessageButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={loading} style={[styles.messageButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {loading ? <ActivityIndicator size="small" color={colors.ink3} /> : <MessageSquare size={12} color={colors.ink2} strokeWidth={2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  headerText: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 9.5, letterSpacing: 0.6, marginBottom: 3 },
  headerTitle: { fontSize: 16, letterSpacing: -0.2, lineHeight: 20, marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11.5 },
  statusSep: { fontSize: 11 },
  statusSent: { fontSize: 11 },
  closeButton: { width: 28, height: 28, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, marginBottom: 14 },
  tab: { paddingVertical: 8, paddingHorizontal: 12, marginRight: 4, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 12.5 },
  body: { maxHeight: 420 },
  ownerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, marginBottom: 16 },
  ownerAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ownerInitials: { fontSize: 12, color: '#fff' },
  ownerName: { fontSize: 12.5 },
  ownerRole: { fontSize: 10.5, marginTop: 1 },
  messageButton: { width: 30, height: 30, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 9.5, letterSpacing: 0.7, marginBottom: 8 },
  timeline: { marginBottom: 16 },
  step: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stepIconCol: { alignItems: 'center', width: 12 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { width: 1.5, flex: 1, minHeight: 14, marginTop: 3 },
  stepText: { flex: 1, paddingTop: 0 },
  stepLabel: { fontSize: 12.5, lineHeight: 16 },
  stepSub: { fontSize: 10.5, marginTop: 2, lineHeight: 14.5 },
  stepDate: { fontSize: 9.5, marginTop: 2 },
  box: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, padding: 12, marginBottom: 14 },
  boxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  boxHeader: { flexDirection: 'row', gap: 9, marginBottom: 8 },
  boxIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  boxIconSmall: { width: 22, height: 22, borderRadius: 11 },
  boxTitle: { fontSize: 12.5 },
  boxSub: { fontSize: 10.5, marginTop: 2, lineHeight: 14.5 },
  declinedBody: { fontSize: 11, lineHeight: 16, opacity: 0.85 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 10 },
  linkText: { fontSize: 11 },
  linkTextUnderline: { fontSize: 10.5, textDecorationLine: 'underline' },
  fieldLabel: { fontSize: 11, marginBottom: 6, marginTop: 4 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderRadius: 10, marginTop: 10 },
  primaryButtonLabel: { fontSize: 12.5 },
  noteBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 11, marginBottom: 14 },
  noteText: { fontSize: 11.5, fontStyle: 'italic', lineHeight: 17 },
  noteFooter: { fontSize: 10, marginTop: 6 },
  noteEmpty: { fontSize: 12.5, textAlign: 'center', paddingVertical: 24 },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  secondaryButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 42, borderWidth: StyleSheet.hairlineWidth },
  secondaryLabel: { fontSize: 12 },
  staticNotice: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 10, height: 42, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  staticNoticeText: { fontSize: 12 },
});
