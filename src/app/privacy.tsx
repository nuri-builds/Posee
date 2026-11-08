import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore, useIsPro } from '../state/store';
import { colors, radius, space, type } from '../theme';

const PROMISES = [
  'Your camera feed is processed only on this phone. It is never streamed or recorded.',
  'Photos you take are saved straight to your phone’s gallery. They are not uploaded.',
  'Reference photos you pick from your gallery stay on your phone.',
  'Payments go through Apple or Google. We never see your card or UPI details.',
  'No account, no sign-up, no contact list access.',
];

export default function PrivacyScreen() {
  const isPro = useIsPro();
  const { entitlement, watermarkEnabled, setWatermarkEnabled, cloudSyncConsent, setCloudSyncConsent } = useAppStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={type.title}>Privacy & settings</Text>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Close">
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, gap: space.lg }}>
        <View style={styles.card}>
          {PROMISES.map((p) => (
            <View key={p} style={styles.row}>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              <Text style={[type.body, { flex: 1 }]}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={type.h2}>Posee watermark</Text>
              <Text style={type.caption}>
                {isPro ? 'A small mark in the corner of your photos.' : 'Turning it off is a Pro feature.'}
              </Text>
            </View>
            <Switch
              value={watermarkEnabled}
              onValueChange={(v) => (isPro ? setWatermarkEnabled(v) : router.push('/paywall'))}
              trackColor={{ true: colors.accent, false: colors.border }}
            />
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={type.h2}>Cloud backup</Text>
              <Text style={type.caption}>
                Not available yet. If it is ever added, it stays off until you turn it on here.
              </Text>
            </View>
            <Switch value={cloudSyncConsent} onValueChange={setCloudSyncConsent} disabled trackColor={{ true: colors.accent, false: colors.border }} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={type.h2}>Your plan</Text>
          <Text style={type.caption}>
            {isPro
              ? `${entitlement.tier[0].toUpperCase()}${entitlement.tier.slice(1)}${entitlement.expiresAt ? ` · until ${new Date(entitlement.expiresAt).toLocaleString()}` : ''}`
              : 'Free'}
          </Text>
          {!isPro && (
            <Pressable onPress={() => router.push('/paywall')} style={styles.upgrade}>
              <Text style={styles.upgradeText}>See Pro plans</Text>
            </Pressable>
          )}
        </View>

        <Pressable onPress={() => Linking.openSettings()}>
          <Text style={[type.caption, { textAlign: 'center', textDecorationLine: 'underline' }]}>Manage camera & photo permissions</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: space.lg, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  upgrade: { alignSelf: 'flex-start', backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm },
  upgradeText: { color: colors.accentText, fontWeight: '800' },
});
