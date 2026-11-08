import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPlans, MOCK_MODE, purchase, restore, type Plan } from '../services/purchases';
import { useAppStore } from '../state/store';
import { colors, radius, space, type } from '../theme';

const BENEFITS = [
  { icon: 'sparkles-outline', text: 'Every premium pose: weddings, festivals, trips' },
  { icon: 'water-outline', text: 'Option to remove the Posee watermark' },
  { icon: 'people-outline', text: 'Couple, family and squad pose packs' },
  { icon: 'lock-closed-outline', text: 'Still 100% private. Photos never leave your phone.' },
] as const;

const HEADLINES: Record<string, string> = {
  'premium-pose': 'This pose is part of Posee Pro',
  trial: 'Loving your shots? Try Pro free for 7 days',
  default: 'Unlock every pose',
};

// TODO: replace with your hosted terms and privacy policy URLs (required by both stores).
const TERMS_URL = 'https://posee.app/terms';
const PRIVACY_URL = 'https://posee.app/privacy';

export default function Paywall() {
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const setEntitlement = useAppStore((s) => s.setEntitlement);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<Plan['id']>('monthly');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchPlans().then(setPlans);
  }, []);

  const plan = plans?.find((p) => p.id === selected);

  const onBuy = async () => {
    if (!plan || busy) return;
    setBusy(true);
    const result = await purchase(plan);
    setBusy(false);
    if (result.status === 'success') {
      setEntitlement(result.entitlement);
      router.back();
    } else if (result.status === 'error') {
      Alert.alert('Purchase not completed', result.message);
    }
    // 'cancelled': the user backed out of the store sheet. Stay quiet.
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const e = await restore();
      if (e && e.tier !== 'free') {
        setEntitlement(e);
        Alert.alert('Restored', 'Your Pro access is back.');
        router.back();
      } else {
        Alert.alert('Nothing to restore', 'We could not find an active purchase on this store account.');
      }
    } catch {
      Alert.alert('Restore failed', 'Please check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const manageSubs = () =>
    Linking.openURL(
      Platform.OS === 'ios' ? 'https://apps.apple.com/account/subscriptions' : 'https://play.google.com/store/account/subscriptions',
    );

  const cta = plan?.id === 'monthly' && plan.hasFreeTrial ? 'Start 7-day free trial' : plan?.id === 'weekend' ? `Get Weekend Pass · ${plan.priceString}` : 'Continue';

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close} accessibilityLabel="Close">
        <Ionicons name="close" size={26} color={colors.text} />
      </Pressable>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.kicker}>POSEE PRO</Text>
        <Text style={[type.title, { textAlign: 'center' }]}>{HEADLINES[reason ?? 'default'] ?? HEADLINES.default}</Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={styles.benefit}>
              <Ionicons name={b.icon} size={20} color={colors.accent} />
              <Text style={type.body}>{b.text}</Text>
            </View>
          ))}
        </View>

        {!plans ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: space.xxl }} />
        ) : (
          plans.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => setSelected(p.id)}
              style={[styles.plan, selected === p.id && styles.planSelected]}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected === p.id }}
            >
              <Ionicons
                name={selected === p.id ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={selected === p.id ? colors.accent : colors.textMuted}
              />
              <View style={{ flex: 1 }}>
                <View style={styles.planHead}>
                  <Text style={type.h2}>{p.title}</Text>
                  {p.hasFreeTrial && (
                    <View style={styles.trialPill}>
                      <Text style={styles.trialPillText}>7 DAYS FREE</Text>
                    </View>
                  )}
                </View>
                <Text style={type.caption}>{p.subtitle}</Text>
              </View>
              <Text style={styles.price}>{p.priceString}</Text>
            </Pressable>
          ))
        )}

        <Pressable style={[styles.cta, (busy || !plan) && { opacity: 0.6 }]} onPress={onBuy} disabled={busy || !plan}>
          {busy ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.ctaText}>{cta}</Text>}
        </Pressable>

        {/* Required disclosures: clear renewal terms and cancellation path */}
        <Text style={styles.legal}>
          {plan?.id === 'monthly'
            ? `Free for 7 days, then ${plan.priceString} until you cancel. Payment goes through your ${Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account. The subscription renews automatically unless you cancel at least 24 hours before the period ends. Cancel anytime in your store account settings.`
            : 'One-time purchase. It unlocks Pro for 72 hours and does not renew.'}
        </Text>

        <View style={styles.links}>
          <Pressable onPress={onRestore} disabled={busy}>
            <Text style={styles.link}>Restore purchases</Text>
          </Pressable>
          <Pressable onPress={manageSubs}>
            <Text style={styles.link}>Manage</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(TERMS_URL)}>
            <Text style={styles.link}>Terms</Text>
          </Pressable>
          <Pressable onPress={() => Linking.openURL(PRIVACY_URL)}>
            <Text style={styles.link}>Privacy</Text>
          </Pressable>
        </View>
        {MOCK_MODE && <Text style={[type.caption, { textAlign: 'center' }]}>DEV MOCK MODE: no real charge</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  close: { position: 'absolute', top: space.xxl + space.lg, right: space.lg, zIndex: 2 },
  body: { padding: space.xl, paddingTop: space.xxl * 2, gap: space.md },
  kicker: { color: colors.accent, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  benefits: { gap: space.md, marginVertical: space.lg },
  benefit: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  planSelected: { borderColor: colors.accent },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: space.sm, flexWrap: 'wrap' },
  trialPill: { backgroundColor: colors.success, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 2 },
  trialPillText: { color: '#04140C', fontSize: 10, fontWeight: '800' },
  price: { color: colors.text, fontWeight: '800', fontSize: 16 },
  cta: { marginTop: space.md, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: space.lg, alignItems: 'center' },
  ctaText: { color: colors.accentText, fontWeight: '800', fontSize: 17 },
  legal: { color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: space.lg, flexWrap: 'wrap' },
  link: { color: colors.textMuted, fontSize: 13, textDecorationLine: 'underline' },
});
