import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Animated 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from './_layout';
import { Colors, Spacing, MaxContentWidth } from '../constants/theme';
import { 
  GAME_WORLDS, 
  LEVELS, 
  QUESTION_BANK, 
  DAILY_CHALLENGES, 
  REWARDS, 
  Question 
} from '../data/gameData';
import { aiService } from '../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GameplayScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile, updateProfileStats, setProfileData } = useUser();

  const mode = (params.mode as string) || 'normal';
  const worldId = (params.worldId as string) || 'logic-forest';
  const levelId = parseInt((params.levelId as string) || '1');

  // Find configuration
  const world = GAME_WORLDS.find(w => w.id === worldId) || GAME_WORLDS[0];
  const level = LEVELS.find(l => l.worldId === worldId && l.id === levelId) || {
    id: 1,
    name: 'Standard Challenge',
    worldId: 'logic-forest',
    requiredXp: 0,
    questionsCount: 4,
    timeLimit: 30
  };

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const responseTimeRef = useRef<number>(0);

  // Animations
  const timerAnim = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  // Initialize questions
  useEffect(() => {
    if (profile) {
      initializeQuestions();
    }
    return () => stopTimer();
  }, [profile]);

  // Handle countdown
  useEffect(() => {
    if (loading || completed || isAnswered) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        responseTimeRef.current = level.timeLimit - (prev - 1);
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => stopTimer();
  }, [loading, completed, isAnswered, currentIndex]);

  // Watch timer animation
  useEffect(() => {
    if (isAnswered || completed) {
      timerAnim.stopAnimation();
      return;
    }
    Animated.timing(timerAnim, {
      toValue: timeLeft / level.timeLimit,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, isAnswered]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const initializeQuestions = async () => {
    setLoading(true);
    try {
      if (mode === 'daily') {
        // Daily challenge: select 1 random or generate an AI puzzle
        // Let's generate a dynamic AI puzzle using local generator
        const category = world.categories[Math.floor(Math.random() * world.categories.length)];
        const difficulty = profile!.level >= 5 ? 'hard' : profile!.level >= 3 ? 'medium' : 'easy';
        
        // Check if user has a configured Gemini API key in storage
        const geminiKey = await AsyncStorage.getItem('gemini_api_key');
        const aiPuzzle = await aiService.generateAIPuzzle(category, difficulty, geminiKey || undefined);
        
        setQuestions([aiPuzzle]);
      } else {
        // Normal level: Fetch 4 adaptive questions
        const levelQuestions: Question[] = [];
        const categories = world.categories;

        for (let i = 0; i < level.questionsCount; i++) {
          const cat = categories[i % categories.length];
          // Filter matching category
          const matching = QUESTION_BANK.filter(q => q.category === cat);
          // Get adaptive question based on user profile
          const q = aiService.getAdaptiveQuestion(profile!, cat, matching);
          
          // Prevent exact duplicates within this levels set
          if (!levelQuestions.some(item => item.id === q.id)) {
            levelQuestions.push(q);
          } else {
            // grab another fallback
            const fallback = matching.find(item => !levelQuestions.some(lq => lq.id === item.id)) || q;
            levelQuestions.push(fallback);
          }
        }
        setQuestions(levelQuestions);
      }
    } catch (e) {
      console.error(e);
      // Fallback
      setQuestions([QUESTION_BANK[0]]);
    } finally {
      setLoading(false);
      setTimeLeft(level.timeLimit);
    }
  };

  const handleTimeout = () => {
    stopTimer();
    setSelectedOption(null);
    setIsCorrect(false);
    setIsAnswered(true);
    
    // Save statistic (0 response time counts as max penalty)
    updateProfileStats(
      0, 
      0, 
      questions[currentIndex].category, 
      false, 
      level.timeLimit
    );
  };

  const handleSelectOption = (option: string) => {
    if (isAnswered) return;
    stopTimer();
    setSelectedOption(option);
    
    const correctAns = questions[currentIndex].answer;
    const isAnswerCorrect = option === correctAns;
    
    setIsCorrect(isAnswerCorrect);
    setIsAnswered(true);

    const timeSpent = responseTimeRef.current || 5;

    // Calculate Rewards
    let xpAward = 0;
    let coinAward = 0;

    if (isAnswerCorrect) {
      setCorrectCount(prev => prev + 1);
      if (mode === 'daily') {
        xpAward = REWARDS.DAILY_CHALLENGE_XP;
        coinAward = REWARDS.DAILY_CHALLENGE_COINS;
      } else {
        xpAward = REWARDS.CORRECT_XP;
        coinAward = REWARDS.CORRECT_COINS;
      }
    }

    setXpEarned(prev => prev + xpAward);
    setCoinsEarned(prev => prev + coinAward);

    // Save statistics in User Profile Context
    updateProfileStats(
      xpAward,
      coinAward,
      questions[currentIndex].category,
      isAnswerCorrect,
      timeSpent
    );

    // Bounce Animation on answer
    Animated.sequence([
      Animated.timing(cardScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 1.05, duration: 150, useNativeDriver: true }),
      Animated.timing(cardScale, { toValue: 1, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleNext = async () => {
    setIsAnswered(false);
    setSelectedOption(null);
    
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(level.timeLimit);
    } else {
      // Level Completed!
      setCompleted(true);
      await saveLevelCompletion();
    }
  };

  const saveLevelCompletion = async () => {
    if (!profile) return;
    try {
      const today = new Date().toISOString().split('T')[0];

      if (mode === 'daily') {
        // Mark daily challenge complete
        await AsyncStorage.setItem(`daily_completed_${profile.uid}`, today);
        
        // Update streak if not already updated today
        const lastActive = profile.lastActiveDate;
        let newStreak = profile.streak;
        if (lastActive !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActive === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1; // reset if missed a day
          }
        }
        
        await setProfileData({
          ...profile,
          streak: newStreak,
          lastActiveDate: today
        });
      } else {
        // Calculate stars
        const total = questions.length;
        let stars = 1; // completed gives at least 1 star
        if (correctCount === total) {
          stars = 3;
        } else if (correctCount >= total / 2) {
          stars = 2;
        }

        // Save Stars to storage
        const key = `stars_${profile.uid}_${worldId}_${levelId}`;
        const existing = await AsyncStorage.getItem(key);
        const existingStars = existing ? parseInt(existing) : 0;
        
        if (stars > existingStars) {
          await AsyncStorage.setItem(key, stars.toString());
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.accent} />
        <Text style={styles.loadingText}>Initializing cognitive nodes...</Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];
  
  if (completed) {
    // Calculate Final Stars
    let stars = 1;
    if (correctCount === questions.length) stars = 3;
    else if (correctCount >= questions.length / 2) stars = 2;

    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.completedCard}>
            <Text style={styles.completedEmoji}>🏆</Text>
            <Text style={styles.completedTitle}>
              {mode === 'daily' ? 'DAILY CHALLENGE COMPLETED' : 'CHALLENGE COMPLETE'}
            </Text>
            
            <Text style={styles.completedSubText}>
              {mode === 'daily' 
                ? 'Your analytical faculties are sharp!' 
                : `${level.name} has been conquered.`}
            </Text>

            {mode !== 'daily' && (
              <View style={styles.finalStarsRow}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <Text key={i} style={styles.finalStarIcon}>
                    {i < stars ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.scoreSummaryBox}>
              <Text style={styles.summaryLabel}>ACCURACY: {Math.round((correctCount / questions.length) * 100)}%</Text>
              <Text style={styles.summaryValue}>Correct Answers: {correctCount} / {questions.length}</Text>
              
              <View style={styles.rewardsDivider} />
              
              <View style={styles.rewardsRow}>
                <View style={styles.rewardIndicator}>
                  <Text style={styles.rewardIcon}>⚡</Text>
                  <Text style={styles.rewardText}>+{xpEarned} XP</Text>
                </View>
                <View style={styles.rewardIndicator}>
                  <Text style={styles.rewardIcon}>🪙</Text>
                  <Text style={styles.rewardText}>+{coinsEarned} Coins</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: Colors.dark.accent }]}
              onPress={() => router.replace(mode === 'daily' ? '/' : '/map')}
            >
              <Text style={styles.actionButtonText}>RETURN TO DASHBOARD</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* Game Header */}
        <View style={styles.gameHeader}>
          <View>
            <Text style={styles.headerTitle}>{mode === 'daily' ? 'Daily Codex' : world.name}</Text>
            <Text style={styles.headerSubtitle}>
              {mode === 'daily' ? 'Question 1 of 1' : `Question ${currentIndex + 1} of ${questions.length}`}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.quitButton}
            onPress={() => {
              Alert.alert(
                "Abandon Challenge",
                "Are you sure you want to quit? You will lose any progress from this level.",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Abandon", style: "destructive", onPress: () => router.back() }
                ]
              );
            }}
          >
            <Text style={styles.quitText}>ABANDON</Text>
          </TouchableOpacity>
        </View>

        {/* Timer Bar */}
        <View style={styles.timerBarBg}>
          <Animated.View style={[
            styles.timerBarFill, 
            { 
              transform: [{ scaleX: timerAnim }],
              backgroundColor: timeLeft <= 5 ? Colors.dark.error : Colors.dark.cyan 
            }
          ]} />
        </View>
        <Text style={[styles.timerText, timeLeft <= 5 && { color: Colors.dark.error }]}>
          ⏱ {timeLeft}s remaining
        </Text>

        {/* Question Panel */}
        <ScrollView contentContainerStyle={styles.gameContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.questionCard, { transform: [{ scale: cardScale }] }]}>
            <Text style={styles.categoryLabel}>{currentQuestion.category.toUpperCase()}</Text>
            <Text style={styles.questionText}>{currentQuestion.question}</Text>
          </Animated.View>

          {/* Options List */}
          <View style={styles.optionsList}>
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isOptionCorrect = option === currentQuestion.answer;
              
              let cardStyleState = styles.optionCard;
              let textStyleState = styles.optionText;

              if (isAnswered) {
                if (isOptionCorrect) {
                  cardStyleState = [styles.optionCard, styles.optionCorrectCard];
                  textStyleState = [styles.optionText, styles.optionCorrectText];
                } else if (isSelected) {
                  cardStyleState = [styles.optionCard, styles.optionIncorrectCard];
                  textStyleState = [styles.optionText, styles.optionIncorrectText];
                } else {
                  cardStyleState = [styles.optionCard, styles.optionDisabledCard];
                }
              } else if (isSelected) {
                cardStyleState = [styles.optionCard, styles.optionSelectedCard];
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={cardStyleState}
                  onPress={() => handleSelectOption(option)}
                  disabled={isAnswered}
                >
                  <Text style={textStyleState}>{option}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback Section */}
          {isAnswered && (
            <View style={[
              styles.feedbackBox, 
              isCorrect ? styles.correctFeedbackBox : styles.incorrectFeedbackBox
            ]}>
              <Text style={styles.feedbackTitle}>
                {selectedOption === null 
                  ? '⚡ TIMEOUT!' 
                  : isCorrect 
                    ? '🎉 LOGIC CORRECT!' 
                    : '❌ LOGIC ERROR'}
              </Text>
              
              <Text style={styles.feedbackExplanation}>
                {currentQuestion.explanation}
              </Text>

              {isCorrect && (
                <View style={styles.rewardsRowMini}>
                  <Text style={styles.rewardTextMini}>+ {mode === 'daily' ? 50 : 10} XP</Text>
                  <Text style={styles.rewardTextMini}>+ {mode === 'daily' ? 25 : 5} Coins</Text>
                </View>
              )}

              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentIndex + 1 < questions.length ? 'NEXT PUZZLE' : 'FINALIZE LEVEL'}
                </Text>
              </TouchableOpacity>
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
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: Spacing.three,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    marginTop: 2,
  },
  quitButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#ff007f',
  },
  quitText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ff007f',
  },
  timerBarBg: {
    height: 6,
    width: '100%',
    backgroundColor: '#16092d',
  },
  timerBarFill: {
    height: '100%',
    width: '100%',
    transformOrigin: 'left',
  },
  timerText: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingRight: Spacing.three,
    marginTop: Spacing.one,
  },
  gameContent: {
    padding: Spacing.three,
    paddingBottom: 50,
  },
  questionCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: '#3a2075',
    marginBottom: Spacing.three,
  },
  categoryLabel: {
    color: Colors.dark.accent,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
  },
  questionText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 22,
    fontWeight: 'bold',
  },
  optionsList: {
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  optionCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: '#3a2075',
  },
  optionSelectedCard: {
    borderColor: Colors.dark.accent,
    backgroundColor: '#2c124d',
  },
  optionCorrectCard: {
    borderColor: Colors.dark.green,
    backgroundColor: '#0c2613',
  },
  optionIncorrectCard: {
    borderColor: Colors.dark.error,
    backgroundColor: '#2e0a0d',
  },
  optionDisabledCard: {
    opacity: 0.5,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 14,
  },
  optionCorrectText: {
    color: Colors.dark.green,
    fontWeight: 'bold',
  },
  optionIncorrectText: {
    color: Colors.dark.error,
    fontWeight: 'bold',
  },
  feedbackBox: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  correctFeedbackBox: {
    backgroundColor: '#0c2613',
    borderColor: Colors.dark.green,
  },
  incorrectFeedbackBox: {
    backgroundColor: '#2e0a0d',
    borderColor: Colors.dark.error,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
    marginBottom: Spacing.one,
  },
  feedbackExplanation: {
    fontSize: 12,
    color: '#ffffff',
    lineHeight: 16,
    opacity: 0.9,
  },
  rewardsRowMini: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  rewardTextMini: {
    color: Colors.dark.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  nextButton: {
    backgroundColor: '#ffffff',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  nextButtonText: {
    color: '#0f051d',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  completedCard: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.four,
    borderWidth: 2,
    borderColor: Colors.dark.accent,
    padding: Spacing.four,
    alignItems: 'center',
    margin: Spacing.three,
    marginTop: Spacing.six,
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: Spacing.two,
  },
  completedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
  },
  completedSubText: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.one,
    marginBottom: Spacing.three,
  },
  finalStarsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  finalStarIcon: {
    fontSize: 32,
  },
  scoreSummaryBox: {
    width: '100%',
    backgroundColor: '#16092d',
    borderRadius: Spacing.three,
    borderWidth: 1,
    borderColor: '#3a2075',
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: Colors.dark.cyan,
  },
  summaryValue: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.8,
    marginTop: Spacing.one,
  },
  rewardsDivider: {
    width: '60%',
    height: 1,
    backgroundColor: '#3a2075',
    marginVertical: Spacing.two,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: Spacing.five,
  },
  rewardIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  rewardIcon: {
    fontSize: 18,
  },
  rewardText: {
    color: Colors.dark.accent,
    fontSize: 14,
    fontWeight: '900',
  },
  actionButton: {
    width: '100%',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#0f051d',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
