import { useCallback, useRef, useState, type ComponentRef } from 'react';
import { Image, PixelRatio, StyleSheet, Text, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';

type Job = {
  uri: string;
  width: number;
  height: number;
  resolve: (uri: string) => void;
  reject: (e: unknown) => void;
};

/**
 * Burns a subtle "Posee" watermark into a captured photo, entirely on the
 * device. The photo is drawn off-screen at its native pixel size, the view is
 * captured with react-native-view-shot, and the result is written to a
 * temporary file in the app sandbox.
 *
 * Usage:
 *   const { composer, compose } = useWatermark();
 *   ...render {composer} anywhere in the tree...
 *   const finalUri = await compose(photo.uri, photo.width, photo.height);
 */
export function useWatermark() {
  const [job, setJob] = useState<Job | null>(null);
  const viewRef = useRef<ComponentRef<typeof View>>(null);

  const compose = useCallback(
    (uri: string, width: number, height: number) =>
      new Promise<string>((resolve, reject) => setJob({ uri, width, height, resolve, reject })),
    [],
  );

  const onImageReady = useCallback(async () => {
    if (!job || !viewRef.current) return;
    try {
      const out = await captureRef(viewRef, {
        format: 'jpg',
        quality: 0.92,
        result: 'tmpfile',
        width: job.width,
        height: job.height,
      });
      job.resolve(out);
    } catch (e) {
      job.reject(e);
    } finally {
      setJob(null);
    }
  }, [job]);

  let composer: React.ReactNode = null;
  if (job) {
    // Lay out at native pixels in dp so the capture isn't upscaled.
    const ratio = PixelRatio.get();
    const w = job.width / ratio;
    const h = job.height / ratio;
    const fontSize = Math.max(12, w * 0.032);
    composer = (
      <View pointerEvents="none" style={[styles.offscreen, { width: w, height: h, left: -w - 100 }]}>
        <View ref={viewRef} collapsable={false} style={{ width: w, height: h, backgroundColor: '#000' }}>
          <Image source={{ uri: job.uri }} style={{ width: w, height: h }} onLoadEnd={onImageReady} fadeDuration={0} />
          <View style={[styles.mark, { right: w * 0.03, bottom: w * 0.03, paddingHorizontal: fontSize * 0.6, paddingVertical: fontSize * 0.25 }]}>
            <Text style={[styles.markText, { fontSize }]}>◉ Posee</Text>
          </View>
        </View>
      </View>
    );
  }

  return { composer, compose };
}

const styles = StyleSheet.create({
  offscreen: { position: 'absolute', top: 0 },
  mark: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 999,
  },
  markText: { color: 'rgba(255,255,255,0.88)', fontWeight: '700', letterSpacing: 0.5 },
});
