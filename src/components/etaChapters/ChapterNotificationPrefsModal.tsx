import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Mail, MapPin, MessageSquare, Star, User, Volume2, X } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { Switch } from '../Switch';
import { fetchChapterPrefs, updateChapterPrefs } from '../../api/eta';
import type { ChapterNotifPrefs } from '../../types/etaChapters';

const DEFAULTS: ChapterNotifPrefs = {
  pinned: false,
  mute_all: false,
  notify_messages: true,
  notify_mentions: true,
  notify_events: true,
  notify_new_members: false,
  email_digest: false,
};

const TYPE_ROWS: { key: keyof ChapterNotifPrefs; label: string; description: string; icon: LucideIcon }[] = [
  { key: 'notify_messages', label: 'New messages', description: 'Notify when new messages are posted in chat', icon: MessageSquare },
  { key: 'notify_mentions', label: 'Mentions', description: 'When someone @mentions you in a message', icon: Star },
  { key: 'notify_events', label: 'New events', description: 'Chapter events, meetups, and webinars', icon: Calendar },
  { key: 'notify_new_members', label: 'New members', description: 'When someone joins this chapter', icon: User },
];

const EMAIL_ROWS: { key: keyof ChapterNotifPrefs; label: string; description: string; icon: LucideIcon }[] = [
  { key: 'email_digest', label: 'Weekly email digest', description: 'Chapter highlights delivered to your inbox', icon: Mail },
];

/** Per-chapter notification preferences — matches web's `ChapterNotificationPrefsModal`
 * (`fetchChapterPrefs`/`updateChapterPrefs`). "Mute all" (top-level) disables every other row
 * while on, same as web. `onPinChange` bubbles the saved `pinned` value up so the caller can
 * update the chat-list's pinned-first sort without a full refetch. */
export function ChapterNotificationPrefsModal({
  visible,
  chapterId,
  chapterName,
  onPinChange,
  onClose,
}: {
  visible: boolean;
  chapterId: string | null;
  chapterName: string;
  onPinChange?: (pinned: boolean) => void;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const insets = useSafeAreaInsets();

  const [prefs, setPrefs] = useState<ChapterNotifPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!visible || !chapterId) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    fetchChapterPrefs(chapterId)
      .then(p => setPrefs({ ...DEFAULTS, ...p }))
      .catch(() => setPrefs(DEFAULTS))
      .finally(() => setLoading(false));
  }, [visible, chapterId]);

  const setField = (key: keyof ChapterNotifPrefs, value: boolean) => setPrefs(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!chapterId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateChapterPrefs(chapterId, prefs);
      onPinChange?.(updated.pinned);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        onClose();
      }, 900);
    } catch {
      setError('Could not save your preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          onPress={e => e.stopPropagation()}
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <View style={styles.headerRow}>
            <View style={[styles.headerIcon, { backgroundColor: colors.navy, borderRadius: radius.lg }]}>
              <MapPin size={16} color={colors.gold} strokeWidth={1.8} />
            </View>
            <View style={styles.headerTextWrap}>
              <Text style={[fonts.bold, styles.eyebrow, { color: colors.gold }]}>CHAPTER SETTINGS</Text>
              <Text numberOfLines={1} style={[fonts.display, styles.title, { color: colors.ink }]}>
                Notification Preferences
              </Text>
              {!!chapterName && (
                <Text numberOfLines={1} style={[fonts.regular, styles.subtitle, { color: colors.ink3 }]}>
                  {chapterName}
                </Text>
              )}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Close"
              style={[styles.closeButton, { backgroundColor: colors.surface2, borderColor: colors.border, borderRadius: radius.lg, borderWidth: borderWidth.thin }]}
            >
              <X size={13} color={colors.ink2} strokeWidth={1.8} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.gold} />
              <Text style={[fonts.regular, { fontSize: fontSize.body, color: colors.ink3 }]}>Loading preferences…</Text>
            </View>
          ) : (
            <View style={styles.rows}>
              <ToggleRow
                icon={Volume2}
                label="Mute all notifications"
                description="Silence everything from this chapter"
                value={prefs.mute_all}
                onChange={v => setField('mute_all', v)}
                emphasis
              />

              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>NOTIFICATION TYPES</Text>
              {TYPE_ROWS.map(row => (
                <ToggleRow
                  key={row.key}
                  icon={row.icon}
                  label={row.label}
                  description={row.description}
                  value={prefs[row.key] as boolean}
                  onChange={v => setField(row.key, v)}
                  disabled={prefs.mute_all}
                />
              ))}

              <Text style={[fonts.bold, styles.sectionLabel, { color: colors.ink3 }]}>EMAIL</Text>
              {EMAIL_ROWS.map(row => (
                <ToggleRow
                  key={row.key}
                  icon={row.icon}
                  label={row.label}
                  description={row.description}
                  value={prefs[row.key] as boolean}
                  onChange={v => setField(row.key, v)}
                  last
                />
              ))}
            </View>
          )}

          {error && <Text style={[fonts.regular, styles.errorText, { color: colors.danger }]}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              style={[styles.cancelButton, { backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.xl }]}
            >
              <Text style={[fonts.semibold, { fontSize: fontSize.body, color: colors.ink2 }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={saving || loading}
              style={[styles.saveButton, { backgroundColor: colors.navy, borderRadius: radius.xl, opacity: saving || loading ? 0.7 : 1 }]}
            >
              <Text style={[fonts.bold, { fontSize: fontSize.body, color: '#fff' }]}>{saved ? 'Saved ✓' : saving ? 'Saving…' : 'Save preferences'}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  value,
  onChange,
  disabled,
  emphasis,
  last,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  emphasis?: boolean;
  last?: boolean;
}) {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomColor: colors.border, borderBottomWidth: borderWidth.thin },
        { opacity: disabled ? 0.45 : 1 },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.md }]}>
        <Icon size={15} color={colors.ink2} strokeWidth={1.8} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[emphasis ? fonts.bold : fonts.semibold, { fontSize: fontSize.body, color: colors.ink }]}>{label}</Text>
        <Text style={[fonts.regular, styles.rowDescription, { color: colors.ink3 }]}>{description}</Text>
      </View>
      <Switch value={value} onValueChange={disabled ? () => {} : onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,16,24,0.5)',
  },
  sheet: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  headerIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  title: {
    fontSize: 19,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
  },
  rows: {
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10.5,
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  rowDescription: {
    fontSize: 11.5,
    marginTop: 2,
  },
  errorText: {
    fontSize: 11.5,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    flex: 1.3,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
