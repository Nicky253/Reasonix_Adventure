import React, { createContext, useContext, useState, useEffect } from 'react';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { View, ActivityIndicator, useColorScheme, StyleSheet, StatusBar } from 'react-native';
import { auth, database, UserProfile } from '../config/firebase';
import AuthScreen from './auth';
import { Colors } from '../constants/theme';

interface UserContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfileStats: (xpGained: number, coinsGained: number, category: string, isCorrect: boolean, responseTime: number) => Promise<void>;
  setProfileData: (profile: UserProfile) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default function RootLayout() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'light' ? 'light' : 'dark'];

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setProfileLoading(true);
        try {
          const userProfile = await database.getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } catch (error) {
          console.error("Error fetching user profile", error);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (user) {
      try {
        const userProfile = await database.getUserProfile(user.uid);
        setProfile(userProfile);
      } catch (error) {
        console.error("Error refreshing profile", error);
      }
    }
  };

  /**
   * Main gameplay rewards/stats updater
   */
  const updateProfileStats = async (
    xpGained: number, 
    coinsGained: number, 
    category: string, 
    isCorrect: boolean,
    responseTime: number
  ) => {
    if (!user || !profile) return;

    // Deep copy current analytics
    const newAnalytics = { ...profile.analytics };
    newAnalytics.totalAnswered += 1;
    if (isCorrect) {
      newAnalytics.correctAnswered += 1;
    }
    
    // Update accuracy
    newAnalytics.accuracy = parseFloat(
      ((newAnalytics.correctAnswered / newAnalytics.totalAnswered) * 100).toFixed(1)
    );

    // Update category stats
    if (!newAnalytics.categoryStats[category]) {
      newAnalytics.categoryStats[category] = { total: 0, correct: 0 };
    }
    newAnalytics.categoryStats[category].total += 1;
    if (isCorrect) {
      newAnalytics.categoryStats[category].correct += 1;
    }

    // Update response times
    const times = [...(newAnalytics.recentResponseTimes || [])];
    times.push(responseTime);
    if (times.length > 10) times.shift();
    newAnalytics.recentResponseTimes = times;

    // Calculate new XP and level progression
    const newXp = profile.xp + xpGained;
    const newCoins = profile.coins + coinsGained;
    
    let newLevel = 1;
    let newTitle = 'Beginner Thinker';

    if (newXp >= 3000) {
      newLevel = 7;
      newTitle = 'Grand Genius';
    } else if (newXp >= 2000) {
      newLevel = 6;
      newTitle = 'Reasonix Champion';
    } else if (newXp >= 1400) {
      newLevel = 5;
      newTitle = 'Mind Warrior';
    } else if (newXp >= 900) {
      newLevel = 4;
      newTitle = 'Strategy Master';
    } else if (newXp >= 500) {
      newLevel = 3;
      newTitle = 'Puzzle Solver';
    } else if (newXp >= 200) {
      newLevel = 2;
      newTitle = 'Logic Explorer';
    }

    // Achievements unlocking logic
    const newAchievements = [...profile.achievements];
    const achievementMap: { [key: string]: string } = {
      2: 'Logic Explorer',
      3: 'Puzzle Solver',
      4: 'Strategy Master',
      5: 'Mind Warrior',
      7: 'Grand Genius'
    };

    const potentialBadge = achievementMap[newLevel];
    if (potentialBadge && !newAchievements.includes(potentialBadge)) {
      newAchievements.push(potentialBadge);
    }

    const updatedProfile: UserProfile = {
      ...profile,
      xp: newXp,
      coins: newCoins,
      level: newLevel,
      levelTitle: newTitle,
      achievements: newAchievements,
      analytics: newAnalytics
    };

    setProfile(updatedProfile);
    await database.setUserProfile(user.uid, updatedProfile);
  };

  const setProfileData = async (updatedProfile: UserProfile) => {
    if (!user) return;
    setProfile(updatedProfile);
    await database.setUserProfile(user.uid, updatedProfile);
  };

  if (loading || profileLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#0f051d" />
      <UserContext.Provider value={{ user, profile, loading, refreshProfile, updateProfileStats, setProfileData }}>
        {user ? (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="levels" options={{ headerShown: false }} />
            <Stack.Screen name="gameplay" options={{ headerShown: false }} />
          </Stack>
        ) : (
          <AuthScreen />
        )}
      </UserContext.Provider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
