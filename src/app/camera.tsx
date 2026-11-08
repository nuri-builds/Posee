import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GhostOverlay, ThirdsGrid } from '../components/GhostOverlay';
import { useWatermark } from '../components/WatermarkComposer';
import { saveToGallery } from '../services/gallery';
import { ensureCameraPermission } from '../services/permissions';
import { useAppStore, useIsPro } from '../state/store';
import { colors, radius, space, type } from '../theme';

export default function CameraScreen() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const reference = useAppStore((s) => s.reference);
  const { opacity, timer, mirrorOverlay, showGrid, watermarkEnabled } = useAppStore();
  const { setOpacity, cycleTimer, toggleMirror, toggleGrid, incrementCaptures, markTrialPromptShown } = useAppStore();
  const isPro = useIsPro();

  const cameraRef = useRef<CameraView>(null);
  const [facing, setFacing] = useState<CameraType>('back');
  const [ready, setReady] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const { composer, compose } = useWatermark();
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);
  // Re-check when returning from system Settings, so the gate updates without a restart.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => s === 'active' && getPermission());
    return () => sub.remove();
  }, [getPermission]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!reference) return <Redirect href="/" />;

  // Permission gate: explain first, then ask. Never open the camera silently.
  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permWrap}>
        <Ionicons name="camera-outline" size={56} color={colors.accent} />
        <Text style={[type.title, { textAlign: 'center' }]}>Line up your shot</Text>
        <Text style={[type.caption, styles.permBody]}>
          Posee shows your chosen pose as a see-through overlay on the live camera. The preview stays on your phone.
          Nothing is recorded or uploaded.
        </Text>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => (permission?.canAskAgain === false ? ensureCameraPermission() : requestPermission())}
        >
          <Text style={styles.primaryBtnText}>Allow camera</Text>
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={type.caption}>Not now</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const runCountdown = async (seconds: number) => {
    for (let s = seconds; s > 0; s--) {
      if (cancelled.current) return false;
      setCountdown(s);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);
    return !cancelled.current;
  };

  const capture = async () => {
    if (!ready || busy || countdown !== null) return;
    setBusy(true);
    try {
      if (timer > 0 && !(await runCountdown(timer))) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // The overlay is a separate view, so it never appears in the photo.
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.92, exif: false, shutterSound: true });
      if (!photo) return;

      const applyMark = watermarkEnabled || !isPro;
      const finalUri = applyMark ? await compose(photo.uri, photo.width, photo.height) : photo.uri;
      const saved = await saveToGallery(finalUri);
      setToast(saved ? 'Saved to your gallery ✓' : 'Not saved. Photos access is off.');

      if (saved) {
        incrementCaptures();
        // Show the trial prompt once, after the user has had a real win (two saved shots).
        const { captureCount, trialPromptShown } = useAppStore.getState();
        if (!isPro && !trialPromptShown && captureCount >= 2) {
          markTrialPromptShown();
          setTimeout(() => router.push({ pathname: '/paywall', params: { reason: 'trial' } }), 900);
        }
      }
    } catch {
      setToast('Something went wrong. Please try again.');
    } finally {
      setCountdown(null);
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="picture"
        animateShutter
        onCameraReady={() => setReady(true)}
      />
      {showGrid && <ThirdsGrid />}
      <GhostOverlay reference={reference} opacity={opacity} mirrored={mirrorOverlay} visible={overlayVisible} />
      {composer}

      {countdown !== null && (
        <View pointerEvents="none" style={styles.countdownWrap}>
          <Text style={styles.countdown}>{countdown}</Text>
        </View>
      )}

      <SafeAreaView style={styles.chrome} edges={['top', 'bottom']} pointerEvents="box-none">
        {/* Top bar */}
        <View style={styles.topBar}>
          <IconBtn icon="chevron-back" label="Back to search" onPress={() => router.back()} />
          <View style={styles.topRight}>
            <IconBtn icon={showGrid ? 'grid' : 'grid-outline'} label="Toggle grid" onPress={toggleGrid} />
            <IconBtn icon="swap-horizontal" label="Mirror overlay" active={mirrorOverlay} onPress={toggleMirror} />
            <Pressable onPress={cycleTimer} style={styles.timerChip} accessibilityLabel={`Timer ${timer} seconds. Tap to change.`}>
              <Ionicons name="timer-outline" size={16} color={colors.text} />
              <Text style={styles.timerText}>{timer === 0 ? 'Off' : `${timer}s`}</Text>
            </Pressable>
          </View>
        </View>

        {reference.tip && (
          <View style={styles.tip}>
            <Text style={styles.tipText}>💡 {reference.tip}</Text>
          </View>
        )}

        <View style={{ flex: 1 }} pointerEvents="none" />

        {toast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        {/* Opacity slider */}
        <View style={styles.sliderRow}>
          <Ionicons name="eye-off-outline" size={16} color={colors.text} />
          <Slider
            style={{ flex: 1 }}
            minimumValue={0.1}
            maximumValue={0.9}
            step={0.05}
            value={opacity}
            onValueChange={setOpacity}
            minimumTrackTintColor={colors.accent}
            maximumTrackTintColor="rgba(255,255,255,0.3)"
            thumbTintColor={colors.accent}
            accessibilityLabel="Overlay opacity"
          />
          <Ionicons name="eye-outline" size={16} color={colors.text} />
          <Text style={styles.pct}>{Math.round(opacity * 100)}%</Text>
        </View>

        {/* Bottom controls */}
        <View style={styles.bottomBar}>
          <Pressable
            onPressIn={() => setOverlayVisible(false)}
            onPressOut={() => setOverlayVisible(true)}
            style={styles.refThumb}
            accessibilityLabel="Hold to hide the overlay and check the real scene"
          >
            <Image source={reference.source} contentFit="cover" style={StyleSheet.absoluteFill} />
            <Text style={styles.holdHint}>HOLD</Text>
          </Pressable>

          <Pressable onPress={capture} disabled={!ready || busy} style={styles.shutterOuter} accessibilityLabel="Take photo">
            {busy && countdown === null ? <ActivityIndicator color={colors.bg} /> : <View style={styles.shutterInner} />}
          </Pressable>

          <IconBtn
            icon="camera-reverse-outline"
            label="Switch camera"
            size={28}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function IconBtn({
  icon,
  label,
  onPress,
  active,
  size = 22,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
  size?: number;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityLabel={label} style={[styles.iconBtn, active && { backgroundColor: colors.accent }]}>
      <Ionicons name={icon} size={size} color={active ? colors.accentText : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  chrome: { ...StyleSheet.absoluteFill, paddingHorizontal: space.lg },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: space.sm },
  topRight: { flexDirection: 'row', gap: space.sm, alignItems: 'center' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlayScrim,
  },
  timerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 44,
    paddingHorizontal: space.md,
    borderRadius: 22,
    backgroundColor: colors.overlayScrim,
  },
  timerText: { color: colors.text, fontWeight: '700' },
  tip: { marginTop: space.md, alignSelf: 'center', backgroundColor: colors.overlayScrim, borderRadius: radius.md, padding: space.sm, maxWidth: '92%' },
  tipText: { color: colors.text, fontSize: 13, textAlign: 'center' },
  toast: { alignSelf: 'center', backgroundColor: colors.surfaceHigh, borderRadius: radius.pill, paddingHorizontal: space.lg, paddingVertical: space.sm, marginBottom: space.md },
  toastText: { color: colors.text, fontWeight: '600' },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.overlayScrim,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    paddingVertical: 2,
  },
  pct: { color: colors.text, width: 38, textAlign: 'right', fontVariant: ['tabular-nums'], fontSize: 12 },
  bottomBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.lg },
  refThumb: { width: 52, height: 52, borderRadius: radius.sm, overflow: 'hidden', borderWidth: 2, borderColor: colors.text, backgroundColor: colors.surface, justifyContent: 'flex-end' },
  holdHint: { color: colors.text, fontSize: 9, fontWeight: '800', textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  shutterOuter: { width: 78, height: 78, borderRadius: 39, borderWidth: 4, borderColor: colors.text, alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.text },
  countdownWrap: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  countdown: { fontSize: 140, fontWeight: '900', color: 'rgba(255,255,255,0.9)' },
  permWrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xxl, gap: space.lg },
  permBody: { textAlign: 'center', fontSize: 15, lineHeight: 22 },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: space.xxl, paddingVertical: space.md },
  primaryBtnText: { color: colors.accentText, fontWeight: '800', fontSize: 16 },
});
