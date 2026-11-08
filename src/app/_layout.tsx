import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initPurchases, onEntitlementChange, refreshEntitlement } from '../services/purchases';
import { useAppStore } from '../state/store';
import { colors } from '../theme';

export default function RootLayout() {
  const setEntitlement = useAppStore((s) => s.setEntitlement);

  useEffect(() => {
    initPurchases();
    refreshEntitlement().then((e) => e && setEntitlement(e));
    return onEntitlementChange(setEntitlement);
  }, [setEntitlement]);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="camera" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="privacy" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
