import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from './_layout';
import { Colors, Spacing, MaxContentWidth } from '../constants/theme';
import { GAME_WORLDS, LEVELS, Level } from '../data/gameData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LevelsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const worldId = (params.worldId as string) || 'logic-forest';
  
  const { profile, loading } = useUser();
  const [levelStars, setLevelStars] = useState<{ [key: string]: number }>({});
  const [loadingStars, setLoadingStars] = useState(true);

  const world = GAME_WORLDS.find(w => w.id === worldId) || GAME_WORLDS[0];
  const worldLevels = LEVELS.filter(l => l.worldId === worldId);

  useEffect(() => {
    if (profile) {
      loadCompletedLevels();
    }
  }, [profile, worldId]);

  const loadCompletedLevels = async () => {
    try {
      const stars: { [key: string]: number } = {};
      for (const level of worldLevels) {
        const key = `stars_${profile?.uid}_${worldId}_${level.id}`;
        const rating = await AsyncStorage.getItem(key);
        if (rating) {
          stars[level.id] = parseInt(rating);
        }
      }
      setLevelStars(stars);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStars(false);
    }
  };

  const isLevelUnlocked = (level: Level) => {
    if (!profile) return false;
    return profile.xp >= level.requiredXp;
  };

  const handleLevelPress = (level: Level) => {
    if (!isLevelUnlocked(level)) return;
    
    router.push({
      pathname: '/gameplay',
      params: { worldId, levelId: level.id.toString(), mode: 'normal' }
    });
  };

  if (loading || !profile || loadingStars) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* World Header Card */}
        <View style={[styles.worldHeader, { borderColor: world.color }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>◀ Map</Text>
          </TouchableOpacity>
          <View style={styles.worldTitleContainer}>
            <Text style={[styles.worldTitle, { color: world.color }]}>{world.name}</Text>
            <Text style={styles.worldDesc}>{world.description}</Text>
          </View>
        </View>

        {/* Levels Grid/List */}
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {worldLevels.map((level, index) => {
            const unlocked = isLevelUnlocked(level);
            const stars = levelStars[level.id] || 0;

            return (
              <TouchableOpacity
                key={level.id}
                style={[
                  styles.levelItem,
                  !unlocked && styles.lockedLevelItem,
                  unlocked ? { borderColor: '#4d2b99' } : { borderColor: '#1d0f3a' }
                ]}
                disabled={!unlocked}
                onPress={() => handleLevelPress(level)}
                activeOpacity={0.8}
              >
                {/* Level Tag Number */}
                <View style={[
                  styles.levelNumberContainer,
                  { backgroundColor: unlocked ? world.color : '#22143d' }
                ]}>
                  <Text style={styles.levelNumberText}>
                    {unlocked ? level.id : '🔒'}
                  </Text>
                </View>

                {/* Level Details */}
                <View style={styles.levelDetails}>
                  <Text style={[styles.levelName, !unlocked && styles.lockedLevelText]}>
                    Tier {level.id}: Challenges
                  </Text>
                  
                  {unlocked ? (
                    <View style={styles.unlockedDetailsRow}>
                      <Text style={styles.levelInfoText}>
                        {level.questionsCount} Questions | ⏱ {level.timeLimit}s limit
                      </Text>
                      {stars > 0 && (
                        <View style={styles.starsRow}>
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Text key={i} style={styles.starIcon}>
                              {i < stars ? '⭐' : '☆'}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={styles.lockedRequirementText}>
                      Requires {level.requiredXp} XP (Need {level.requiredXp - profile.xp} more)
                    </Text>
                  )}
                </View>

                {/* Launch Button Indicator */}
                {unlocked && (
                  <View style={styles.launchIndicator}>
                    <Text style={[styles.launchIndicatorText, { color: world.color }]}>PLAY</Text>
                  </View>
                )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f051d',
  },
  worldHeader: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: Spacing.three,
    borderBottomWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.one,
    backgroundColor: '#1d0f3a',
    marginRight: Spacing.three,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#3a2075',
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  worldTitleContainer: {
    flex: 1,
  },
  worldTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  worldDesc: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 110, // Buffer for tabbar
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  lockedLevelItem: {
    opacity: 0.6,
  },
  levelNumberContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  levelNumberText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '900',
  },
  levelDetails: {
    flex: 1,
    marginLeft: Spacing.three,
    justifyContent: 'center',
  },
  levelName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 2,
  },
  lockedLevelText: {
    color: '#a594cf',
  },
  unlockedDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelInfoText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  starIcon: {
    fontSize: 12,
  },
  lockedRequirementText: {
    color: '#ff007f',
    fontSize: 11,
    fontWeight: 'bold',
  },
  launchIndicator: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    backgroundColor: '#16092d',
    borderWidth: 1,
    borderColor: '#3a2075',
  },
  launchIndicatorText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
