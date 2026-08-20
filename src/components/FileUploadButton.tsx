import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { pick, types, isErrorWithCode, errorCodes, keepLocalCopy } from '@react-native-documents/picker';
import type { PredefinedFileTypes } from '@react-native-documents/picker';
import { Check, Upload } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useTheme } from '../theme';

export type PickedFile = {
  uri: string;
  name: string;
  size: number | null;
  mimeType: string | null;
};

/**
 * Tap-to-upload button — opens the OS document/photo picker, shows the picked file's name once
 * attached, tap again to remove. Built generic (not onboarding-specific) since the first use —
 * Step 4's CIM upload — is one of several places this app will need "attach a document or image"
 * (resumes, credentials, pitch decks, etc. per the web app's per-role upload fields), so this
 * lives in `src/components` for any screen to reuse, same reasoning as `PrimaryButton`/`FormField`.
 *
 * Deliberately doesn't render its own label — matching `FieldDropdown` and every other field in
 * this app, the caller renders its own label `Text` above it (see `Step4Fields`'s CIM field for
 * the pattern), this is just the control.
 *
 * `acceptedTypes` defaults to PDF + images (documents and photos are the two file kinds every
 * upload field in this app's design needs); pass a narrower/wider set per use case, e.g.
 * `[types.pdf, types.docx]` for a resume field, or `[types.images]` for a profile photo.
 *
 * Single-file only for now (`allowMultiSelection` isn't exposed) — every upload field in the
 * design (CIM, pitch deck, resume, etc.) is one file at a time; add it if a future use case needs
 * multiple.
 *
 * `variant="dropzone"` (2026-08-20, added for View Profile's Current Organization credentials
 * deck) matches web's `CurrentOrganizationCard` field exactly — not just a color swap: web's
 * dropzone has no remove affordance at all, only replace (clicking a filled dropzone always
 * re-opens the file picker), unlike the default `'compact'` variant's tap-to-clear. Every existing
 * call site is unaffected since `variant` defaults to `'compact'`.
 */
export function FileUploadButton({
  value,
  onChange,
  acceptedTypes = [types.pdf, types.images],
  placeholder = 'Tap to upload',
  loading = false,
  maxSizeBytes,
  variant = 'compact',
  uploadedCaption,
}: {
  value: PickedFile | null;
  onChange: (file: PickedFile | null) => void;
  acceptedTypes?: PredefinedFileTypes[];
  placeholder?: string;
  /** True while the picked file is mid-upload to the backend (a separate network step after
   * picking, see `uploadDocument` in `src/api/profile.ts`) — distinct from `busy`, which only
   * covers the OS picker itself. */
  loading?: boolean;
  /** Rejects a picked file over this size with a toast instead of calling `onChange` — the
   * server enforces its own real limit regardless (e.g. `/upload/document`'s 10MB cap), this is
   * purely for immediate feedback instead of waiting on a round-trip 4xx. Omit for no client-side
   * limit. */
  maxSizeBytes?: number;
  /** `'compact'` (default) is the original single-row control every existing call site uses —
   * tapping a filled value clears it. `'dropzone'` matches web's `CurrentOrganizationCard`
   * credentials-deck field exactly: a taller vertical box, a green success state instead of gold,
   * and — the actual functional difference, not just color — tapping a filled value re-opens the
   * picker to REPLACE it, since web's dropzone has no remove affordance at all, only replace. */
  variant?: 'compact' | 'dropzone';
  /** Second line shown under the filename in `'dropzone'` success state (web's "Click to
   * replace"). Ignored in `'compact'` variant. */
  uploadedCaption?: string;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const [busy, setBusy] = useState(false);
  const isDropzone = variant === 'dropzone';

  const handlePress = async () => {
    if (value && !isDropzone) {
      onChange(null);
      return;
    }
    if (busy || loading) return;
    setBusy(true);
    try {
      const [picked] = await pick({ type: acceptedTypes });
      if (maxSizeBytes != null && picked.size != null && picked.size > maxSizeBytes) {
        Toast.show({ type: 'error', text1: 'File too large', text2: `Max size is ${Math.round(maxSizeBytes / (1024 * 1024))}MB.` });
        return;
      }
      // Some content providers (Google Photos, cloud-backed docs, etc.) hand back a `content://`
      // uri that RN's `fetch` can't reliably read straight through — it throws "Network request
      // failed" with no HTTP response at all, since the read never leaves the device. Copying to
      // a real local `file://` path first (the library's own documented workaround) makes the
      // later `fetch(uri).blob()` upload step reliable regardless of where the file came from.
      let uploadUri = picked.uri;
      try {
        const [copy] = await keepLocalCopy({
          files: [{ uri: picked.uri, fileName: picked.name ?? 'file' }],
          destination: 'cachesDirectory',
        });
        if (copy?.status === 'success') uploadUri = copy.localUri;
      } catch {
        // fall back to the original picked uri — fetch can often read it directly anyway
      }
      onChange({ uri: uploadUri, name: picked.name ?? 'file', size: picked.size, mimeType: picked.type });
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      Toast.show({ type: 'error', text1: 'Could not attach file', text2: 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  if (isDropzone) {
    const success = !!value && !loading;
    return (
      <Pressable
        onPress={handlePress}
        disabled={busy || loading}
        style={({ pressed }) => [
          styles.dropzone,
          success
            ? { backgroundColor: '#F0FDF4', borderColor: '#16A34A' }
            : { backgroundColor: colors.surfaceSunken, borderColor: colors.border },
          (busy || loading) && { opacity: 0.8 },
          !busy && !loading && pressed && { opacity: 0.7 },
        ]}
      >
        {loading ? (
          <>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text style={[fonts.medium, styles.dropzoneLine, { color: colors.ink2, fontSize: fontSize.body }]}>Uploading…</Text>
          </>
        ) : success ? (
          <>
            <Check size={26} color="#16A34A" strokeWidth={1.8} />
            <Text style={[fonts.semibold, styles.dropzoneLine, { color: '#16A34A', fontSize: fontSize.body }]} numberOfLines={1}>
              {value!.name}
            </Text>
            {!!uploadedCaption && (
              <Text style={[fonts.regular, styles.dropzoneCaption, { color: colors.ink3 }]}>{uploadedCaption}</Text>
            )}
          </>
        ) : (
          <>
            <Upload size={26} color={colors.ink3} strokeWidth={1.6} />
            <Text style={[fonts.medium, styles.dropzoneLine, { color: colors.ink2, fontSize: fontSize.body }]}>Click to upload or drag and drop</Text>
            {!!placeholder && <Text style={[fonts.regular, styles.dropzoneCaption, { color: colors.ink3 }]}>{placeholder}</Text>}
          </>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={busy || loading}
      style={({ pressed }) => [
        styles.button,
        value
          ? { backgroundColor: colors.goldExtraLight, borderColor: colors.gold, borderStyle: 'solid' }
          : { backgroundColor: colors.surfaceSunken, borderColor: colors.border, borderStyle: 'dashed' },
        (busy || loading) && { opacity: 0.6 },
        !busy && !loading && pressed && { opacity: 0.65 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.gold} />
      ) : value ? (
        <Check size={15} color={colors.gold} strokeWidth={2} />
      ) : (
        <Upload size={15} color={colors.ink3} strokeWidth={1.8} />
      )}
      <Text
        style={[fonts.semibold, styles.text, { color: value ? colors.gold : colors.ink3, fontSize: fontSize.body }]}
        numberOfLines={1}
      >
        {loading ? 'Uploading…' : value ? `${value.name} — tap to remove` : placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
  },
  dropzone: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  dropzoneLine: {
    textAlign: 'center',
  },
  dropzoneCaption: {
    fontSize: 11.5,
    textAlign: 'center',
  },
  text: {
    flexShrink: 1,
  },
});
