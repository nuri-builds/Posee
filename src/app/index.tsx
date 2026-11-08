import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useDeferredValue, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '../components/Chip';
import { PoseCard } from '../components/PoseCard';
import { GROUPS, OCCASIONS, POSES, type GroupSize, type Pose } from '../data/poses';
import { useAppStore, useIsPro } from '../state/store';
import { colors, radius, space, type } from '../theme';
import { buildIndex, searchPoses } from '../utils/search';

const INDEX = buildIndex(POSES);
const EXAMPLES = ['shaadi lehenga', 'Goa squad trip', 'Diwali family', 'holi solo', 'sherwani portrait'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [occasion, setOccasion] = useState<string | null>(null);
  const [group, setGroup] = useState<GroupSize | null>(null);
  const deferredQuery = useDeferredValue(query);
  const isPro = useIsPro();
  const setReference = useAppStore((s) => s.setReference);
  const placeholder = useMemo(() => `Try “${EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]}”`, []);

  const results = useMemo(
    () => searchPoses(INDEX, deferredQuery, { occasion, group }),
    [deferredQuery, occasion, group],
  );

  const openPose = (pose: Pose) => {
    if (pose.premium && !isPro) {
      router.push({ pathname: '/paywall', params: { reason: 'premium-pose' } });
      return;
    }
    setReference({ id: pose.id, title: pose.title, tip: pose.tip, source: pose.image, isUserPhoto: false });
    router.push('/camera');
  };

  const pickOwnReference = async () => {
    // The system photo picker shows only what the user taps, so no full library permission is needed.
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, exif: false });
    if (res.canceled || !res.assets[0]) return;
    setReference({ id: 'user-photo', title: 'Your reference', source: { uri: res.assets[0].uri }, isUserPhoto: true });
    router.push('/camera');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => <PoseCard pose={item} locked={item.premium && !isPro} onPress={openPose} />}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View>
                <Text style={type.title}>Posee</Text>
                <Text style={type.caption}>Find a pose. Match it. Nail the shot.</Text>
              </View>
              <Pressable onPress={() => router.push('/privacy')} hitSlop={12} accessibilityLabel="Privacy and settings">
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={placeholder}
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="Search poses by occasion, outfit or group"
              />
              {query.length > 0 && (
                <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {OCCASIONS.map((o) => (
                <Chip
                  key={o.id}
                  label={`${o.emoji} ${o.label}`}
                  selected={occasion === o.id}
                  onPress={() => setOccasion(occasion === o.id ? null : o.id)}
                />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {GROUPS.map((g) => (
                <Chip key={g.id} label={g.label} selected={group === g.id} onPress={() => setGroup(group === g.id ? null : g.id)} />
              ))}
            </ScrollView>

            <Pressable style={styles.ownRef} onPress={pickOwnReference} accessibilityRole="button">
              <Ionicons name="images-outline" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={type.h2}>Use your own reference</Text>
                <Text style={type.caption}>Pick any photo from your gallery. It stays on your phone.</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>

            <Text style={[type.caption, styles.count]}>
              {results.length} {results.length === 1 ? 'pose' : 'poses'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={type.h2}>No poses found</Text>
            <Text style={[type.caption, { textAlign: 'center' }]}>
              Try an occasion like “sangeet” or “Eid”, or use your own reference photo above.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  list: { paddingHorizontal: space.md, paddingBottom: space.xxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: space.lg },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 12 },
  chipRow: { marginTop: space.md, flexGrow: 0 },
  ownRef: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    marginTop: space.lg,
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  count: { marginTop: space.lg, marginBottom: space.sm, marginLeft: space.xs },
  empty: { alignItems: 'center', padding: space.xxl, gap: space.sm },
});
