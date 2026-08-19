import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme';
import { DualProfileDraft } from './types';

const PLANS: { key: DualProfileDraft['billingCycle']; label: string; price: string; sub: string; badge?: string }[] = [
  { key: 'monthly', label: 'Monthly', price: '$49/mo', sub: 'Full access, cancel anytime' },
  { key: 'annual', label: 'Annual', price: '$34/mo', sub: 'Billed as $408/yr', badge: 'Save 30%' },
];

const PAY_METHODS: { key: 'card' | 'ach' | 'invoice'; label: string }[] = [
  { key: 'card', label: 'Card' },
  { key: 'ach', label: 'ACH' },
  { key: 'invoice', label: 'Invoice' },
];

/** Payment — entirely cosmetic, matching real web exactly (`create-dual-profile/page.tsx`'s
 * Payment step: same $49/mo · $34/mo·"Save 30%"·$408/yr numbers, same order-summary rows, same
 * card fields with zero validation and no real gateway call anywhere in the flow). Continue here
 * goes straight to the real `createDualProfile` submit, not a payment gate — see the wizard's own
 * `handleSubmit`. */
export function StepPayment({
  billingCycle,
  onBillingCycleChange,
  payMethod,
  onPayMethodChange,
  cardNumber,
  onCardNumberChange,
  cardExpiry,
  onCardExpiryChange,
  cardCvc,
  onCardCvcChange,
  onFieldFocus,
}: {
  billingCycle: DualProfileDraft['billingCycle'];
  onBillingCycleChange: (value: DualProfileDraft['billingCycle']) => void;
  payMethod: 'card' | 'ach' | 'invoice';
  onPayMethodChange: (value: 'card' | 'ach' | 'invoice') => void;
  cardNumber: string;
  onCardNumberChange: (value: string) => void;
  cardExpiry: string;
  onCardExpiryChange: (value: string) => void;
  cardCvc: string;
  onCardCvcChange: (value: string) => void;
  /** Scrolls the content clear of the keyboard when any card field is focused — see
   * `CreateDualProfileWizard.tsx`'s `handleCardFieldFocus` doc comment. Card number/Expiry/CVC
   * are the last fields on this step, so they're exactly the ones the keyboard would otherwise
   * hide once focused. */
  onFieldFocus?: () => void;
}) {
  const { colors, fonts } = useTheme();
  const isAnnual = billingCycle === 'annual';
  const total = isAnnual ? '$378' : '$49';
  const orderRows = isAnnual
    ? [
        { k: 'Annual dual profile', v: '$408/yr' },
        { k: 'Dual-profile discount', v: '−$30', gold: true },
        { k: 'Setup fee', v: '$0' },
      ]
    : [
        { k: 'Monthly dual profile', v: '$49/mo' },
        { k: 'Dual-profile discount', v: '−$0', gold: true },
        { k: 'Setup fee', v: '$0' },
      ];

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 4 }}>
        <Text style={[fonts.display, styles.headline, { color: colors.obInk }]}>Activate your second profile</Text>
        <Text style={[fonts.regular, styles.body, { color: colors.obInk3 }]}>
          Your dual profile includes full access to all features under the new role.
        </Text>
      </View>

      <View style={styles.planGrid}>
        {PLANS.map(plan => {
          const selected = plan.key === billingCycle;
          return (
            <Pressable
              key={plan.key}
              onPress={() => onBillingCycleChange(plan.key)}
              style={[
                styles.planCard,
                selected ? { borderColor: '#182E43', backgroundColor: '#182E43' } : { borderColor: colors.obLine2, backgroundColor: colors.obSurface2 },
              ]}
            >
              {!!plan.badge && (
                <View style={[styles.badge, { backgroundColor: colors.obGold }]}>
                  <Text style={[fonts.bold, styles.badgeText, { color: colors.onAccent }]}>{plan.badge}</Text>
                </View>
              )}
              <Text style={[fonts.bold, styles.planLabel, { color: selected ? 'rgba(255,255,255,0.75)' : colors.obInk3 }]}>{plan.label}</Text>
              <Text style={[fonts.display, styles.planPrice, { color: selected ? colors.onAccent : colors.obInk }]}>{plan.price}</Text>
              <Text style={[fonts.regular, styles.planSub, { color: selected ? 'rgba(255,255,255,0.65)' : colors.obInk3 }]}>{plan.sub}</Text>
            </Pressable>
          );
        })}
      </View>

      <LinearGradient colors={[colors.hero1, colors.hero2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summaryCard}>
        <Text style={[fonts.bold, styles.summaryEyebrow, { color: colors.obGoldLight }]}>ORDER SUMMARY</Text>
        <View style={{ gap: 7, marginTop: 10 }}>
          {orderRows.map(row => (
            <View key={row.k} style={styles.summaryRow}>
              <Text style={[fonts.regular, styles.summaryText, { color: row.gold ? colors.obGoldLight : 'rgba(255,255,255,0.8)' }]}>{row.k}</Text>
              <Text style={[fonts.bold, styles.summaryText, { color: row.gold ? colors.obGoldLight : '#fff' }]}>{row.v}</Text>
            </View>
          ))}
        </View>
        <View style={styles.summaryTotalRow}>
          <Text style={[fonts.bold, styles.summaryTotalLabel, { color: colors.obGoldLight }]}>TOTAL TODAY</Text>
          <Text style={[fonts.display, styles.summaryTotal, { color: '#fff' }]}>{total}</Text>
        </View>
      </LinearGradient>

      <View style={{ gap: 7 }}>
        <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>Payment method</Text>
        <View style={[styles.methodTrack, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2 }]}>
          {PAY_METHODS.map(method => {
            const active = method.key === payMethod;
            return (
              <Pressable
                key={method.key}
                onPress={() => onPayMethodChange(method.key)}
                style={[styles.methodTab, active && { backgroundColor: colors.obInk }]}
              >
                <Text style={[fonts.semibold, styles.methodLabel, { color: active ? colors.obSurface2 : colors.obInk3 }]}>{method.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {payMethod === 'card' ? (
        <>
          <View style={{ gap: 6 }}>
            <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>
              Card number <Text style={{ color: colors.obRequired }}>*</Text>
            </Text>
            <TextInput
              value={cardNumber}
              onChangeText={onCardNumberChange}
              onFocus={() => onFieldFocus?.()}
              placeholder="1234 1234 1234 1234"
              placeholderTextColor={colors.obInk3}
              keyboardType="numeric"
              style={[styles.plainInput, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk }]}
            />
          </View>
          <View style={styles.cardRow}>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>
                Expiry <Text style={{ color: colors.obRequired }}>*</Text>
              </Text>
              <TextInput
                value={cardExpiry}
                onChangeText={onCardExpiryChange}
                onFocus={() => onFieldFocus?.()}
                placeholder="MM / YY"
                placeholderTextColor={colors.obInk3}
                style={[styles.plainInput, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk }]}
              />
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              <Text style={[fonts.semibold, styles.fieldLabel, { color: colors.obInk2 }]}>
                CVC <Text style={{ color: colors.obRequired }}>*</Text>
              </Text>
              <TextInput
                value={cardCvc}
                onChangeText={onCardCvcChange}
                onFocus={() => onFieldFocus?.()}
                placeholder="123"
                placeholderTextColor={colors.obInk3}
                keyboardType="numeric"
                style={[styles.plainInput, { backgroundColor: colors.obSurface2, borderColor: colors.obLine2, color: colors.obInk }]}
              />
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.noteBox, { backgroundColor: colors.obChip, borderLeftColor: colors.obGold }]}>
          <Text style={[fonts.regular, styles.noteText, { color: colors.obGoldDark }]}>
            {payMethod === 'ach'
              ? 'Bank transfer details are emailed after you confirm. Your second profile activates once the transfer clears (1–2 business days).'
              : 'We will email an invoice to your billing contact. The second profile activates on payment.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: 19, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontSize: 12.5, lineHeight: 18 },
  planGrid: { flexDirection: 'row', gap: 9 },
  planCard: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 15, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1 },
  badge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 8, letterSpacing: 0.4, textTransform: 'uppercase' },
  planLabel: { fontSize: 11 },
  planPrice: { fontSize: 22, lineHeight: 26 },
  planSub: { fontSize: 10, lineHeight: 14, textAlign: 'center' },
  summaryCard: { borderRadius: 15, padding: 14 },
  summaryEyebrow: { fontSize: 9.5, letterSpacing: 0.7 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryText: { fontSize: 12 },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 11,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  summaryTotalLabel: { fontSize: 10, letterSpacing: 0.7 },
  summaryTotal: { fontSize: 24 },
  fieldLabel: { fontSize: 11 },
  methodTrack: { flexDirection: 'row', gap: 4, borderRadius: 999, borderWidth: 1, padding: 4 },
  methodTab: { flex: 1, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  methodLabel: { fontSize: 11.5 },
  plainInput: { height: 46, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, fontSize: 13.5 },
  cardRow: { flexDirection: 'row', gap: 9 },
  noteBox: { padding: 13, borderRadius: 11, borderLeftWidth: 3 },
  noteText: { fontSize: 11.5, lineHeight: 17 },
});
