import React, { useEffect, useState } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

/**
 * Generic bottom-sheet shell — extracted from `ChangeEmailSheet.tsx`/`ChangePasswordSheet.tsx`'s
 * near-identical Modal+backdrop+grabber+keyboard-avoidance chrome (see either file's doc comment
 * for the full root-cause writeup on the `SafeAreaProvider` nesting / keyboard handling this
 * copies verbatim) once a 3rd and 4th consumer (View Profile's Experience/Education/Interests
 * sheets, Phase 2) made duplicating it again clearly worse than sharing it. Callers own their own
 * content/footer entirely — this only owns the shell.
 */
export function BottomSheet({
  visible,
  onClose,
  children,
  dismissable = true,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** False while a submission is in flight, matching the existing sheets' convention of blocking
   * backdrop-tap-to-dismiss mid-save. */
  dismissable?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={dismissable ? onClose : undefined}>
      <SafeAreaProvider>
        <BottomSheetContent onClose={onClose} dismissable={dismissable}>
          {children}
        </BottomSheetContent>
      </SafeAreaProvider>
    </Modal>
  );
}

function BottomSheetContent({
  onClose,
  dismissable,
  children,
}: {
  onClose: () => void;
  dismissable: boolean;
  children: React.ReactNode;
}) {
  const { colors, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => setKeyboardHeight(e.endCoordinates?.height ?? 0));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <Pressable style={styles.backdrop} onPress={dismissable ? onClose : undefined}>
      <Pressable
        onPress={e => e.stopPropagation()}
        style={[
          styles.sheet,
          { paddingBottom: Math.max(insets.bottom, 16), backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl + 6, borderTopRightRadius: radius.xxl + 6 },
          { marginBottom: keyboardHeight },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        {children}
      </Pressable>
    </Pressable>
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
    paddingTop: 10,
    maxHeight: '88%',
  },
  grabber: {
    width: 38,
    height: 4,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 14,
  },
});
