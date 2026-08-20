import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { Plus, X } from 'lucide-react-native';
import { useTheme } from '../../../theme';
import { BottomSheet } from '../../BottomSheet';
import { fetchMyInterests, getInterestSuggestions, saveInterests } from '../../../api/interests';

const MAX_INTERESTS = 5;

function extractErrorMessage(err: unknown): string {
  return axios.isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error ?? err.message : 'Please try again.';
}

/**
 * Manage Interests — matches web's `ManageInterestsModal` (`my-profile/page.tsx:1213-1900ish`)
 * FUNCTIONALLY: every add/remove is immediately persisted via `saveInterests()`
 * (`interest_labels` payload — the exact same call Dual Profile's wizard already makes), not
 * batched behind the "Done" button. UI follows the MOCKUP's simpler sheet instead of web's own
 * bespoke pill+combobox layout (per the user's "mockup UI, web functionality" instruction) —
 * existing chips as removable pills, an "Add interest" toggle revealing a free-text input, and a
 * "Suggested based on your profile" box of one-tap-add chips.
 */
export function InterestsSheet({
  visible,
  roleType,
  subCategory,
  onClose,
}: {
  visible: boolean;
  roleType: string | null;
  subCategory: string | null;
  onClose: () => void;
}) {
  const { colors, fonts } = useTheme();
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [customText, setCustomText] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setShowCustomInput(false);
    setCustomText('');
    fetchMyInterests()
      .then(setInterests)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [visible]);

  useEffect(() => {
    if (!visible || !roleType) return;
    getInterestSuggestions(roleType, subCategory ?? '')
      .then(setSuggestions)
      .catch(() => {});
  }, [visible, roleType, subCategory]);

  const persist = async (next: string[]) => {
    const prev = interests;
    setInterests(next);
    try {
      await saveInterests(next);
    } catch (err) {
      setInterests(prev);
      Toast.show({ type: 'error', text1: 'Could not save', text2: extractErrorMessage(err) });
    }
  };

  const handleRemove = (label: string) => persist(interests.filter(i => i !== label));

  const handleAddCustom = () => {
    const label = customText.trim();
    if (!label || interests.includes(label) || interests.length >= MAX_INTERESTS) return;
    persist([...interests, label]);
    setCustomText('');
    setShowCustomInput(false);
  };

  const handleAddSuggestion = (label: string) => {
    if (interests.includes(label) || interests.length >= MAX_INTERESTS) return;
    persist([...interests, label]);
  };

  const remainingSuggestions = suggestions.filter(s => !interests.includes(s));
  const atMax = interests.length >= MAX_INTERESTS;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={[fonts.display, styles.title, { color: colors.ink }]}>Interests</Text>
      <Text style={[fonts.regular, styles.helper, { color: colors.ink3 }]}>
        Add up to {MAX_INTERESTS} interests that reflect the deals and topics you focus on. They help us match you with the right people.
      </Text>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.ink3} style={{ marginTop: 14 }} />
        ) : (
          <>
            <View style={styles.chipsRow}>
              {interests.length === 0 && (
                <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>No interests yet. Add up to {MAX_INTERESTS}.</Text>
              )}
              {interests.map(label => (
                <View key={label} style={styles.chip}>
                  <Text style={[fonts.semibold, styles.chipText, { color: colors.ink2 }]}>{label}</Text>
                  <Pressable onPress={() => handleRemove(label)} hitSlop={6} style={styles.chipRemove}>
                    <X size={11} color={colors.ink3} strokeWidth={2} />
                  </Pressable>
                </View>
              ))}
            </View>

            {!atMax &&
              (showCustomInput ? (
                <View style={styles.addRow}>
                  <TextInput
                    value={customText}
                    onChangeText={setCustomText}
                    placeholder="Type an interest"
                    placeholderTextColor={colors.ink3}
                    autoFocus
                    onSubmitEditing={handleAddCustom}
                    style={[styles.addInput, { backgroundColor: colors.surfaceSunken, borderColor: colors.border, color: colors.ink }]}
                  />
                  <Pressable onPress={handleAddCustom} style={[styles.addInlineButton, { backgroundColor: colors.gold }]}>
                    <Text style={[fonts.bold, styles.addInlineButtonText, { color: colors.onGold }]}>Add</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable onPress={() => setShowCustomInput(true)} style={[styles.addToggle, { borderColor: colors.border }]}>
                  <Plus size={13} color={colors.ink2} strokeWidth={1.8} />
                  <Text style={[fonts.semibold, styles.addToggleText, { color: colors.ink2 }]}>Add interest</Text>
                </Pressable>
              ))}

            {remainingSuggestions.length > 0 && (
              <View style={styles.suggestBox}>
                <Text style={[fonts.bold, styles.suggestEyebrow, { color: colors.ink3 }]}>SUGGESTED BASED ON YOUR PROFILE</Text>
                <View style={styles.chipsRow}>
                  {remainingSuggestions.map(label => (
                    <Pressable
                      key={label}
                      onPress={() => handleAddSuggestion(label)}
                      disabled={atMax}
                      style={[styles.suggestChip, { borderColor: colors.border, opacity: atMax ? 0.5 : 1 }]}
                    >
                      <Plus size={11} color={colors.ink2} strokeWidth={1.8} />
                      <Text style={[fonts.regular, styles.suggestChipText, { color: colors.ink2 }]}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Pressable onPress={onClose} style={[styles.doneButton, { backgroundColor: '#182E43' }]}>
        <Text style={[fonts.bold, styles.doneButtonText, { color: '#fff' }]}>Done</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, textAlign: 'center' },
  helper: { fontSize: 12, lineHeight: 17, marginTop: 6, textAlign: 'center' },
  body: { marginTop: 16, maxHeight: 380 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emptyText: { fontSize: 12.5, fontStyle: 'italic' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 8,
    height: 32,
    backgroundColor: '#F8F6F1',
    borderColor: '#DED9CC',
  },
  chipText: { fontSize: 12.5 },
  chipRemove: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  addInput: { flex: 1, height: 42, paddingHorizontal: 12, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, fontSize: 13.5 },
  addInlineButton: { height: 42, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addInlineButtonText: { fontSize: 13 },
  addToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed', marginTop: 12 },
  addToggleText: { fontSize: 12.5 },
  suggestBox: { marginTop: 18, gap: 9 },
  suggestEyebrow: { fontSize: 9.5, letterSpacing: 0.5 },
  suggestChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 11, height: 30 },
  suggestChipText: { fontSize: 12 },
  doneButton: { height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  doneButtonText: { fontSize: 13.5 },
});
