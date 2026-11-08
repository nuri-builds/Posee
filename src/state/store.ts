import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ImageRef } from '../data/poses';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TimerSeconds = 0 | 3 | 5 | 10;
export type Tier = 'free' | 'trial' | 'weekend' | 'monthly';

export type Reference = {
  id: string;
  title: string;
  tip?: string;
  source: ImageRef;
  /** True when the user picked their own photo from the gallery. */
  isUserPhoto: boolean;
};

export type Entitlement = { tier: Tier; expiresAt: string | null };

type State = {
  // Session only. Never persisted, so a user's own reference photo URI is not written to disk by us.
  reference: Reference | null;

  // Overlay preferences (persisted)
  opacity: number;
  timer: TimerSeconds;
  mirrorOverlay: boolean;
  showGrid: boolean;

  // Monetisation (persisted cache; the store receipt is the source of truth)
  entitlement: Entitlement;
  trialPromptShown: boolean;
  captureCount: number;
  watermarkEnabled: boolean;

  /**
   * Privacy: Posee has no cloud upload. This flag exists so that any future
   * sync feature has to check an explicit, user-granted opt-in. It defaults to
   * false and is only ever changed from the Privacy screen.
   */
  cloudSyncConsent: boolean;

  setReference: (r: Reference | null) => void;
  setOpacity: (v: number) => void;
  cycleTimer: () => void;
  toggleMirror: () => void;
  toggleGrid: () => void;
  setEntitlement: (e: Entitlement) => void;
  markTrialPromptShown: () => void;
  incrementCaptures: () => void;
  setWatermarkEnabled: (v: boolean) => void;
  setCloudSyncConsent: (v: boolean) => void;
};

const TIMERS: TimerSeconds[] = [0, 3, 5, 10];

export const useAppStore = create<State>()(
  persist(
    (set, get) => ({
      reference: null,
      opacity: 0.45,
      timer: 3,
      mirrorOverlay: false,
      showGrid: true,
      entitlement: { tier: 'free', expiresAt: null },
      trialPromptShown: false,
      captureCount: 0,
      watermarkEnabled: true,
      cloudSyncConsent: false,

      setReference: (reference) => set({ reference }),
      setOpacity: (opacity) => set({ opacity: Math.min(0.9, Math.max(0.1, opacity)) }),
      cycleTimer: () => {
        const i = TIMERS.indexOf(get().timer);
        set({ timer: TIMERS[(i + 1) % TIMERS.length] });
      },
      toggleMirror: () => set((s) => ({ mirrorOverlay: !s.mirrorOverlay })),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
      setEntitlement: (entitlement) =>
        // Turn the watermark back on when access lapses, since removing it is a Pro feature.
        set((s) => ({ entitlement, watermarkEnabled: entitlement.tier === 'free' ? true : s.watermarkEnabled })),
      markTrialPromptShown: () => set({ trialPromptShown: true }),
      incrementCaptures: () => set((s) => ({ captureCount: s.captureCount + 1 })),
      setWatermarkEnabled: (watermarkEnabled) => set({ watermarkEnabled }),
      setCloudSyncConsent: (cloudSyncConsent) => set({ cloudSyncConsent }),
    }),
    {
      name: 'posee-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ reference: _omit, ...rest }) => rest,
      // Don't persist functions. Zustand re-merges them on rehydrate.
    },
  ),
);

/** Pro access counts only while it is unexpired. Check this, not `tier` alone. */
export function isProActive(e: Entitlement, now = Date.now()): boolean {
  if (e.tier === 'free') return false;
  return e.expiresAt === null || new Date(e.expiresAt).getTime() > now;
}

export const useIsPro = () => useAppStore((s) => isProActive(s.entitlement));
