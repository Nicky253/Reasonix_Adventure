import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../_layout';
import { Colors, Spacing, MaxContentWidth } from '../../constants/theme';
import { database } from '../../config/firebase';

interface LeaderboardEntry {
  uid: string;
  name: string;
  score: number;
  levelTitle: string;
}

export default function LeaderboardScreen() {
  const { profile, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState<'global' | 'weekly' | 'friends'>('global');
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchRanks();
    }
  }, [profile, activeTab]);

  const fetchRanks = async () => {
    setLoading(true);
    try {
      const list = await database.getLeaderboard();
      
      // Post-filtering for tabs
      if (activeTab === 'weekly') {
        const weeklyList = list.map((item, idx) => ({
          ...item,
          score: Math.round(item.score * (idx % 2 === 0 ? 0.8 : 0.65))
        })).sort((a, b) => b.score - a.score);
        setLeaders(weeklyList);
      } else if (activeTab === 'friends') {
        const friendsList = list.filter(item => 
          item.uid === profile?.uid || item.uid === 'cpu2' || item.uid === 'cpu4'
        );
        setLeaders(friendsList);
      } else {
        setLeaders(list);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
      </View>
    );
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return Colors.dark.accent;
    if (rank === 2) return '#d7d7d7';
    if (rank === 3) return '#ad6f32';
    return '#ffffff';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LEADERBOARD</Text>
          <Text style={styles.headerSubtitle}>Elite Logical Intelligence Rankings</Text>
          <View style={styles.accentLine} />
        </View>

        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          {(['global', 'weekly', 'friends'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Rankings List */}
        {loading ? (
          <View style={styles.loadingInnerContainer}>
            <ActivityIndicator size="large" color={Colors.dark.cyan} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {leaders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No rankings found in this quadrant.</Text>
              </View>
            ) : (
              leaders.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.uid === profile.uid;

                return (
                  <View
                    key={entry.uid}
                    style={[
                      styles.rankRow,
                      isCurrentUser && styles.currentUserRow
                    ]}
                  >
                    {/* Rank Badge */}
                    <View style={styles.rankBadgeContainer}>
                      <Text style={[styles.rankBadgeText, { color: getRankColor(rank) }]}>
                        {getRankBadge(rank)}
                      </Text>
                    </View>

                    {/* Profile detail */}
                    <View style={styles.detailContainer}>
                      <Text style={[styles.userName, isCurrentUser && styles.currentUserText]}>
                        {entry.name} {isCurrentUser && '(You)'}
                      </Text>
                      <Text style={styles.userTitle}>{entry.levelTitle}</Text>
                    </View>

                    {/* Score badge */}
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>{entry.score.toLocaleString()} XP</Text>
                    </View>

                  </View>
                );
              })
            )}
          </ScrollView>
        )}

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
  loadingInnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    textShadowColor: Colors.dark.cyan,
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
    backgroundColor: Colors.dark.cyan,
    marginTop: Spacing.two,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.backgroundElement,
    marginHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    padding: Spacing.one,
    borderWidth: 1,
    borderColor: '#3a2075',
    marginBottom: Spacing.two,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderRadius: Spacing.two,
  },
  activeTabButton: {
    backgroundColor: '#2c124d',
    borderWidth: 1,
    borderColor: Colors.dark.accent,
  },
  tabText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: Colors.dark.accent,
  },
  scrollContent: {
    padding: Spacing.three,
    paddingBottom: 110,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: Spacing.five,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: '#3a2075',
  },
  currentUserRow: {
    borderColor: Colors.dark.cyan,
    backgroundColor: '#16092d',
    shadowColor: Colors.dark.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  rankBadgeContainer: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadgeText: {
    fontSize: 16,
    fontWeight: '900',
  },
  detailContainer: {
    flex: 1,
    marginLeft: Spacing.two,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  currentUserText: {
    color: Colors.dark.cyan,
  },
  userTitle: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  scoreContainer: {
    paddingHorizontal: Spacing.three,
  },
  scoreText: {
    color: Colors.dark.accent,
    fontSize: 13,
    fontWeight: '900',
  },
});
