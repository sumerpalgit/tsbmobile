import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { BottomSheet } from '../../BottomSheet';

/**
 * Shared shell for the 5 Role Thesis edit sheets — matches the mockup's per-sheet header/footer
 * chrome exactly (decoded `profilelast_decoded_role.html`, e.g. Seller profile sheet
 * lines 3352-3401): 40×40 icon box + title (`DM Serif Display` 17px) + description + close button,
 * a scrollable body (own `ScrollView`, since `BottomSheet.tsx`'s shell only caps `maxHeight: 88%`
 * and doesn't scroll its own children — most of these sheets have more fields than fit that height
 * on a phone), and a right-aligned Cancel/Save footer. Built on the existing `BottomSheet.tsx`
 * shell (same one `RequestTestimonialSheet.tsx` uses) rather than a new Modal, per this app's own
 * established sheet convention — keyboard avoidance is inherited from that shell's own
 * `marginBottom` shift, same as every other sheet in this app with a handful of text fields.
 */
export function RoleThesisEditSheet({
  visible,
  onClose,
  icon,
  iconBg,
  iconColor,
  title,
  description,
  saving,
  onSave,
  saveDisabled,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  saving: boolean;
  onSave: () => void;
  saveDisabled?: boolean;
  children: React.ReactNode;
}) {
  const { colors, fonts } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} dismissable={!saving}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ color?: string }>, { color: iconColor }) : icon}
        </View>
        <View style={styles.headerText}>
          <Text style={[fonts.display, styles.title, { color: colors.ink }]}>{title}</Text>
          <Text style={[fonts.regular, styles.description, { color: colors.ink3 }]}>{description}</Text>
        </View>
        <Pressable
          onPress={onClose}
          disabled={saving}
          accessibilityLabel="Close"
          style={[styles.closeButton, { backgroundColor: colors.surfaceSunken }]}
        >
          <X size={14} color={colors.ink2} strokeWidth={1.8} />
        </Pressable>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.borderSoft }]}>
        <Pressable
          onPress={onClose}
          disabled={saving}
          style={[styles.cancelButton, { backgroundColor: colors.authField, borderColor: colors.authFieldBorder }]}
        >
          <Text style={[fonts.semibold, styles.footerButtonText, { color: colors.ink2 }]}>Cancel</Text>
        </Pressable>
        <Pressable
          onPress={onSave}
          disabled={saving || saveDisabled}
          style={[styles.saveButton, { backgroundColor: colors.hero1, opacity: saving || saveDisabled ? 0.6 : 1 }]}
        >
          {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={[fonts.bold, styles.footerButtonText, { color: '#fff' }]}>Save changes</Text>}
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 13 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerText: { flex: 1, minWidth: 0 },
  title: { fontSize: 17 },
  description: { fontSize: 11.5, marginTop: 1 },
  closeButton: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body: { maxHeight: 420 },
  bodyContent: { gap: 18, paddingBottom: 6, paddingTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, paddingTop: 13, borderTopWidth: StyleSheet.hairlineWidth },
  cancelButton: { height: 46, paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  saveButton: { height: 46, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  footerButtonText: { fontSize: 13 },
});
