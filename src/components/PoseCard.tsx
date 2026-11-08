import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Pose } from '../data/poses';
import { OCCASIONS } from '../data/poses';
import { colors, radius, space } from '../theme';

type Props = { pose: Pose; locked: boolean; onPress: (pose: Pose) => void };

const GROUP_ICON = { solo: 'person', couple: 'people', friends: 'people-circle', family: 'home' } as const;

export function PoseCard({ pose, locked, onPress }: Props) {
  const occasion = OCCASIONS.find((o) => o.id === pose.occasion);
  return (
    <Pressable
      onPress={() => onPress(pose)}
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`${pose.title}, ${occasion?.label ?? ''}${locked ? ', Pro' : ''}`}
    >
      <View style={styles.thumb}>
        <Image source={pose.image} contentFit="contain" style={StyleSheet.absoluteFill} />
        {locked && (
          <View style={styles.badge}>
            <Ionicons name="lock-closed" size={11} color={colors.accentText} />
            <Text style={styles.badgeText}>PRO</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {pose.title}
      </Text>
      <View style={styles.meta}>
        <Text style={styles.metaText}>
          {occasion?.emoji} {occasion?.label}
        </Text>
        <Ionicons name={GROUP_ICON[pose.group]} size={13} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: space.xs, backgroundColor: colors.surface, borderRadius: radius.md, padding: space.sm },
  thumb: {
    aspectRatio: 3 / 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceHigh,
    overflow: 'hidden',
    marginBottom: space.sm,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: { color: colors.accentText, fontSize: 10, fontWeight: '800' },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', minHeight: 36 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  metaText: { color: colors.textMuted, fontSize: 12 },
});
