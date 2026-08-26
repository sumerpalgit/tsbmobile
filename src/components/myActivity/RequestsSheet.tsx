import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { Check, FileText, MessageSquare, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import { useFeedActions } from '../../hooks/useFeedActions';
import { useMessageMutations } from '../../hooks/useMessageMutations';
import { SendNdaSheet } from './SendNdaSheet';
import { SendCimSheet } from './SendCimSheet';
import type { MyActivityFeedItem, RecentRequester } from '../../api/myActivity';
import type { DrawerParamList } from '../../navigation/types';

const NAVY_1 = '#182E43';
const NAVY_3 = '#2a4d66';
const GREEN = '#1a7a48';
const GREEN_BG = '#e4f4ec';
const AMBER = '#B45309';
const AMBER_BG = '#FEF3C7';
const TEAL = '#0e7490';
const TEAL_BG = '#cffafe';
const RED = '#be123c';
const RED_BG = '#fff1f2';

function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

/** Matches web's `RequestDetailCard.tsx`'s own `relTime` granularity exactly (hour/day/month
 * buckets), distinct from the mini-cards' `cardTimeAgo` (minute/hour/day only) — this is a
 * different component with its own, already-confirmed real formatting. */
function relTime(iso?: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  const mo = Math.floor(d / 30);
  return `${mo} month${mo > 1 ? 's' : ''} ago`;
}

type RequestStatus = RecentRequester['status'];

function isDeclinedStatus(status: RequestStatus): boolean {
  return status === 'declined' || status === 'withdrawn';
}

/**
 * "View Requests" — the my-posts card's request list, opened from a `ViewRequestsButton` press.
 * Matches web's real `RequestsOverlay.tsx`/`RequestDetailCard.tsx` for the per-requester content,
 * status colors, and footer-action precedence (Send NDA/Decline while pending → static pill once
 * NDA sent → Send CIM once signed → static pill once CIM sent → static pill if declined), each row
 * built from the post's own already-embedded `recent_requesters` (no separate fetch, same "list
 * already has the detail" pattern web uses). Adapted to mobile as a single `BottomSheet` with a
 * vertical list — no mockup exists for this screen, and web's own internal tabs/search chrome
 * (All/Pending/NDA Sent/Declined) is intentionally left out of this first pass; a vertical list
 * avoids the sheet's own scroll fighting a horizontal one, unlike a card carousel would.
 * `document_type` defaults to `"nda"` when absent, matching web's own fallback — request rows here
 * are always NDA/PPM (My Activity's `my-posts` tab excludes job/event posts entirely, so the
 * job-application/event-RSVP branches `RequestDetailCard.tsx` has aren't reachable from here).
 * The "undo decline" affordance web has is deliberately omitted — it's client-state-only there too
 * (no real backend endpoint), and a control that silently doesn't survive a reload is worse than
 * not offering it.
 */
export function RequestsSheet({
  visible,
  item,
  onClose,
}: {
  visible: boolean;
  item: MyActivityFeedItem | null;
  onClose: () => void;
}) {
  const { colors, fonts } = useTheme();
  const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
  const feedActions = useFeedActions();
  const { startConversation } = useMessageMutations();

  const [ndaTarget, setNdaTarget] = useState<RecentRequester | null>(null);
  const [cimTarget, setCimTarget] = useState<RecentRequester | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [messagingUsername, setMessagingUsername] = useState<string | null>(null);

  const requesters = item?.recent_requesters ?? [];
  const postTitle = item ? (item.item as { post_title?: string }).post_title : undefined;

  const requestIdOf = (r: RecentRequester) => r.request_id || r.id || '';
  const documentTypeOf = (r: RecentRequester): 'nda' | 'ppm' => (r.document_type === 'ppm' ? 'ppm' : 'nda');

  const handleMessage = async (r: RecentRequester) => {
    if (!r.username || messagingUsername) return;
    setMessagingUsername(r.username);
    try {
      const conversationId = await startConversation({ username: r.username, name: r.name ?? 'Member', profileImg: r.profile_img });
      onClose();
      navigation.navigate('Tabs', {
        screen: 'Messages',
        params: {
          openConversation: { id: conversationId, name: r.name ?? 'Member', profileImg: r.profile_img ?? null, participantId: conversationId, unreadCount: 0 },
        },
      });
    } catch {
      // startConversation's own mutation surfaces no toast on failure (matches web) — silently no-op.
    } finally {
      setMessagingUsername(null);
    }
  };

  const handleDecline = async (r: RecentRequester) => {
    const requestId = requestIdOf(r);
    if (!requestId || decliningId) return;
    setDecliningId(requestId);
    try {
      await feedActions.declineRequest({ requestId, type: documentTypeOf(r) });
    } catch {
      // Toast already shown by the mutation's onError.
    } finally {
      setDecliningId(null);
    }
  };

  const handleSendNda = async (ndaUrl: string) => {
    if (!ndaTarget) return;
    try {
      await feedActions.sendNdaAsync({ requestId: requestIdOf(ndaTarget), ndaUrl });
      setNdaTarget(null);
    } catch {
      // Sheet stays open with its own `sending` state cleared by the mutation; toast already shown.
    }
  };

  const handleSendCim = async (cimUrl: string) => {
    if (!cimTarget) return;
    try {
      await feedActions.sendCimAsync({ requestId: requestIdOf(cimTarget), cimUrl });
      setCimTarget(null);
    } catch {
      // Toast already shown by the mutation's onError.
    }
  };

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[fonts.display, styles.headerTitle, { color: colors.ink }]} numberOfLines={1}>
              {postTitle || 'Requests'}
            </Text>
            <Text style={[fonts.regular, styles.headerSubtitle, { color: colors.ink3 }]}>
              {requesters.length} request{requesters.length === 1 ? '' : 's'}
            </Text>
          </View>
          <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.surfaceSunken, borderColor: colors.border }]}>
            <X size={14} color={colors.ink3} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {requesters.length === 0 ? (
            <Text style={[fonts.regular, styles.empty, { color: colors.ink3 }]}>No requests yet.</Text>
          ) : (
            requesters.map(r => (
              <RequestCard
                key={requestIdOf(r) || r.username || r.name}
                requester={r}
                declining={decliningId === requestIdOf(r)}
                messaging={messagingUsername === r.username}
                onSendNda={() => setNdaTarget(r)}
                onSendCim={() => setCimTarget(r)}
                onDecline={() => handleDecline(r)}
                onMessage={() => handleMessage(r)}
              />
            ))
          )}
        </ScrollView>
      </BottomSheet>

      <SendNdaSheet
        visible={!!ndaTarget}
        recipientName={ndaTarget?.name ?? 'Member'}
        recipientRole={ndaTarget?.sub_category ?? undefined}
        postTitle={postTitle}
        sending={feedActions.isSendingNda}
        onConfirm={handleSendNda}
        onClose={() => !feedActions.isSendingNda && setNdaTarget(null)}
      />

      <SendCimSheet
        visible={!!cimTarget}
        recipientName={cimTarget?.name ?? 'Member'}
        recipientRole={cimTarget?.sub_category ?? undefined}
        postTitle={postTitle}
        sending={feedActions.isSendingCim}
        onConfirm={handleSendCim}
        onClose={() => !feedActions.isSendingCim && setCimTarget(null)}
      />
    </>
  );
}

function RequestCard({
  requester,
  declining,
  messaging,
  onSendNda,
  onSendCim,
  onDecline,
  onMessage,
}: {
  requester: RecentRequester;
  declining: boolean;
  messaging: boolean;
  onSendNda: () => void;
  onSendCim: () => void;
  onDecline: () => void;
  onMessage: () => void;
}) {
  const { colors, fonts } = useTheme();
  const status = requester.status ?? 'requested';
  const isNdaSent = status === 'nda_sent';
  const isNdaSigned = status === 'nda_signed';
  const isCimSent = status === 'cim_sent';
  const isDeclined = isDeclinedStatus(status);

  const badge = isCimSent
    ? { label: 'CIM Sent', bg: TEAL, color: '#fff' }
    : isNdaSigned
      ? { label: 'NDA Signed', bg: GREEN, color: '#fff' }
      : isNdaSent
        ? { label: 'NDA Sent', bg: AMBER, color: '#fff' }
        : isDeclined
          ? { label: 'Declined', bg: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }
          : { label: 'New', bg: colors.gold, color: '#fff' };

  const strip = isCimSent
    ? { bg: TEAL_BG, color: TEAL, label: 'CIM sent', sub: 'Awaiting their review' }
    : isNdaSigned
      ? { bg: GREEN_BG, color: GREEN, label: 'NDA signed', sub: 'Ready to send CIM' }
      : isNdaSent
        ? { bg: AMBER_BG, color: AMBER, label: 'NDA sent', sub: 'Awaiting their signature' }
        : isDeclined
          ? { bg: colors.surfaceSunken, color: colors.ink3, label: 'Declined', sub: 'Not taken forward' }
          : { bg: colors.surfaceSunken, color: colors.ink3, label: 'NDA requested', sub: 'Awaiting your action' };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: isDeclined ? 0.65 : 1 }]}>
      <View style={[styles.cardBand, { backgroundColor: NAVY_1 }]}>
        <View style={[styles.avatar, { backgroundColor: NAVY_3 }]}>
          <Text style={[fonts.display, styles.avatarText]}>{initials(requester.name ?? 'Member')}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <View style={styles.badgeDot} />
          <Text style={[fonts.bold, styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={[fonts.display, styles.name, { color: colors.ink }]} numberOfLines={1}>
          {requester.name ?? 'Member'}
        </Text>
        {!!requester.sub_category && (
          <Text style={[fonts.regular, styles.role, { color: colors.ink2 }]} numberOfLines={1}>
            {requester.sub_category}
          </Text>
        )}
        {(requester.location ?? requester.city ?? requester.ticket_size ?? requester.ticket) != null && (
          <View style={styles.metaRow}>
            {!!(requester.location ?? requester.city) && (
              <Text style={[fonts.regular, styles.metaText, { color: colors.ink3 }]} numberOfLines={1}>
                {requester.location ?? requester.city}
              </Text>
            )}
            {!!(requester.ticket_size ?? requester.ticket) && (
              <Text style={[fonts.regular, styles.metaText, { color: colors.ink3 }]} numberOfLines={1}>
                {requester.ticket_size ?? requester.ticket}
              </Text>
            )}
          </View>
        )}
        {!!requester.requester_note && (
          <Text style={[fonts.regular, styles.note, { color: colors.ink2, backgroundColor: colors.surfaceSunken, borderColor: colors.border }]} numberOfLines={3}>
            "{requester.requester_note}"
          </Text>
        )}
        <Text style={[fonts.regular, styles.time, { color: colors.ink3 }]}>{relTime(requester.created_at ?? requester.requested_at)}</Text>
      </View>

      <View style={[styles.strip, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={[styles.stripIcon, { backgroundColor: strip.bg }]}>
          <FileText size={9} color={strip.color} strokeWidth={2} />
        </View>
        <View style={styles.stripText}>
          <Text style={[fonts.semibold, styles.stripLabel, { color: strip.color }]}>{strip.label}</Text>
          <Text style={[fonts.regular, styles.stripSub, { color: colors.ink3 }]}>{strip.sub}</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        {isCimSent ? (
          <>
            <StaticPill label="CIM Sent" bg={TEAL_BG} color={TEAL} />
            <MessageButton onPress={onMessage} loading={messaging} />
          </>
        ) : isNdaSigned ? (
          <>
            <StaticPill label="NDA Signed" bg={GREEN_BG} color={GREEN} icon={<Check size={10} color={GREEN} strokeWidth={2.4} />} />
            <Pressable onPress={onSendCim} style={[styles.actionButton, styles.flexButton, { backgroundColor: TEAL }]}>
              <FileText size={11} color="#fff" strokeWidth={2} />
              <Text style={[fonts.semibold, styles.actionLabel, { color: '#fff' }]}>Send CIM</Text>
            </Pressable>
            <MessageButton onPress={onMessage} loading={messaging} />
          </>
        ) : isNdaSent ? (
          <>
            <StaticPill label="NDA Sent" bg={AMBER_BG} color={AMBER} />
            <MessageButton onPress={onMessage} loading={messaging} />
          </>
        ) : isDeclined ? (
          <>
            <StaticPill label="Declined" bg={colors.surfaceSunken} color={colors.ink3} />
            <MessageButton onPress={onMessage} loading={messaging} />
          </>
        ) : (
          <>
            <Pressable onPress={onSendNda} disabled={declining} style={[styles.actionButton, styles.flexButton, { backgroundColor: GREEN }]}>
              <FileText size={11} color="#fff" strokeWidth={2} />
              <Text style={[fonts.semibold, styles.actionLabel, { color: '#fff' }]}>Send NDA</Text>
            </Pressable>
            <MessageButton onPress={onMessage} loading={messaging} />
            <Pressable
              onPress={onDecline}
              disabled={declining}
              style={[styles.actionButton, styles.squareButton, { backgroundColor: RED_BG, opacity: declining ? 0.6 : 1 }]}
            >
              {declining ? <ActivityIndicator size="small" color={RED} /> : <X size={12} color={RED} strokeWidth={2.4} />}
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

function StaticPill({ label, bg, color, icon }: { label: string; bg: string; color: string; icon?: React.ReactNode }) {
  const { fonts } = useTheme();
  return (
    <View style={[styles.actionButton, styles.flexButton, { backgroundColor: bg }]}>
      {icon}
      <Text style={[fonts.semibold, styles.actionLabel, { color }]}>{label}</Text>
    </View>
  );
}

function MessageButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} disabled={loading} style={[styles.actionButton, styles.squareButton, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth }]}>
      {loading ? <ActivityIndicator size="small" color={colors.ink3} /> : <MessageSquare size={11} color={colors.ink3} strokeWidth={2} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  headerText: { flex: 1, minWidth: 0 },
  headerTitle: { fontSize: 17, letterSpacing: -0.2, marginBottom: 2 },
  headerSubtitle: { fontSize: 11.5 },
  closeButton: { width: 28, height: 28, borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  list: { maxHeight: 520 },
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 30 },
  card: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', marginBottom: 12 },
  cardBand: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  avatar: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, color: '#fff' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.75)' },
  badgeLabel: { fontSize: 8, letterSpacing: 0.4, textTransform: 'uppercase' },
  cardBody: { paddingHorizontal: 12, paddingTop: 9 },
  name: { fontSize: 14 },
  role: { fontSize: 11, marginTop: 1, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  metaText: { fontSize: 10.5 },
  note: { fontSize: 11, lineHeight: 16, fontStyle: 'italic', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, padding: 9, marginBottom: 7 },
  time: { fontSize: 10, paddingBottom: 8 },
  strip: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth },
  stripIcon: { width: 18, height: 18, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  stripText: { flex: 1 },
  stripLabel: { fontSize: 10.5 },
  stripSub: { fontSize: 9, marginTop: 1 },
  footer: { flexDirection: 'row', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 8, height: 30 },
  flexButton: { flex: 1 },
  squareButton: { width: 30, flexShrink: 0 },
  actionLabel: { fontSize: 11 },
});
