import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../../../theme';

export function SheetHeader({ title, subtitle, onClose }: { title: string; subtitle?: string; onClose: () => void }) {
  const { colors, fonts, fontSize, borderWidth } = useTheme();
  return (
    <View style={[styles.sheetHeader, { borderBottomWidth: borderWidth.thin, borderBottomColor: colors.borderSoft }]}>
      <View style={[styles.sheetHandle, { backgroundColor: colors.obLine2 }]} />
      <View style={styles.sheetHeaderRow}>
        <View>
          <Text style={[fonts.authDisplay, styles.sheetTitle, { color: colors.obInk }]}>{title}</Text>
          {subtitle ? (
            <Text style={[fonts.regular, { color: colors.obInk3, fontSize: fontSize.small, marginTop: 2 }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Pressable onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
          <X size={13} color={colors.obInk2} strokeWidth={1.7} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetHeader: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sheetTitle: {
    fontSize: 17,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
