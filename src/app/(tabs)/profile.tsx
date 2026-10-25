import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity, 
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../_layout';
import { Colors, Spacing, MaxContentWidth } from '../../constants/theme';
import { aiService, CognitiveProfile } from '../../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { profile, loading } = useUser();
  const [analytics, setAnalytics] = useState<CognitiveProfile | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKeyField, setShowKeyField] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Achievements master definitions
  const achievementsList = [
    { title: 'Logic Explorer', icon: '🌲', description: 'Unlock tier 2 in any game world.' },
    { title: 'Puzzle Solver', icon: '🏛️', description: 'Unlock tier 3 in any game world.' },
    { title: 'Strategy Master', icon: '⚙️', description: 'Unlock tier 4 in any game world.' },
    { title: 'Mind Warrior', icon: '🕵️', description: 'Unlock tier 5 in any game world.' },
    { title: 'Grand Genius', icon: '👑', description: 'Reach Level 7 and accumulate 3,000 XP.' }
  ];

  useEffect(() => {
    if (profile) {
      // Calculate AI stats
      const stats = aiService.getPerformanceAnalytics(profile);
      setAnalytics(stats);
      loadApiKey();
    }
  }, [profile]);

  const loadApiKey = async () => {
    try {
      const key = await AsyncStorage.getItem('gemini_api_key');
      if (key) {
        setApiKey(key);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveApiKey = async () => {
    try {
      if (apiKey.trim()) {
        await AsyncStorage.setItem('gemini_api_key', apiKey.trim());
        setSaveStatus('Key saved! Live AI puzzle gen enabled.');
      } else {
        await AsyncStorage.removeItem('gemini_api_key');
        setSaveStatus('Key cleared. Using local procedural puzzle engine.');
      }
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (e) {
      setSaveStatus('Error saving key.');
    }
  };

  if (loading || !profile || !analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  // Categories list for performance charts
  const categoriesList = [
    { name: 'Logical Reasoning', color: '#4CAF50' },
    { name: 'Analytical Thinking', color: '#FF9800' },
    { name: 'Pattern Recognition', color: '#00BCD4' },
    { name: 'Coding-Decoding', color: '#9C27B0' },
    { name: 'Visual Puzzles', color: '#E91E63' },
    { name: 'Riddles', color: '#2196F3' }
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>COGNITIVE PROFILE</Text>
          <Text style={styles.headerSubtitle}>Agent Identity & AI Diagnostics</Text>
          <View style={styles.accentLine} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Identity Card */}
          <View style={styles.identityCard}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>{profile.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.agentName}>{profile.name}</Text>
            <Text style={styles.archetypeTitle}>{analytics.archetype.toUpperCase()}</Text>
            <Text style={styles.agentEmail}>{profile.email || 'Guest Profile'}</Text>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.xp}</Text>
              <Text style={styles.statLabel}>TOTAL XP</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.coins}</Text>
              <Text style={styles.statLabel}>COINS</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.analytics.accuracy}%</Text>
              <Text style={styles.statLabel}>ACCURACY</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analytics.averageSpeed}s</Text>
              <Text style={styles.statLabel}>AVG TIME</Text>
            </View>
          </View>

          {/* AI Cognitive Advisor Report */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Cognitive Diagnosis</Text>
          </View>

          <View style={styles.diagnosticCard}>
            <View style={styles.strengthsWeaknessesRow}>
              <View style={styles.diagnosticSubBox}>
                <Text style={[styles.diagnosticLabel, { color: Colors.dark.green }]}>⚡ Key Strengths</Text>
                {analytics.strengths.map((str, idx) => (
                  <Text key={idx} style={styles.diagnosticValueText}>
                    • {str.category} ({str.score}%)
                  </Text>
                ))}
              </View>

              <View style={styles.diagnosticSubBox}>
                <Text style={[styles.diagnosticLabel, { color: Colors.dark.magenta }]}>⚠️ Focus Areas</Text>
                {analytics.weaknesses.map((weak, idx) => (
                  <Text key={idx} style={styles.diagnosticValueText}>
                    • {weak.category} ({weak.score}%)
                  </Text>
                ))}
              </View>
            </View>

            {/* Performance Charts */}
            <Text style={styles.chartTitle}>Category Diagnostic Matrix</Text>
            <View style={styles.chartContainer}>
              {categoriesList.map(cat => {
                const stat = profile.analytics.categoryStats[cat.name];
                const score = stat && stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 50;
                const played = stat ? stat.total > 0 : false;

                return (
                  <View key={cat.name} style={styles.chartRow}>
                    <Text style={styles.chartRowLabel} numberOfLines={1}>
                      {cat.name}
                    </Text>
                    <View style={styles.chartBarBg}>
                      <View 
                        style={[
                          styles.chartBarFill, 
                          { width: `${score}%`, backgroundColor: cat.color }
                        ]} 
                      />
                    </View>
                    <Text style={[styles.chartRowValue, { color: cat.color }]}>
                      {played ? `${score}%` : '—'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Achievements Shelf */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Achievements Codex</Text>
            <Text style={styles.sectionBadge}>{profile.achievements.length} / 5</Text>
          </View>

          <View style={styles.achievementsCard}>
            {achievementsList.map(item => {
              const unlocked = profile.achievements.includes(item.title) || 
                               (item.title === 'Grand Genius' && profile.level >= 7);

              return (
                <View 
                  key={item.title} 
                  style={[
                    styles.achievementRow,
                    !unlocked && styles.lockedAchievementRow
                  ]}
                >
                  <View style={[
                    styles.achievementIconContainer,
                    unlocked ? { borderColor: Colors.dark.accent } : { borderColor: '#1d0f3a' }
                  ]}>
                    <Text style={styles.achievementIcon}>
                      {unlocked ? item.icon : '🔒'}
                    </Text>
                  </View>
                  <View style={styles.achievementDetails}>
                    <Text style={[styles.achievementTitle, unlocked ? { color: Colors.dark.accent } : { color: '#6a5299' }]}>
                      {item.title}
                    </Text>
                    <Text style={styles.achievementDesc}>{item.description}</Text>
                  </View>
                  {unlocked ? (
                    <Text style={styles.badgeLabel}>UNLOCKED</Text>
                  ) : (
                    <Text style={styles.badgeLabelLocked}>LOCKED</Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* API Key Panel */}
          <TouchableOpacity 
            style={styles.apiSettingsButton} 
            onPress={() => setShowKeyField(!showKeyField)}
          >
            <Text style={styles.apiSettingsText}>
              ⚙️ {showKeyField ? 'Hide API Settings' : 'Configure AI Engine (Gemini API)'}
            </Text>
          </TouchableOpacity>

          {showKeyField && (
            <View style={styles.apiKeyContainer}>
              <Text style={styles.apiKeyLabel}>GOOGLE GEMINI API KEY</Text>
              <TextInput
                style={styles.apiKeyInput}
                placeholder="AIzaSy..."
                placeholderTextColor="#6a5299"
                secureTextEntry
                value={apiKey}
                onChangeText={setApiKey}
              />
              <TouchableOpacity style={styles.apiSaveBtn} onPress={handleSaveApiKey}>
                <Text style={styles.apiSaveBtnText}>SAVE API CONFIG</Text>
              </TouchableOpacity>
              {saveStatus ? <Text style={styles.apiSaveStatus}>{saveStatus}</Text> : null}
            </View>
          )}

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
    textShadowColor: Colors.dark.magenta,
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
    backgroundColor: Colors.dark.magenta,
    marginTop: Spacing.two,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 110,
  },
  identityCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: '#4d2b99',
    padding: Spacing.four,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    borderWidth: 3,
    borderColor: Colors.dark.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.dark.magenta,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    marginBottom: Spacing.two,
  },
  avatarLargeText: {
    fontSize: 36,
    color: '#ffffff',
    fontWeight: '900',
  },
  agentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  archetypeTitle: {
    fontSize: 12,
    color: Colors.dark.accent,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: Spacing.half,
  },
  agentEmail: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    marginTop: Spacing.one,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.dark.backgroundElement,
    borderWidth: 1,
    borderColor: '#3a2075',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 9,
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    marginTop: Spacing.half,
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
    color: Colors.dark.accent,
    backgroundColor: '#1d0f3a',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
    marginLeft: Spacing.two,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  diagnosticCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3a2075',
    padding: Spacing.three,
    marginBottom: Spacing.four,
  },
  strengthsWeaknessesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  diagnosticSubBox: {
    flex: 1,
    backgroundColor: '#0f051d',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    borderWidth: 0.5,
    borderColor: '#3a2075',
  },
  diagnosticLabel: {
    fontSize: 11,
    fontWeight: '900',
    marginBottom: Spacing.one,
  },
  diagnosticValueText: {
    color: '#ffffff',
    fontSize: 10,
    lineHeight: 14,
  },
  chartTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.dark.cyan,
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  chartContainer: {
    gap: Spacing.one,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chartRowLabel: {
    width: 110,
    color: '#ffffff',
    fontSize: 11,
  },
  chartBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#0f051d',
    borderRadius: 4,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartRowValue: {
    width: 32,
    fontSize: 10,
    textAlign: 'right',
    fontWeight: 'bold',
  },
  achievementsCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3a2075',
    padding: Spacing.three,
    marginBottom: Spacing.four,
    gap: Spacing.two,
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f051d',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    borderWidth: 0.5,
    borderColor: '#3a2075',
  },
  lockedAchievementRow: {
    opacity: 0.5,
  },
  achievementIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2c124d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  achievementIcon: {
    fontSize: 20,
  },
  achievementDetails: {
    flex: 1,
    marginLeft: Spacing.two,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  achievementDesc: {
    color: Colors.dark.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
  badgeLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: Colors.dark.accent,
    borderColor: Colors.dark.accent,
    borderWidth: 0.5,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: Spacing.one,
  },
  badgeLabelLocked: {
    fontSize: 8,
    fontWeight: '900',
    color: '#6a5299',
    borderColor: '#3a2075',
    borderWidth: 0.5,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: Spacing.one,
  },
  apiSettingsButton: {
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  apiSettingsText: {
    color: Colors.dark.cyan,
    fontSize: 12,
    fontWeight: 'bold',
  },
  apiKeyContainer: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: Colors.dark.cyan,
    marginBottom: Spacing.four,
  },
  apiKeyLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: Spacing.one,
  },
  apiKeyInput: {
    backgroundColor: '#0f051d',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#3a2075',
    marginBottom: Spacing.two,
  },
  apiSaveBtn: {
    backgroundColor: Colors.dark.cyan,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  apiSaveBtnText: {
    color: '#0f051d',
    fontWeight: '900',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  apiSaveStatus: {
    color: Colors.dark.accent,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
});
