import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, HelpCircle, Minus, Plus, X } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../BottomSheet';
import type { EventItem } from '../../types/home';

type Attendance = 'going' | 'maybe' | 'no';
type RsvpResponse = 'attending' | 'maybe' | 'not_attending';

/** Matches web's own inline construction of `RsvpModal`'s `eventDate` prop (`SelectFeedCardComponent`'s
 * `EventFooter` call site) exactly: date + start time + timezone, space-joined, each piece
 * omitted when absent. Shared here so every screen that opens this modal builds the same string
 * instead of re-deriving it. */
export function formatRsvpEventDate(item: EventItem): string | undefined {
  if (!item.start_date) return undefined;
  const date = new Date(item.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = item.start_time ? ` · ${item.start_time.slice(0, 5)}` : '';
  const tz = item.timezone ? ` ${item.timezone}` : '';
  return `${date}${time}${tz}`;
}

const RSVP_OPTS: { key: Attendance; label: string; Icon: typeof Check }[] = [
  { key: 'going', label: 'Going', Icon: Check },
  { key: 'maybe', label: 'Maybe', Icon: HelpCircle },
  { key: 'no', label: "Can't make it", Icon: X },
];

const GREEN = '#1a7a48';
const GREEN_BG = '#e4f4ec';

/**
 * RSVP flow — matches web's real `RsvpModal.tsx` (`webSrc/app/dashboard/components/cards/
 * utils/RsvpModal.tsx`) exactly: a Going/Maybe/Can't-make-it picker, a guests stepper (hidden for
 * "Can't make it"), an optional note to the host, then an in-sheet success state (not a toast —
 * web has none here either) summarizing what was submitted. Ported as this app's established
 * `BottomSheet` form-sheet shell (same as `JobApplyFormSheet.tsx`) rather than web's own centered
 * floating card — every field, state, and copy is otherwise the same.
 *
 * Confirmed real quirk, replicated on purpose: web's own `onSubmit` only ever sends `{event_id,
 * rsvp_response}` to the backend — `guests`/`note` are captured in the UI and shown back in the
 * success summary, but never actually submitted anywhere. Not a mobile gap; that's web's real,
 * live behavior (`submitEventRsvp` in `webSrc/hooks/useFeedActions.ts`), so this doesn't send them
 * either — `onSubmit` here only takes `(response, guests, note)` for display purposes on the
 * success screen, same as web.
 */
export function RsvpModal({
  visible,
  eventName,
  eventDate,
  eventLocation,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  onClose: () => void;
  onSubmit: (response: RsvpResponse, guests: number, note: string) => Promise<void>;
}) {
  const { colors, fonts, fontSize, radius } = useTheme();
  const [att, setAtt] = useState<Attendance | null>(null);
  const [guests, setGuests] = useState(1);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<1 | 2>(1);

  useEffect(() => {
    if (!visible) {
      setAtt(null);
      setGuests(1);
      setNote('');
      setLoading(false);
      setStage(1);
    }
  }, [visible]);

  const btnLabel = att === 'going' ? 'Confirm RSVP' : att === 'maybe' ? 'Save as Maybe' : att === 'no' ? 'Send response' : 'Confirm RSVP';
  const attLabel = att === 'going' ? 'Going' : att === 'maybe' ? 'Maybe' : "Can't make it";
  const successHeadline = att === 'going' ? "You're going!" : att === 'maybe' ? 'Marked as Maybe' : 'Response sent';
  const successSub =
    att === 'going'
      ? `We've added ${eventName || 'this event'} to your calendar. The host has been notified.`
      : att === 'maybe'
        ? "We'll remind you before the event so you can confirm."
        : 'Thanks for letting the host know.';
  const subtitle = [eventDate, eventLocation].filter(Boolean).join(' · ');

  const handleSubmit = async () => {
    if (!att || loading) return;
    setLoading(true);
    try {
      const apiVal: RsvpResponse = att === 'going' ? 'attending' : att === 'maybe' ? 'maybe' : 'not_attending';
      await onSubmit(apiVal, guests, note.trim());
      setStage(2);
    } catch {
      // Matches web's own empty catch — errors here are surfaced via the mutation's own Toast.
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!loading}>
      <View style={[styles.headerBanner, { backgroundColor: colors.accentSolid, borderRadius: radius.xl }]}>
        <Pressable onPress={onClose} disabled={loading} style={styles.closeButton} accessibilityLabel="Close">
          <X size={14} color="rgba(255,255,255,.85)" strokeWidth={1.8} />
        </Pressable>
        {!!eventName && (
          <View style={styles.eyebrowRow}>
            <View style={[styles.eyebrowBar, { backgroundColor: colors.gold }]} />
            <Text style={[fonts.bold, styles.eyebrowText, { color: colors.goldLight }]} numberOfLines={1}>
              {eventName}
            </Text>
          </View>
        )}
        <Text style={[fonts.display, styles.headerTitle]}>RSVP to this event</Text>
        {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
        {stage === 1 ? (
          <View style={styles.body}>
            <Text style={[fonts.bold, styles.fieldLabel, { color: colors.ink2 }]}>WILL YOU ATTEND?</Text>
            <View style={styles.optionsRow}>
              {RSVP_OPTS.map(opt => {
                const selected = att === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setAtt(opt.key)}
                    style={[
                      styles.optionButton,
                      {
                        borderColor: selected ? GREEN : colors.border,
                        backgroundColor: selected ? GREEN_BG : colors.surface,
                        borderRadius: radius.lg,
                      },
                    ]}
                  >
                    <View style={[styles.optionIconWell, { backgroundColor: selected ? GREEN : colors.creamDark }]}>
                      <opt.Icon size={14} color={selected ? '#fff' : colors.ink2} strokeWidth={1.8} />
                    </View>
                    <Text style={[fonts.semibold, styles.optionLabel, { color: colors.ink }]}>{opt.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {att !== 'no' && (
              <View>
                <Text style={[fonts.bold, styles.fieldLabel, { color: colors.ink2 }]}>NUMBER OF GUESTS (INCL. YOU)</Text>
                <View style={[styles.stepper, { borderColor: colors.border, borderRadius: radius.lg }]}>
                  <Pressable
                    onPress={() => setGuests(g => Math.max(1, g - 1))}
                    disabled={guests <= 1}
                    style={[styles.stepperButton, { backgroundColor: colors.creamDark }]}
                  >
                    <Minus size={15} color={guests <= 1 ? colors.ink3 : colors.accentSolid} strokeWidth={2} />
                  </Pressable>
                  <Text style={[fonts.semibold, styles.stepperValue, { color: colors.ink }]}>{guests}</Text>
                  <Pressable
                    onPress={() => setGuests(g => Math.min(10, g + 1))}
                    disabled={guests >= 10}
                    style={[styles.stepperButton, { backgroundColor: colors.creamDark }]}
                  >
                    <Plus size={15} color={guests >= 10 ? colors.ink3 : colors.accentSolid} strokeWidth={2} />
                  </Pressable>
                </View>
              </View>
            )}

            <View>
              <Text style={[fonts.bold, styles.fieldLabel, { color: colors.ink2 }]}>
                NOTE TO HOST <Text style={[fonts.regular, styles.fieldLabelOptional, { color: colors.ink3 }]}>(dietary needs, questions — optional)</Text>
              </Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={3}
                placeholder="e.g. Vegetarian. Looking forward to it."
                placeholderTextColor={colors.ink3}
                style={[styles.textarea, { borderColor: colors.border, borderRadius: radius.lg, color: colors.ink }]}
              />
            </View>

            <View style={styles.actionsRow}>
              <Pressable
                onPress={onClose}
                disabled={loading}
                style={[styles.cancelButton, { borderColor: colors.border, borderRadius: radius.lg }]}
              >
                <Text style={[fonts.semibold, styles.actionText, { color: colors.ink2 }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!att || loading}
                style={[
                  styles.confirmButton,
                  { backgroundColor: !att || loading ? colors.creamBorder : colors.accentSolid, borderRadius: radius.lg },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Check size={14} color="#fff" strokeWidth={1.8} />
                    <Text style={[fonts.semibold, styles.actionText, { color: '#fff' }]}>{btnLabel}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.successBody}>
            <View style={[styles.successIconWell, { backgroundColor: GREEN_BG }]}>
              <Check size={26} color={GREEN} strokeWidth={2.2} />
            </View>
            <Text style={[fonts.display, styles.successHeadline, { color: colors.ink }]}>{successHeadline}</Text>
            <Text style={[fonts.regular, styles.successSub, { fontSize: fontSize.body, color: colors.ink2 }]}>{successSub}</Text>

            <View style={[styles.summaryCard, { backgroundColor: colors.cream, borderColor: colors.creamBorder, borderRadius: radius.lg }]}>
              <SummaryRow label="Status" value={attLabel} border />
              {!!eventDate && <SummaryRow label="When" value={eventDate} border={att !== 'no' || !!note.trim()} />}
              {att !== 'no' && <SummaryRow label="Guests" value={String(guests)} border={!!note.trim()} />}
              {!!note.trim() && <SummaryRow label="Note" value={note.trim()} />}
            </View>

            <Pressable onPress={onClose} style={[styles.doneButton, { backgroundColor: colors.accentSolid, borderRadius: radius.lg }]}>
              <Text style={[fonts.semibold, styles.actionText, { color: '#fff' }]}>Done</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
}

function SummaryRow({ label, value, border }: { label: string; value: string; border?: boolean }) {
  const { colors, fonts } = useTheme();
  return (
    <View style={[styles.summaryRow, border && { borderBottomColor: colors.creamDark, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <Text style={[styles.summaryLabel, { color: colors.ink3 }]}>{label}</Text>
      <Text style={[fonts.semibold, styles.summaryValue, { color: colors.ink }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBanner: {
    padding: 18,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,.18)',
    backgroundColor: 'rgba(255,255,255,.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingRight: 36,
  },
  eyebrowBar: {
    width: 16,
    height: 1,
  },
  eyebrowText: {
    fontSize: 9.5,
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  headerTitle: {
    fontSize: 18,
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,.6)',
    marginTop: 5,
  },
  scroll: {
    maxHeight: 460,
  },
  body: {
    paddingVertical: 18,
    gap: 16,
  },
  fieldLabel: {
    fontSize: 10.5,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  fieldLabelOptional: {
    fontSize: 10.5,
    letterSpacing: 0,
    textTransform: 'none',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 7,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  optionIconWell: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 11.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    minWidth: 46,
    textAlign: 'center',
    fontSize: 14,
  },
  textarea: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    fontSize: 13,
    minHeight: 68,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 16,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 46,
  },
  actionText: {
    fontSize: 13,
  },
  successBody: {
    paddingVertical: 22,
    paddingBottom: 6,
    alignItems: 'center',
  },
  successIconWell: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successHeadline: {
    fontSize: 19,
    marginBottom: 6,
  },
  successSub: {
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
    marginBottom: 18,
  },
  summaryCard: {
    width: '100%',
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  doneButton: {
    width: '100%',
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
