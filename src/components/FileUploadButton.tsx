import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { pick, types, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
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
 */
export function FileUploadButton({
  value,
  onChange,
  acceptedTypes = [types.pdf, types.images],
  placeholder = 'Tap to upload',
  loading = false,
}: {
  value: PickedFile | null;
  onChange: (file: PickedFile | null) => void;
  acceptedTypes?: PredefinedFileTypes[];
  placeholder?: string;
  /** True while the picked file is mid-upload to the backend (a separate network step after
   * picking, see `uploadDocument` in `src/api/profile.ts`) — distinct from `busy`, which only
   * covers the OS picker itself. */
  loading?: boolean;
}) {
  const { colors, fonts, fontSize } = useTheme();
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    if (value) {
      onChange(null);
      return;
    }
    if (busy || loading) return;
    setBusy(true);
    try {
      const [picked] = await pick({ type: acceptedTypes });
      onChange({ uri: picked.uri, name: picked.name ?? 'file', size: picked.size, mimeType: picked.type });
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return;
      Toast.show({ type: 'error', text1: 'Could not attach file', text2: 'Please try again.' });
    } finally {
      setBusy(false);
    }
  };

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
  text: {
    flexShrink: 1,
  },
});
