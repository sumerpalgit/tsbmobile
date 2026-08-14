import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import LinearGradient from 'react-native-linear-gradient';
import { CheckCircle2, ChevronRight, Crown, Download, Receipt, XCircle, Zap } from 'lucide-react-native';
import { WEB_BASE_URL } from '@env';
import { useTheme } from '../theme';
import { fetchPaymentHistory, fetchSubscription } from '../api/settings';
import { formatShortDate } from '../types/adManagement';
import { PLAN_FEATURES, PaymentRecord, Subscription } from '../types/settings';
import { AdScreenHeader } from '../components/adManagement/AdScreenHeader';
import type { AppStackParamList } from '../navigation/types';

const GRADIENT_START = { x: 0.15, y: 0.15 };
const GRADIENT_END = { x: 0.85, y: 0.85 };

function openLink(url: string) {
  Linking.openURL(url).catch(() => Toast.show({ type: 'error', text1: 'Could not open link' }));
}

/**
 * Settings' "Billing & Subscription" section — matches real web (`webSrc/app/dashboard/
 * settings/page.tsx`'s `activeTab === "billing"`) and the mobile mockup exactly: a "Current
 * plan" card (gradient plan badge + hardcoded `PLAN_FEATURES` checklist + "Upgrade" row) and a
 * "Payment history" card. All data/types (`fetchSubscription`, `fetchPaymentHistory`,
 * `PLAN_FEATURES`) already existed from Phase 1 — this just wires the screen.
 *
 * "Upgrade or change plan" and each payment's "Invoice" link both open real web pages
 * (`/payment`, `invoice_url`) via `Linking.openURL` — same external-link pattern as everywhere
 * else in this app (no in-app payment flow or invoice viewer, matching web's own scope, which
 * also just navigates/links out for both).
 */
function SettingsBillingScreen() {
  const { colors, fonts, fontSize, radius, borderWidth } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchSubscription(), fetchPaymentHistory()])
      .then(([sub, pays]) => {
        setSubscription(sub);
        setPayments(pays);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const planName = subscription?.planName || 'Free';
  const features = PLAN_FEATURES[planName] ?? PLAN_FEATURES.Free;
  const isActive = subscription?.status === 'active';

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.pageBg }}>
      <AdScreenHeader title="Billing & Subscription" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>SUBSCRIPTION</Text>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Current plan</Text>
            <Text style={[fonts.regular, styles.cardDescription, { color: colors.ink3 }]}>Your active membership and what's included.</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.gold} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <LinearGradient
                colors={[colors.chip, colors.surface2]}
                start={GRADIENT_START}
                end={GRADIENT_END}
                style={[styles.planBadge, { borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}
              >
                <View style={styles.planBadgeHeader}>
                  <Crown size={17} color={colors.goldDark} strokeWidth={1.6} />
                  <Text style={[fonts.bold, styles.planName, { color: colors.ink }]}>{planName}</Text>
                  <View style={[styles.statusPill, { backgroundColor: isActive ? colors.successSurface : colors.dangerSurface, borderRadius: radius.sm }]}>
                    <Text style={[fonts.bold, styles.statusPillText, { color: isActive ? colors.success : colors.danger }]}>
                      {isActive ? 'Active' : subscription?.status || 'Free'}
                    </Text>
                  </View>
                </View>
                {features.map(f => (
                  <View key={f} style={styles.featureRow}>
                    <CheckCircle2 size={12} color={colors.goldDark} strokeWidth={1.6} />
                    <Text style={[fonts.regular, styles.featureText, { color: colors.ink2 }]}>{f}</Text>
                  </View>
                ))}
              </LinearGradient>

              <View style={styles.upgradeButtonWrap}>
                <Pressable
                  onPress={() => openLink(`${WEB_BASE_URL}/payment`)}
                  style={({ pressed }) => [
                    styles.upgradeButton,
                    { borderColor: colors.homeCardBorder, backgroundColor: colors.surfaceSunken, borderRadius: radius.lg, borderWidth: borderWidth.thin },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.iconWell, { borderRadius: radius.lg, backgroundColor: colors.chip }]}>
                    <Zap size={15} color={colors.goldDark} strokeWidth={1.7} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>Upgrade or change plan</Text>
                    <Text style={[fonts.regular, styles.rowDescription, { color: colors.ink3 }]}>Explore available subscription options.</Text>
                  </View>
                  <ChevronRight size={15} color={colors.ink3} strokeWidth={1.8} />
                </Pressable>
              </View>
            </>
          )}
        </View>

        <View style={[styles.card, { borderRadius: radius.xl, borderColor: colors.homeCardBorder, borderWidth: borderWidth.thin, backgroundColor: colors.surface }]}>
          <View style={[styles.cardHeader, { borderBottomColor: colors.borderSoft, borderBottomWidth: borderWidth.thin }]}>
            <Text style={[fonts.bold, styles.eyebrow, { color: colors.goldDark }]}>TRANSACTIONS</Text>
            <Text style={[fonts.display, styles.cardTitle, { color: colors.ink }]}>Payment history</Text>
            <Text style={[fonts.regular, styles.cardDescription, { color: colors.ink3 }]}>A record of all your past payments.</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.gold} style={{ marginVertical: 20 }} />
          ) : payments.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWell, { backgroundColor: colors.surfaceSunken, borderColor: colors.borderSoft, borderWidth: borderWidth.thin }]}>
                <Receipt size={18} color={colors.ink3} strokeWidth={1.6} />
              </View>
              <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>No payments yet</Text>
              <Text style={[fonts.regular, styles.emptyText, { color: colors.ink3 }]}>Your transaction history will appear here.</Text>
            </View>
          ) : (
            <View style={styles.paymentsList}>
              {payments.map(tx => {
                const succeeded = tx.status === 'succeeded';
                return (
                  <View key={tx.id} style={[styles.paymentRow, { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.lg }]}>
                    <View
                      style={[
                        styles.paymentStatusIcon,
                        { backgroundColor: succeeded ? colors.successSurface : colors.dangerSurface, borderRadius: radius.md },
                      ]}
                    >
                      {succeeded ? (
                        <CheckCircle2 size={15} color={colors.success} strokeWidth={1.6} />
                      ) : (
                        <XCircle size={15} color={colors.danger} strokeWidth={1.6} />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]} numberOfLines={1}>
                        {tx.planName}
                      </Text>
                      <Text style={[fonts.regular, styles.paymentDate, { color: colors.ink3 }]}>{formatShortDate(tx.paidAt)}</Text>
                    </View>
                    <View style={styles.paymentAmountCol}>
                      <Text style={[fonts.bold, { fontSize: fontSize.ui, color: colors.ink }]}>
                        {tx.currency} {tx.amount.toFixed(2)}
                      </Text>
                      <Text style={[fonts.semibold, styles.paymentStatusText, { color: succeeded ? colors.success : colors.danger }]}>{tx.status}</Text>
                    </View>
                    {!!tx.invoiceUrl && (
                      <Pressable
                        onPress={() => openLink(tx.invoiceUrl!)}
                        style={({ pressed }) => [
                          styles.invoiceButton,
                          { borderColor: colors.border, borderWidth: borderWidth.thin, borderRadius: radius.md },
                          pressed && styles.pressed,
                        ]}
                      >
                        <Download size={11} color={colors.ink2} strokeWidth={1.8} />
                        <Text style={[fonts.semibold, styles.invoiceButtonText, { color: colors.ink2 }]}>Invoice</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 15,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 9.5,
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 17,
    marginTop: 4,
  },
  cardDescription: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
  planBadge: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 13,
  },
  planBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planName: {
    flex: 1,
    fontSize: 17,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 9.5,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  featureText: {
    fontSize: 13,
  },
  upgradeButtonWrap: {
    padding: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
  },
  iconWell: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowDescription: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  emptyState: {
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 28,
  },
  emptyIconWell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  emptyText: {
    fontSize: 12,
  },
  paymentsList: {
    padding: 16,
    gap: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
  },
  paymentStatusIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  paymentDate: {
    fontSize: 11.5,
    marginTop: 2,
  },
  paymentAmountCol: {
    alignItems: 'flex-end',
  },
  paymentStatusText: {
    fontSize: 10.5,
    textTransform: 'capitalize',
    marginTop: 2,
  },
  invoiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  invoiceButtonText: {
    fontSize: 11,
  },
  pressed: {
    opacity: 0.75,
  },
});

export default SettingsBillingScreen;
