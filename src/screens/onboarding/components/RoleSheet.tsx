import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '../../../theme';
import { ROLES } from '../constants';
import { RoleCard } from './RoleCard';
import { SheetHeader } from './SheetHeader';

/** Bottom-sheet role picker — the design's "Category" modal, 8 role cards with description + checkmark. */
export function RoleSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const { colors, elevation } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surface, ...elevation('lg') }]}>
        <SheetHeader title="Select category" subtitle="What best describes you on TSB?" onClose={onClose} />
        <ScrollView contentContainerStyle={styles.sheetContent}>
          {ROLES.map(r => (
            <RoleCard key={r.name} role={r} selected={r.name === selected} onPress={() => onSelect(r.name)} />
          ))}
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
});
