import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from './_layout';
import { Colors, Spacing, MaxContentWidth } from '../constants/theme';
import { GAME_WORLDS, GAME_WORLDS as WORLDS } from '../data/gameData';

export default function MapScreen() {
  const router = useRouter();
  const { profile, loading } = useUser();

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  // Helper to check if a world is unlocked
  const isWorldUnlocked = (worldId: string) => {
    // Determine required XP based on world index
    const worldIndex = WORLDS.findIndex(w => w.id === worldId);
    if (worldIndex === 0) return true; // first world is always unlocked
    
    // Each subsequent world requires an additional 400 XP
    const requiredXp = worldIndex * 400;
    return profile.xp >= requiredXp;
  };

  const getWorldRequiredXp = (worldId: string) => {
    const worldIndex = WORLDS.findIndex(w => w.id === worldId);
    return worldIndex * 400;
  };

  const handleWorldPress = (worldId: string) => {
    if (!isWorldUnlocked(worldId)) return;
    
    router.push({
      pathname: '/levels',
      params: { worldId }
    });
  };

  // Map representation of icons
  const emojiMap: { [key: string]: string } = {
    'logic-forest': '🌲',
    'puzzle-temple': '🏛️',
    'pattern-factory': '⚙️',
    'detective-city': '🕵️',
    'quantum-space': '🌀',
    'kingdom-of-intelligence': '👑'
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>COGNITIVE MAP</Text>
          <Text style={styles.headerSubtitle}>Traverse the Realms of Reason</Text>
          <View style={styles.accentLine} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {GAME_WORLDS.map((world, idx) => {
            const unlocked = isWorldUnlocked(world.id);
            const reqXp = getWorldRequiredXp(world.id);
            const progressPct = unlocked ? 100 : Math.round((profile.xp / reqXp) * 100);

            return (
              <TouchableOpacity
                key={world.id}
                style={[
                  styles.worldCard, 
                  { borderColor: unlocked ? world.color : '#2e1c50' },
                  !unlocked && styles.lockedCard
                ]}
                onPress={() => handleWorldPress(world.id)}
                disabled={!unlocked}
                activeOpacity={0.8}
              >
                {/* World Emoji Icon */}
                <View style={[
                  styles.iconContainer, 
                  { backgroundColor: unlocked ? `${world.color}15` : '#16092d' }
                ]}>
                  <Text style={[styles.worldEmoji, !unlocked && styles.lockedEmoji]}>
                    {unlocked ? emojiMap[world.id] : '🔒'}
                  </Text>
                </View>

                {/* World Detail Texts */}
                <View style={styles.detailsContainer}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.worldName, !unlocked && styles.lockedText]}>
                      {idx + 1}. {world.name}
                    </Text>
                    {unlocked ? (
                      <Text style={[styles.unlockedBadge, { color: world.color, borderColor: world.color }]}>
                        ACTIVE
                      </Text>
                    ) : (
                      <Text style={styles.lockedBadge}>LOCKED</Text>
                    )}
                  </View>

                  <Text style={styles.worldDesc} numberOfLines={2}>
                    {world.description}
                  </Text>

                  {unlocked ? (
                    <View style={styles.categoriesRow}>
                      {world.categories.map((cat, cIdx) => (
                        <Text key={cIdx} style={styles.categoryTag}>
                          {cat}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <View style={styles.lockProgressContainer}>
                      <Text style={styles.lockRequirementText}>
                        Requires {reqXp} XP (You have {profile.xp} XP)
                      </Text>
                      <View style={styles.lockProgressBarBg}>
                        <View style={[styles.lockProgressBarFill, { width: `${progressPct}%` }]} />
                      </View>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f051d',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: Colors.dark.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  accentLine: {
    width: 60,
    height: 2,
    backgroundColor: Colors.dark.accent,
    marginTop: Spacing.two,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 110, // Buffer for tabbar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f051d',
  },
  worldCard: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  lockedCard: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a2075',
  },
  worldEmoji: {
    fontSize: 34,
  },
  lockedEmoji: {
    fontSize: 24,
    opacity: 0.5,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.half,
  },
  worldName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  lockedText: {
    color: '#a594cf',
  },
  unlockedBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: Spacing.two,
    paddingVertical: 1.5,
    borderRadius: Spacing.one,
    borderWidth: 1,
  },
  lockedBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ff007f',
    borderColor: '#ff007f',
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1.5,
    borderRadius: Spacing.one,
  },
  worldDesc: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: Spacing.two,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  categoryTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.dark.cyan,
    backgroundColor: '#0f051d',
    borderColor: Colors.dark.cyan,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  lockProgressContainer: {
    marginTop: Spacing.one,
  },
  lockRequirementText: {
    fontSize: 10,
    color: '#ff007f',
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  lockProgressBarBg: {
    height: 4,
    backgroundColor: '#0f051d',
    borderRadius: 2,
    overflow: 'hidden',
  },
  lockProgressBarFill: {
    height: '100%',
    backgroundColor: '#ff007f',
    borderRadius: 2,
  },
});
