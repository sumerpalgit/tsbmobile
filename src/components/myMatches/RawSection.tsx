import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { fontSize, fonts, radius, spacing, useTheme } from '../../theme';

/**
 * One endpoint's worth of raw output: the method + path it came from, how many items came back,
 * and one of three honest outcomes — loading, the real error, or the rows.
 *
 * Errors are **shown**, not swallowed. Every other list screen in this app (`NotificationsScreen`,
 * `useDirectory`) deliberately lets a failed fetch fall through to an empty state, matching web.
 * That is wrong here: the entire purpose of this screen is to find out whether these endpoints
 * work at all from mobile, so an empty list and a 404 must be distinguishable at a glance.
 */

const MONO = Platform.select({ ios: 'Menlo', default: 'monospace' });

export type RawSectionProps = {
  /** The endpoint, written as it is actually called, e.g. `GET /matchmaking/suggested`. */
  endpoint: string;
  /** What this data is, in the feature's own vocabulary. */
  title: string;
  /** Extra context worth carrying — e.g. what web filters out that this does not. */
  note?: string;
  count?: number;
  isLoading: boolean;
  error: unknown;
  children?: React.ReactNode;
};

/** Axios errors carry the useful part (status, backend message) well below `.message`. */
function describeError(error: unknown): string {
  const err = error as
    | { response?: { status?: number; data?: { error?: string; message?: string } }; message?: string }
    | undefined;
  const status = err?.response?.status;
  const body = err?.response?.data?.error ?? err?.response?.data?.message;
  const parts = [
    status ? `HTTP ${status}` : null,
    body ?? err?.message ?? 'Request failed',
  ].filter(Boolean);
  return parts.join(' — ');
}

export function RawSection({
  endpoint,
  title,
  note,
  count,
  isLoading,
  error,
  children,
}: RawSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      <Text style={[styles.endpoint, { color: colors.gold }]}>{endpoint}</Text>

      {isLoading ? (
        <View style={styles.state}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={[styles.stateText, { color: colors.ink3 }]}>Loading…</Text>
        </View>
      ) : error ? (
        <View
          style={[
            styles.errorBox,
            { backgroundColor: colors.dangerSurface, borderColor: colors.danger },
          ]}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>Request failed</Text>
          <Text selectable style={[styles.errorBody, { color: colors.danger }]}>
            {describeError(error)}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.count, { color: colors.ink2 }]}>
            {count === 0 ? '0 items — the call succeeded, there is no data' : `${count} item${count === 1 ? '' : 's'}`}
          </Text>
          {note ? <Text style={[styles.note, { color: colors.ink3 }]}>{note}</Text> : null}
          {children}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    ...fonts.semibold,
    fontSize: fontSize.subtitle,
  },
  endpoint: {
    fontFamily: MONO,
    fontSize: fontSize.caption,
    marginTop: 2,
  },
  count: {
    ...fonts.medium,
    fontSize: fontSize.small,
    marginTop: spacing.sm,
  },
  note: {
    fontSize: fontSize.caption,
    ...fonts.regular,
    marginTop: 2,
    lineHeight: 15,
  },
  state: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  stateText: {
    ...fonts.regular,
    fontSize: fontSize.small,
  },
  errorBox: {
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  errorTitle: {
    ...fonts.semibold,
    fontSize: fontSize.small,
  },
  errorBody: {
    fontFamily: MONO,
    fontSize: fontSize.caption,
    marginTop: 2,
    lineHeight: 15,
  },
});
