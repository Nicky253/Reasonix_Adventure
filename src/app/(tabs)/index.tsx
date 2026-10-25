import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../_layout';
import { Colors, Spacing, MaxContentWidth } from '../../constants/theme';
import { aiService } from '../../services/aiService';
import { REWARDS } from '../../data/gameData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const { profile, loading } = useUser();
  const [dailyCompleted, setDailyCompleted] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  useEffect(() => {
    if (profile) {
      checkDailyChallengeStatus();
      // Generate AI learning recommendations
      const recs = aiService.getPersonalizedLearningPath(profile);
      setRecommendations(recs);
    }
  }, [profile]);

  const checkDailyChallengeStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const completedDate = await AsyncStorage.getItem(`daily_completed_${profile?.uid}`);
      if (completedDate === today) {
        setDailyCompleted(true);
      } else {
        setDailyCompleted(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDaily(false);
    }
  };

  const handleStartDailyChallenge = () => {
    if (dailyCompleted) return;
    
    router.push('/gameplay?mode=daily');
  };

  const handleLogout = async () => {
    const { auth } = require('../../config/firebase');
    await auth.signOut();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I'm playing Reasonix! I'm Level ${profile?.level} (${profile?.levelTitle}) with ${profile?.xp} XP! Can you beat my score? Download Reasonix: Play Smart. Think Better.`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  // Calculate percentage progress to next level
  const nextLevelXp = profile.level * 500;
  const prevLevelXp = (profile.level - 1) * 500;
  const levelProgress = Math.min(
    1,
    (profile.xp - prevLevelXp) / (nextLevelXp - prevLevelXp || 1)
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Dashboard Header Profile Banner */}
          <View style={styles.profileBanner}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{profile.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.profileStats}>
              <Text style={styles.welcomeText}>Agent: {profile.name}</Text>
              <Text style={styles.levelTitleText}>{profile.levelTitle}</Text>
              <Text style={styles.levelRankText}>Level {profile.level}</Text>
            </View>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>Exit</Text>
            </TouchableOpacity>
          </View>

          {/* XP Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarHeader}>
              <Text style={styles.progressBarLabel}>XP: {profile.xp} / {nextLevelXp}</Text>
              <Text style={styles.progressBarPercentage}>{Math.round(levelProgress * 100)}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${levelProgress * 100}%` }]} />
            </View>
          </View>

          {/* Coins & Streaks Widgets */}
          <View style={styles.widgetsRow}>
            <View style={styles.widgetCard}>
              <Text style={styles.widgetIcon}>🪙</Text>
              <View>
                <Text style={styles.widgetValue}>{profile.coins}</Text>
                <Text style={styles.widgetLabel}>COINS</Text>
              </View>
            </View>
            
            <View style={styles.widgetCard}>
              <Text style={styles.widgetIcon}>🔥</Text>
              <View>
                <Text style={styles.widgetValue}>{profile.streak} Days</Text>
                <Text style={styles.widgetLabel}>STREAK</Text>
              </View>
            </View>
          </View>

          {/* Start Game Hero Button */}
          <TouchableOpacity 
            style={styles.heroPlayButton}
            onPress={() => router.push('/map')}
          >
            <LinearGradient 
              colors={['#ffd700', '#ff9800']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={styles.playGradient}
            >
              <Text style={styles.playButtonText}>ENTER WORLDS MAP</Text>
              <Text style={styles.playButtonSubText}>Explore 6 Cognitive Game Worlds</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Daily Challenge Card */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily Codex Challenge</Text>
          </View>

          <TouchableOpacity 
            style={[styles.dailyCard, dailyCompleted && styles.dailyCompletedCard]}
            onPress={handleStartDailyChallenge}
            disabled={dailyCompleted || loadingDaily}
          >
            {loadingDaily ? (
              <ActivityIndicator color={Colors.dark.accent} />
            ) : (
              <View style={styles.dailyCardContent}>
                <View style={styles.dailyBadge}>
                  <Text style={styles.dailyBadgeIcon}>{dailyCompleted ? '✅' : '⚡'}</Text>
                </View>
                <View style={styles.dailyTextContainer}>
                  <Text style={styles.dailyTitle}>
                    {dailyCompleted ? 'Daily challenge completed!' : 'Daily Mind Multiplier'}
                  </Text>
                  <Text style={styles.dailyDescription}>
                    {dailyCompleted 
                      ? 'Come back tomorrow for new challenges!' 
                      : 'Solve today\'s reasoning challenge for extra rewards.'}
                  </Text>
                  {!dailyCompleted && (
                    <Text style={styles.dailyRewards}>
                      Reward: +{REWARDS.DAILY_CHALLENGE_XP} XP | +{REWARDS.DAILY_CHALLENGE_COINS} Coins
                    </Text>
                  )}
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* AI Advisor Panel */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Cognitive Advisor</Text>
            <Text style={styles.sectionBadge}>Beta</Text>
          </View>
          
          <View style={styles.aiPanel}>
            <Text style={styles.aiAdvisorHeader}>🤖 Personalized Path Advisor</Text>
            {recommendations.map((rec, idx) => (
              <View key={idx} style={styles.recItem}>
                <Text style={styles.recBullet}>✦</Text>
                <Text style={styles.recText}>{rec}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/leaderboard')}>
              <Text style={styles.actionButtonIcon}>🏆</Text>
              <Text style={styles.actionButtonText}>Leaderboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionButtonIcon}>📡</Text>
              <Text style={styles.actionButtonText}>Share Stats</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/profile')}>
              <Text style={styles.actionButtonIcon}>📊</Text>
              <Text style={styles.actionButtonText}>AI Analytics</Text>
            </TouchableOpacity>
          </View>

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
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f051d',
  },
  profileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3a2075',
    marginBottom: Spacing.three,
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  avatarText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '900',
  },
  profileStats: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  welcomeText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  levelTitleText: {
    fontSize: 12,
    color: Colors.dark.cyan,
    fontWeight: 'bold',
  },
  levelRankText: {
    fontSize: 13,
    color: Colors.dark.accent,
    fontWeight: '800',
    marginTop: Spacing.half,
  },
  logoutBtn: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    backgroundColor: '#3a2075',
  },
  logoutBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3a2075',
    marginBottom: Spacing.three,
  },
  progressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.two,
  },
  progressBarLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarPercentage: {
    color: Colors.dark.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#0f051d',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.cyan,
    borderRadius: 5,
  },
  widgetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  widgetCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3a2075',
    gap: Spacing.two,
  },
  widgetIcon: {
    fontSize: 28,
  },
  widgetValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  widgetLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 9,
    fontWeight: 'bold',
  },
  heroPlayButton: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    marginBottom: Spacing.four,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playGradient: {
    paddingVertical: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonText: {
    color: '#0f051d',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  playButtonSubText: {
    color: '#0f051d',
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.8,
    marginTop: Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    fontSize: 10,
    color: Colors.dark.cyan,
    backgroundColor: '#1d0f3a',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
    marginLeft: Spacing.two,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: Colors.dark.cyan,
  },
  dailyCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dailyCompletedCard: {
    borderColor: '#2e1c50',
    opacity: 0.8,
  },
  dailyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dailyBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2c124d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dailyBadgeIcon: {
    fontSize: 22,
  },
  dailyTextContainer: {
    flex: 1,
  },
  dailyTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dailyDescription: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  dailyRewards: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: Spacing.one,
  },
  aiPanel: {
    backgroundColor: '#16092d',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#4d2b99',
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  aiAdvisorHeader: {
    color: Colors.dark.cyan,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  recItem: {
    flexDirection: 'row',
    marginBottom: Spacing.one,
    paddingRight: Spacing.three,
  },
  recBullet: {
    color: Colors.dark.accent,
    marginRight: Spacing.two,
    fontSize: 12,
  },
  recText: {
    color: '#ffffff',
    fontSize: 12,
    lineHeight: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundElement,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3a2075',
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionButtonIcon: {
    fontSize: 20,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
