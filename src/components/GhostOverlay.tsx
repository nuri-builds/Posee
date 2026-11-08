import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import type { Reference } from '../state/store';

type Props = {
  reference: Reference;
  opacity: number;
  mirrored: boolean;
  visible: boolean;
};

/**
 * The semi-transparent reference image drawn over the live viewfinder.
 * pointerEvents="none" passes taps through to the camera, so tap-to-focus
 * still works.
 */
export function GhostOverlay({ reference, opacity, mirrored, visible }: Props) {
  if (!visible) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        source={reference.source}
        contentFit="contain"
        transition={150}
        style={[StyleSheet.absoluteFill, { opacity }, mirrored && { transform: [{ scaleX: -1 }] }]}
        accessibilityLabel={`Pose overlay: ${reference.title}`}
      />
    </View>
  );
}

/** Rule-of-thirds guide. It helps line up the horizon and the subject. */
export function ThirdsGrid() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {[1, 2].map((i) => (
        <View key={`v${i}`} style={[styles.line, { left: `${(i * 100) / 3}%`, top: 0, bottom: 0, width: StyleSheet.hairlineWidth }]} />
      ))}
      {[1, 2].map((i) => (
        <View key={`h${i}`} style={[styles.line, { top: `${(i * 100) / 3}%`, left: 0, right: 0, height: StyleSheet.hairlineWidth }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  line: { position: 'absolute', backgroundColor: 'rgba(255,255,255,0.35)' },
});
