import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { SheetHeader } from './SheetHeader';

/** Generic bottom-sheet single-select — used for Sub Category and City. */
export function SelectSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { value: string; label: string }[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const { colors, fonts, fontSize, elevation } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, ...elevation('lg') }]}>
        <SheetHeader title={title} onClose={onClose} />
        <ScrollView contentContainerStyle={styles.sheetContent}>
          {options.map(opt => {
            const on = opt.value === selected;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onSelect(opt.value)}
                style={[
                  styles.optionRow,
                  { backgroundColor: on ? colors.obChip : 'transparent', borderColor: colors.borderSoft },
                ]}
              >
                <Text style={[fonts.medium, { color: colors.obInk, fontSize: fontSize.ui, flex: 1 }]}>{opt.label}</Text>
                {on && <Check size={16} color={colors.obGold} strokeWidth={2} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(23,23,23,0.42)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '84%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    padding: 16,
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
