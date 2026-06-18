import { Question, QUESTION_BANK } from '../data/gameData';
import { UserProfile } from '../config/firebase';

export interface CognitiveProfile {
  archetype: string;
  strengths: { category: string; score: number }[];
  weaknesses: { category: string; score: number }[];
  overallRating: number; // 0 - 100
  averageSpeed: number; // seconds
}

export const aiService = {
  /**
   * Adaptive Difficulty Engine:
   * Selects a question matching the world/category, but dynamically adjusts the difficulty (easy, medium, hard)
   * based on the user's accuracy and response speed in that category.
   */
  getAdaptiveQuestion: (userProfile: UserProfile, category: string, worldQuestions: Question[]): Question => {
    const stats = userProfile.analytics.categoryStats[category];
    
    let targetDifficulty: 'easy' | 'medium' | 'hard' = 'easy';

    if (stats && stats.total > 0) {
      const accuracy = (stats.correct / stats.total) * 100;
      
      // Heuristic for adaptive scale
      if (accuracy >= 80 && stats.total >= 2) {
        targetDifficulty = 'hard';
      } else if (accuracy >= 50 && stats.total >= 1) {
        targetDifficulty = 'medium';
      } else {
        targetDifficulty = 'easy';
      }
    } else {
      // Default based on general user level
      if (userProfile.level >= 5) {
        targetDifficulty = 'hard';
      } else if (userProfile.level >= 3) {
        targetDifficulty = 'medium';
      } else {
        targetDifficulty = 'easy';
      }
    }

    // Filter questions matching category and difficulty
    let pool = worldQuestions.filter(q => q.category === category && q.difficulty === targetDifficulty);
    
    // Fallback if no questions match that specific difficulty
    if (pool.length === 0) {
      pool = worldQuestions.filter(q => q.category === category);
    }
    
    if (pool.length === 0) {
      // Absolute fallback from the global bank
      pool = QUESTION_BANK.filter(q => q.category === category);
    }

    // Return a random question from the filtered pool
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex] || QUESTION_BANK[0];
  },

  /**
   * Generates a personalized learning path recommendation list.
   */
  getPersonalizedLearningPath: (userProfile: UserProfile): string[] => {
    const recommendations: string[] = [];
    const stats = userProfile.analytics.categoryStats;
    const categories = [
      'Logical Reasoning',
      'Number Series',
      'Pattern Recognition',
      'Coding-Decoding',
      'Analytical Thinking',
      'Visual Puzzles',
      'Memory Challenges',
      'Riddles'
    ];

    // Identify weak categories
    const performanceList = categories.map(cat => {
      const catStat = stats[cat];
      const acc = catStat && catStat.total > 0 ? (catStat.correct / catStat.total) * 100 : -1; // -1 means unplayed
      return { cat, acc, total: catStat?.total || 0 };
    });

    // Sort by played but lowest accuracy first
    const played = performanceList.filter(item => item.acc >= 0).sort((a, b) => a.acc - b.acc);
    const unplayed = performanceList.filter(item => item.acc === -1);

    if (played.length > 0 && played[0].acc < 60) {
      recommendations.push(
        `Focus on "${played[0].cat}": Your accuracy is currently ${Math.round(played[0].acc)}%. Practice more in its corresponding world to strengthen your synapses.`
      );
    }

    if (unplayed.length > 0) {
      // Recommend exploring new categories
      recommendations.push(
        `Explore new frontiers: You haven't attempted "${unplayed[0].cat}" yet. Open its world and give it a try!`
      );
    }

    if (played.length > 1 && played[1].acc < 75) {
      recommendations.push(
        `Boost "${played[1].cat}": You're close to mastering this! Solve 3 correct questions in a row to level up your ranking.`
      );
    }

    // Default general advice
    if (recommendations.length === 0) {
      recommendations.push("You are performing exceptionally across all categories! Try Quantum Space or Kingdom of Intelligence to test your limits.");
      recommendations.push("Maintain your daily streak to earn bonus multiplier coins (+25 coins daily).");
    }

    return recommendations;
  },

  /**
   * Computes a detailed cognitive profile including strengths, weaknesses, overall rating, and a title.
   */
  getPerformanceAnalytics: (userProfile: UserProfile): CognitiveProfile => {
    const stats = userProfile.analytics.categoryStats;
    const categories = [
      'Logical Reasoning',
      'Number Series',
      'Pattern Recognition',
      'Coding-Decoding',
      'Analytical Thinking',
      'Visual Puzzles',
      'Memory Challenges',
      'Riddles'
    ];

    const categoryScores = categories.map(cat => {
      const catStat = stats[cat];
      const score = catStat && catStat.total > 0 ? (catStat.correct / catStat.total) * 100 : 50; // default to 50% for neutral
      return { category: cat, score: Math.round(score), played: catStat ? catStat.total > 0 : false };
    });

    // Sort to determine strengths and weaknesses
    const sorted = [...categoryScores].sort((a, b) => b.score - a.score);
    
    // If no questions have been answered, strengths/weaknesses are default
    const hasPlayed = categoryScores.some(c => c.played);

    const strengths = hasPlayed 
      ? sorted.slice(0, 2).map(s => ({ category: s.category, score: s.score }))
      : [{ category: 'Logical Reasoning', score: 50 }, { category: 'Analytical Thinking', score: 50 }];

    const weaknesses = hasPlayed
      ? sorted.slice(-2).reverse().map(w => ({ category: w.category, score: w.score }))
      : [{ category: 'Coding-Decoding', score: 50 }, { category: 'Visual Puzzles', score: 50 }];

    // Archetype assignment based on top category
    let archetype = 'Intrepid Thinker';
    if (hasPlayed) {
      const topCategory = sorted[0].category;
      if (topCategory === 'Logical Reasoning' || topCategory === 'Analytical Thinking') {
        archetype = 'Deductive Strategist';
      } else if (topCategory === 'Number Series' || topCategory === 'Pattern Recognition') {
        archetype = 'Pattern Matrix Titan';
      } else if (topCategory === 'Coding-Decoding') {
        archetype = 'Cryptic Ciphermaster';
      } else if (topCategory === 'Riddles') {
        archetype = 'Esoteric Sage';
      } else if (topCategory === 'Visual Puzzles' || topCategory === 'Memory Challenges') {
        archetype = 'Quantum Visionary';
      }
    }

    // Overall accuracy
    const overallRating = userProfile.analytics.totalAnswered > 0
      ? Math.round((userProfile.analytics.correctAnswered / userProfile.analytics.totalAnswered) * 100)
      : 0;

    // Average response time
    const responseTimes = userProfile.analytics.recentResponseTimes || [];
    const averageSpeed = responseTimes.length > 0
      ? parseFloat((responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1))
      : 0;

    return {
      archetype,
      strengths,
      weaknesses,
      overallRating,
      averageSpeed
    };
  },

  /**
   * AI generated puzzles.
   * Can use the user's Gemini API key if provided.
   * Otherwise, generates a procedurally generated local logic/coding puzzle.
   */
  generateAIPuzzle: async (
    category: string, 
    difficulty: 'easy' | 'medium' | 'hard', 
    apiKey?: string
  ): Promise<Question> => {
    if (apiKey) {
      try {
        console.log(`Connecting to Gemini to generate: Category = ${category}, Difficulty = ${difficulty}...`);
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate a multiple-choice reasoning question in JSON format.
                       Category: "${category}".
                       Difficulty: "${difficulty}".
                       Requirements:
                       - 4 options.
                       - Clear question.
                       - Exact answer (one of the options).
                       - A 1-2 sentence logical explanation.
                       Output strictly in JSON matching this interface:
                       {
                         "question": "string",
                         "options": ["string", "string", "string", "string"],
                         "answer": "string",
                         "explanation": "string"
                       }
                       Do NOT return markdown wrapper. Return raw JSON only.`
              }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        const parsed = JSON.parse(text);

        return {
          id: 'ai_' + Math.random().toString(36).substring(2, 9),
          category,
          difficulty,
          question: parsed.question,
          options: parsed.options,
          answer: parsed.answer,
          explanation: parsed.explanation
        };
      } catch (err) {
        console.warn("Failed to generate with live Gemini API, falling back to local generator.", err);
      }
    }

    // Procedural local fallback generator
    // Generates a simple, elegant math/coding sequence dynamically
    const id = 'local_ai_' + Math.random().toString(36).substring(2, 9);
    
    if (category === 'Number Series' || category === 'Pattern Recognition') {
      const start = Math.floor(Math.random() * 10) + 1;
      const step = Math.floor(Math.random() * 5) + 2;
      const term1 = start;
      const term2 = start + step;
      const term3 = start + step * 2;
      const term4 = start + step * 3;
      const term5 = start + step * 4;
      const correct = start + step * 5;

      return {
        id,
        category: 'Number Series',
        difficulty,
        question: `Find the next value in the arithmetic sequence generated by AI: ${term1}, ${term2}, ${term3}, ${term4}, ${term5}, ...`,
        options: [
          correct.toString(),
          (correct + step).toString(),
          (correct - 2).toString(),
          (correct + 5).toString()
        ].sort(() => Math.random() - 0.5),
        answer: correct.toString(),
        explanation: `This is an arithmetic progression with a common difference of +${step}. The next term is ${term5} + ${step} = ${correct}.`
      };
    } else if (category === 'Coding-Decoding') {
      // Pick a random word and encode it
      const words = ['MIND', 'CODE', 'GAME', 'LOGIC', 'INTEL'];
      const word = words[Math.floor(Math.random() * words.length)];
      const shift = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : -1;
      
      const encode = (w: string, s: number) => {
        return w.split('').map(char => {
          const code = char.charCodeAt(0);
          return String.fromCharCode(((code - 65 + s + 26) % 26) + 65);
        }).join('');
      };

      const encoded = encode(word, shift);
      const testWord = difficulty === 'easy' ? 'BRAIN' : 'THINK';
      const testEncoded = encode(testWord, shift);

      return {
        id,
        category: 'Coding-Decoding',
        difficulty,
        question: `If in a secret AI code, "${word}" is encrypted as "${encoded}". How would the word "${testWord}" be encrypted?`,
        options: [
          testEncoded,
          encode(testWord, shift + 1),
          encode(testWord, shift - 1),
          testWord.split('').reverse().join('')
        ].sort(() => Math.random() - 0.5),
        answer: testEncoded,
        explanation: `Each letter of the word is shifted alphabetically by ${shift} positions. Applying this to "${testWord}" yields "${testEncoded}".`
      };
    } else {
      // General reasoning puzzle
      const valueA = Math.floor(Math.random() * 5) + 3; // e.g. 5
      const valueB = Math.floor(Math.random() * 4) + 2; // e.g. 3
      const total = valueA + valueB;
      const diff = valueA - valueB;

      return {
        id,
        category: 'Analytical Thinking',
        difficulty,
        question: `The sum of two secret numbers is ${total}, and their difference is ${diff}. What is the larger of the two numbers?`,
        options: [
          valueA.toString(),
          valueB.toString(),
          (valueA + 2).toString(),
          (total).toString()
        ].sort(() => Math.random() - 0.5),
        answer: valueA.toString(),
        explanation: `Let the numbers be x and y. x + y = ${total} and x - y = ${diff}. Adding the equations gives 2x = ${total + diff}, so x = ${valueA}.`
      };
    }
  }
};
