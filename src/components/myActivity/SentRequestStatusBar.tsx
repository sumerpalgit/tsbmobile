import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import { formatRelativeTime } from '../../utils/formatRelativeTime';

export type SentStatus = 'requested' | 'nda_sent' | 'nda_signed' | 'cim_sent' | 'declined' | 'withdrawn' | 'applied' | string;

/** Ported from `webSrc/app/dashboard/components/activity/SentRequestStatusBar.tsx` — the sent-
 * request summary bar for an `interacted-posts` card. Note the more urgent `"NDA Received — Sign
 * Now"` copy for `nda_sent` here vs. `SentRequestOverlay`'s plainer `"NDA Received"` badge label
 * (Phase 3) — an intentional, confirmed difference between the list view and the detail view on
 * web, kept as-is. */
function config(status: SentStatus): { label: string; dot: string; text: string; bg: string } {
  switch (status) {
    case 'requested':
      return { label: 'Awaiting Response', dot: '#F59E0B', text: '#B45309', bg: 'rgba(245,158,11,.1)' };
    case 'nda_sent':
      return { label: 'NDA Received — Sign Now', dot: '#10B981', text: '#065F46', bg: 'rgba(16,185,129,.1)' };
    case 'nda_signed':
      return { label: 'NDA Signed', dot: '#10B981', text: '#065F46', bg: 'rgba(16,185,129,.1)' };
    case 'cim_sent':
      return { label: 'CIM Received', dot: '#0e7490', text: '#0e7490', bg: 'rgba(14,116,144,.1)' };
    case 'declined':
      return { label: 'Request Declined', dot: '#EF4444', text: '#B91C1C', bg: 'rgba(239,68,68,.1)' };
    case 'applied':
      return { label: 'Applied', dot: '#A7852D', text: '#7a6020', bg: 'rgba(180,132,40,.1)' };
    case 'withdrawn':
      return { label: 'Withdrawn', dot: '#64748B', text: '#64748B', bg: 'rgba(100,116,139,.08)' };
    default:
      return { label: String(status), dot: '#64748B', text: '#64748B', bg: 'rgba(100,116,139,.08)' };
  }
}

/** "Sent {relative time}" only shows for `requested`/`declined`/`withdrawn` — intentionally
 * hidden once NDA/CIM progress has happened, matching web's own condition exactly. */
const SHOWS_SENT_AT = new Set<SentStatus>(['requested', 'declined', 'withdrawn']);

export function SentRequestStatusBar({ status, sentAt }: { status: SentStatus; sentAt?: string }) {
  const { colors, fonts, borderWidth } = useTheme();
  const cfg = config(status);

  return (
    <View style={[styles.row, { borderTopColor: colors.border, borderTopWidth: borderWidth.thin }]}>
      <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
        <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
        <Text style={[fonts.semibold, styles.text, { color: cfg.text }]}>{cfg.label}</Text>
      </View>
      {sentAt && SHOWS_SENT_AT.has(status) && (
        <Text style={[fonts.regular, styles.sentAt, { color: colors.ink3 }]}>Sent {formatRelativeTime(sentAt)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
  },
  sentAt: {
    fontSize: 10.5,
  },
});
