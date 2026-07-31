import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../../theme';

/** Plain-text trigger button for Sub Category / City — same shape as the design's native `<select>`s. */
export function SelectTrigger({
  value,
  placeholder,
  onPress,
}: {
  value?: string;
  placeholder: string;
  onPress: () => void;
}) {
  const { colors, fonts, fontSize } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.selectField, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}
    >
      <Text style={[fonts.regular, { color: value ? colors.obInk : colors.obInk3, fontSize: fontSize.ui, flex: 1 }]}>
        {value || placeholder}
      </Text>
      <ChevronDown size={14} color={colors.obInk3} strokeWidth={1.6} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    paddingHorizontal: 13,
    borderRadius: 13,
    borderWidth: 1,
  },
});
