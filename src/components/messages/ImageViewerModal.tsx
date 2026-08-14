import React from 'react';
import { Image, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

/** Full-screen in-app viewer for a chat image message — previously tapping an image message
 * called `Linking.openURL`, which kicked the user out to their device's web browser just to view
 * a photo they already had loaded in the thread. This keeps them in the app instead: black
 * backdrop, image letterboxed to fit the screen, tap anywhere (backdrop or image) or the close
 * button to dismiss. No pinch-zoom — not asked for, and this app has no other image-zoom
 * precedent to match; can be added later if needed. Owned by `MessagesScreen` (one instance
 * shared across every bubble in the thread, not one per message), same convention as
 * `MessageActionsSheet`/`ConfirmDialog` there.
 *
 * Nests its own `SafeAreaProvider` inside the `Modal` rather than trusting the app-root one
 * (`App.tsx`) — `Modal` renders in a separate native window on Android, so insets measured
 * against the main window aren't guaranteed to apply there too. Same root cause/fix as
 * `DirectoryFiltersPanel.tsx`. The insets-consuming content is split into
 * `ImageViewerModalContent` because a component can't read a `Provider` it renders itself later in
 * the same return — `useSafeAreaInsets()` has to be called from *inside* the new nested
 * provider's subtree. */
export function ImageViewerModal({ visible, imageUrl, onClose }: { visible: boolean; imageUrl: string | null; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaProvider>
        <ImageViewerModalContent imageUrl={imageUrl} onClose={onClose} />
      </SafeAreaProvider>
    </Modal>
  );
}

function ImageViewerModalContent({ imageUrl, onClose }: { imageUrl: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width, height: height - insets.top - insets.bottom }} resizeMode="contain" />
        ) : null}
      </Pressable>
      <Pressable
        onPress={onClose}
        accessibilityLabel="Close image"
        style={[styles.closeButton, { top: insets.top + 12 }]}
      >
        <X size={18} color="#fff" strokeWidth={2} />
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
});
