import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import type { FileDownloadEvent, WebViewErrorEvent, WebViewHttpErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { useTheme } from '../../../theme';

/**
 * In-app document preview for Role Thesis "Open" actions (Investor's Investment Thesis Document,
 * Searcher's Search Thesis Document) — replaces handing the URL to `Linking.openURL` (which exits
 * to the device's external browser) with a real in-app viewer, per explicit user direction: "used
 * anylibrary to show that Documnets in mobile app inside instead of the Opend in Device Browser".
 * Uploads are restricted to PDF/DOC/DOCX (`DOC_UPLOAD_TYPES`, `InvestmentApproachSheet.tsx`/
 * `SearchThesisSheet.tsx`).
 *
 * Both file kinds route through Google's public document-viewer endpoint
 * (`docs.google.com/viewer`) rather than loading the raw file URL — an earlier version pointed
 * PDFs straight at the file, on the assumption a `WebView` renders PDFs natively like a full
 * browser does; in practice the bare `WebView` engine (unlike the standalone Chrome/Safari app) has
 * no built-in PDF viewer, so it just handed the file to the OS's native downloader instead of
 * showing it — exactly the "Download" behavior this button must NOT do, since a separate Download
 * button already exists for that (`handleDownloadDoc`, real device save via
 * `react-native-blob-util`). Google's viewer sidesteps this because the `WebView` is loading an
 * HTML preview page, not a raw file stream, so there's nothing for it to hand off to a downloader.
 * `onFileDownload` (Android) is still wired as a last-resort net — if the WebView ever tries to
 * trigger a native download for any reason, this immediately falls back to `Linking.openURL` on the
 * real document instead, per explicit direction: "if this not implemented perfectly... show its
 * direct into browser".
 *
 * `onError`/`onHttpError` are wired rather than trusting the load to always resolve — an
 * unreachable/failing URL previously just sat on the `ActivityIndicator` forever with no signal at
 * all. On failure this shows the real error text plus the same `Linking.openURL` fallback.
 */
export function DocumentPreviewSheet({
  visible,
  url,
  title,
  onClose,
}: {
  visible: boolean;
  url: string;
  title: string;
  onClose: () => void;
}) {
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const source = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  useEffect(() => {
    if (visible) setError(null);
  }, [visible, url]);

  const handleWebViewError = (e: WebViewErrorEvent | WebViewHttpErrorEvent) => {
    setError(e.nativeEvent.description || 'Could not load this document.');
  };

  const handleFileDownload = (_e: FileDownloadEvent) => {
    onClose();
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderSoft }]}>
          <Text style={[fonts.semibold, styles.title, { color: colors.ink }]} numberOfLines={1}>
            {title}
          </Text>
          <Pressable onPress={onClose} accessibilityLabel="Close" style={[styles.closeButton, { backgroundColor: colors.surfaceSunken }]}>
            <X size={16} color={colors.ink2} strokeWidth={1.8} />
          </Pressable>
        </View>

        {error ? (
          <View style={[styles.flex, styles.errorState]}>
            <Text style={[fonts.semibold, styles.errorTitle, { color: colors.ink }]}>Couldn&apos;t load this document</Text>
            <Text style={[fonts.regular, styles.errorBody, { color: colors.ink3 }]}>{error}</Text>
            <Pressable onPress={() => Linking.openURL(url).catch(() => {})} style={[styles.errorButton, { backgroundColor: colors.hero1 }]}>
              <Text style={[fonts.bold, styles.errorButtonText]}>Open in browser instead</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            source={{ uri: source }}
            style={styles.flex}
            startInLoadingState
            renderLoading={() => (
              <View style={[styles.flex, styles.loader]}>
                <ActivityIndicator color={colors.hero1} />
              </View>
            )}
            onError={handleWebViewError}
            onHttpError={handleWebViewError}
            onFileDownload={handleFileDownload}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 15, flex: 1, marginRight: 12 },
  closeButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  loader: { alignItems: 'center', justifyContent: 'center' },
  errorState: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8 },
  errorTitle: { fontSize: 15 },
  errorBody: { fontSize: 12.5, textAlign: 'center', lineHeight: 18 },
  errorButton: { marginTop: 12, height: 44, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  errorButtonText: { fontSize: 13, color: '#fff' },
});
