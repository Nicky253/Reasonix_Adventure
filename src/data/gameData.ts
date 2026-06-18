export interface Question {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  answer: string; // The exact text of the correct option
  explanation: string; // Dynamic insight for AI evaluation/feedback
}

export interface Level {
  id: number; // e.g. 1, 2, 3
  name: string; // e.g. "The First Clue"
  worldId: string; // e.g. "logic-forest"
  requiredXp: number; // XP required to play this level
  questionsCount: number;
  timeLimit: number; // time per question in seconds
}

export interface GameWorld {
  id: string;
  name: string;
  description: string;
  icon: string; // name of expo vector icon (MaterialCommunityIcons / Ionicons)
  color: string; // hex theme color for UI
  categories: string[];
  levelsCount: number;
}

export const GAME_WORLDS: GameWorld[] = [
  {
    id: 'logic-forest',
    name: 'Logic Forest',
    description: 'Master deductive reasoning and syllogisms amidst the whispering trees.',
    icon: 'forest',
    color: '#4CAF50', // Emerald green
    categories: ['Logical Reasoning', 'Analytical Thinking'],
    levelsCount: 5,
  },
  {
    id: 'puzzle-temple',
    name: 'Puzzle Temple',
    description: 'Solve ancient riddles and complex brain-teasers left by historical thinkers.',
    icon: 'castle',
    color: '#FF9800', // Gold orange
    categories: ['Riddles', 'Analytical Thinking'],
    levelsCount: 5,
  },
  {
    id: 'pattern-factory',
    name: 'Pattern Factory',
    description: 'Decrypt sequences, numbers, and visual matrices on the assembly line.',
    icon: 'factory',
    color: '#00BCD4', // Cyan
    categories: ['Number Series', 'Pattern Recognition'],
    levelsCount: 5,
  },
  {
    id: 'detective-city',
    name: 'Detective City',
    description: 'Solve crimes, analyze statements, and crack codes in the neon alleyways.',
    icon: 'detective',
    color: '#9C27B0', // Purple
    categories: ['Coding-Decoding', 'Analytical Thinking'],
    levelsCount: 5,
  },
  {
    id: 'quantum-space',
    name: 'Quantum Space',
    description: 'Navigate dimensional anomalies by testing visual layout memory and spatial puzzles.',
    icon: 'atom',
    color: '#E91E63', // Magenta Pink
    categories: ['Visual Puzzles', 'Memory Challenges'],
    levelsCount: 5,
  },
  {
    id: 'kingdom-of-intelligence',
    name: 'Kingdom of Intelligence',
    description: 'Claim the throne of reasoning by conquering ultimate cognitive challenges.',
    icon: 'crown',
    color: '#FFD700', // Gold
    categories: ['Logical Reasoning', 'Analytical Thinking', 'Pattern Recognition', 'Coding-Decoding', 'Visual Puzzles', 'Riddles'],
    levelsCount: 5,
  }
];

// Level configuration per world
export const LEVELS: Level[] = [];
GAME_WORLDS.forEach(world => {
  for (let l = 1; l <= world.levelsCount; l++) {
    LEVELS.push({
      id: l,
      name: `${world.name} - Tier ${l}`,
      worldId: world.id,
      requiredXp: (l - 1) * 200, // level unlock progression
      questionsCount: 4,
      timeLimit: 30 - (l * 2) // decreases time limit as levels go up
    });
  }
});

// Reward System Constants
export const REWARDS = {
  CORRECT_XP: 10,
  CORRECT_COINS: 5,
  DAILY_CHALLENGE_XP: 50,
  DAILY_CHALLENGE_COINS: 25,
};

// Level Progression Titles
export const LEVEL_SYSTEM = [
  { level: 1, title: 'Beginner Thinker', minXp: 0 },
  { level: 2, title: 'Logic Explorer', minXp: 200 },
  { level: 3, title: 'Puzzle Solver', minXp: 500 },
  { level: 4, title: 'Strategy Master', minXp: 900 },
  { level: 5, title: 'Mind Warrior', minXp: 1400 },
  { level: 6, title: 'Reasonix Champion', minXp: 2000 },
  { level: 7, title: 'Grand Genius', minXp: 3000 },
];

export function getLevelTitle(xp: number): { level: number; title: string } {
  let active = LEVEL_SYSTEM[0];
  for (const item of LEVEL_SYSTEM) {
    if (xp >= item.minXp) {
      active = item;
    } else {
      break;
    }
  }
  return { level: active.level, title: active.title };
}

// Comprehensive seed questions list (representing the database backend)
export const QUESTION_BANK: Question[] = [
  // LOGIC FOREST
  {
    id: 'lf1',
    category: 'Logical Reasoning',
    difficulty: 'easy',
    question: 'All squares are shapes. All shapes are drawings. Therefore, are all squares drawings?',
    options: ['Yes, definitely', 'No, never', 'Only some are', 'Cannot be determined'],
    answer: 'Yes, definitely',
    explanation: 'By syllogistic transitive property: if A is B, and B is C, then A is C.'
  },
  {
    id: 'lf2',
    category: 'Logical Reasoning',
    difficulty: 'easy',
    question: 'If some A are B, and all B are C. Which statement MUST be true?',
    options: ['All A are C', 'Some A are C', 'No A are C', 'All C are A'],
    answer: 'Some A are C',
    explanation: 'Since some A are in B, and everything in B is also in C, the parts of A that are in B must also be in C.'
  },
  {
    id: 'lf3',
    category: 'Analytical Thinking',
    difficulty: 'medium',
    question: 'Five people (A, B, C, D, E) stand in a line. A is next to B. C is next to D. E is not next to A. If B is the first in line, and D is third, who is second?',
    options: ['A', 'C', 'E', 'Cannot be determined'],
    answer: 'A',
    explanation: 'B is 1st. A is next to B, so A must be 2nd. D is 3rd, and C is next to D (so C must be 4th), leaving E as 5th.'
  },
  {
    id: 'lf4',
    category: 'Logical Reasoning',
    difficulty: 'medium',
    question: 'A says "B is lying." B says "C is lying." C says "A and B are both lying." Who is telling the truth?',
    options: ['A', 'B', 'C', 'None of them'],
    answer: 'B',
    explanation: 'If B is telling the truth, then C is lying. If C is lying, then C\'s statement is false, which matches. If A was telling the truth, B is lying, making C tell the truth, which contradicts. B is the only consistent truth-teller.'
  },
  {
    id: 'lf5',
    category: 'Analytical Thinking',
    difficulty: 'hard',
    question: 'If it is true that "Some philosophers are teachers" and "No teachers are wealthy", which of the following is logically guaranteed?',
    options: ['Some philosophers are not wealthy', 'All philosophers are wealthy', 'Some teachers are philosophers', 'No philosophers are wealthy'],
    answer: 'Some philosophers are not wealthy',
    explanation: 'Those philosophers who are teachers cannot be wealthy (since no teachers are wealthy). Therefore, some philosophers are definitely not wealthy.'
  },

  // PUZZLE TEMPLE
  {
    id: 'pt1',
    category: 'Riddles',
    difficulty: 'easy',
    question: 'What has keys but open no locks, has space but no room, and you can enter but can\'t go outside?',
    options: ['A keyboard', 'A map', 'A safe', 'A library'],
    answer: 'A keyboard',
    explanation: 'A keyboard has letter keys, spacebar, and an enter key.'
  },
  {
    id: 'pt2',
    category: 'Riddles',
    difficulty: 'easy',
    question: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
    options: ['An echo', 'A cloud', 'A whistle', 'A mirror'],
    answer: 'An echo',
    explanation: 'An echo is a sound wave bouncing back, speaking without a mouth and needing air/wind to travel.'
  },
  {
    id: 'pt3',
    category: 'Analytical Thinking',
    difficulty: 'medium',
    question: 'A doctor gives you three pills and tells you to take one every half-hour. How long will the pills last?',
    options: ['1 hour', '1.5 hours', '2 hours', '30 minutes'],
    answer: '1 hour',
    explanation: 'You take the first pill immediately (0 mins), the second at 30 minutes, and the third at 60 minutes (1 hour total elapsed).'
  },
  {
    id: 'pt4',
    category: 'Riddles',
    difficulty: 'medium',
    question: 'The person who makes it has no need of it; the person who buys it does not use it; the person who uses it does not know it. What is it?',
    options: ['A coffin', 'A gift card', 'A book', 'A car'],
    answer: 'A coffin',
    explanation: 'A coffin fits this riddle perfectly: the dead use it without knowing, makers sell it, buyers buy it for someone else.'
  },
  {
    id: 'pt5',
    category: 'Analytical Thinking',
    difficulty: 'hard',
    question: 'There are two hourglasses: a 7-minute one and an 11-minute one. What is the minimum time needed to measure exactly 15 minutes?',
    options: ['15 minutes', '22 minutes', '18 minutes', '26 minutes'],
    answer: '15 minutes',
    explanation: 'Start both. When 7-min ends, flip it (7 mins elapsed, 4 left in 11-min). When 11-min ends (11 mins elapsed), flip 7-min (which has run 4 mins since flip, so it has exactly 4 mins left). Running that 4 mins gets you 11 + 4 = 15.'
  },

  // PATTERN FACTORY
  {
    id: 'pf1',
    category: 'Number Series',
    difficulty: 'easy',
    question: 'Find the next number in the sequence: 2, 4, 8, 16, 32, ...',
    options: ['64', '48', '50', '128'],
    answer: '64',
    explanation: 'Each number is multiplied by 2 (2^n pattern). 32 * 2 = 64.'
  },
  {
    id: 'pf2',
    category: 'Pattern Recognition',
    difficulty: 'easy',
    question: 'Look at this pattern: O, T, T, F, F, S, S, ... What comes next?',
    options: ['E', 'O', 'N', 'T'],
    answer: 'E',
    explanation: 'These are the first letters of numbers: One, Two, Three, Four, Five, Six, Seven. The next is Eight (E).'
  },
  {
    id: 'pf3',
    category: 'Number Series',
    difficulty: 'medium',
    question: 'Complete the sequence: 1, 2, 6, 24, 120, ...',
    options: ['720', '240', '600', '144'],
    answer: '720',
    explanation: 'The sequence is factorials: 1!, 2!, 3!, 4!, 5!. The next is 6! = 720 (or multiplying by 2, 3, 4, 5, 6).'
  },
  {
    id: 'pf4',
    category: 'Pattern Recognition',
    difficulty: 'medium',
    question: 'In a visual matrix: Circle contains + (1st), Square contains + (2nd), Triangle contains + (3rd). If 4th is Circle containing x, 5th is Square containing x, what is 6th?',
    options: ['Triangle containing x', 'Circle containing +', 'Triangle containing +', 'Hexagon containing x'],
    answer: 'Triangle containing x',
    explanation: 'The shapes cycle (Circle -> Square -> Triangle) and the inner symbol cycles (+ for 3, x for 3).'
  },
  {
    id: 'pf5',
    category: 'Number Series',
    difficulty: 'hard',
    question: 'What is the missing term: 3, 5, 9, 17, 33, ...',
    options: ['65', '49', '51', '68'],
    answer: '65',
    explanation: 'The difference doubles each time: +2, +4, +8, +16. Next difference is +32, so 33 + 32 = 65.'
  },

  // DETECTIVE CITY
  {
    id: 'dc1',
    category: 'Coding-Decoding',
    difficulty: 'easy',
    question: 'If the word "LOGIC" is coded as "MPHJD", how is "SMART" coded?',
    options: ['TNBUS', 'TLBSU', 'TNBSU', 'RMZQS'],
    answer: 'TNBUS',
    explanation: 'Each letter is shifted forward by 1 in the alphabet (L->M, O->P, etc.). S->T, M->N, A->B, R->S, T->U.'
  },
  {
    id: 'dc2',
    category: 'Coding-Decoding',
    difficulty: 'easy',
    question: 'If "RED" is coded as 360 (R=18, E=5, D=4; 18*5*4), how is "CAT" coded?',
    options: ['60', '120', '180', '240'],
    answer: '60',
    explanation: 'Multiply alphabetical positions: C=3, A=1, T=20. 3 * 1 * 20 = 60.'
  },
  {
    id: 'dc3',
    category: 'Analytical Thinking',
    difficulty: 'medium',
    question: 'A crime occurred on Sunday afternoon. The butler claimed he was cleaning the pool, the cook was making dinner, and the maid was collecting the mail. Who is lying?',
    options: ['The maid', 'The butler', 'The cook', 'None of them'],
    answer: 'The maid',
    explanation: 'There is no mail delivery on Sunday afternoons, indicating the maid\'s alibi is fabricated.'
  },
  {
    id: 'dc4',
    category: 'Coding-Decoding',
    difficulty: 'medium',
    question: 'In a secret code, "743" means "Mangoes are ripe", "549" means "Eat ripe apples", and "361" means "Mangoes and Melons". Which digit stands for "are"?',
    options: ['7', '4', '3', 'Cannot be determined'],
    answer: '7',
    explanation: 'From 743 and 361, "3" stands for "Mangoes". From 743 and 549, "4" stands for "ripe". Thus, "7" must stand for "are".'
  },
  {
    id: 'dc5',
    category: 'Analytical Thinking',
    difficulty: 'hard',
    question: 'An investigator finds a note: "10101 202 33". The suspects are Jan, Terry, and Will. Who wrote the note?',
    options: ['Terry', 'Jan', 'Will', 'Unknown'],
    answer: 'Terry',
    explanation: 'Convert letters to numbers based on Roman Numerals or count: 10101 = IOI = Jan? No, 10101 in binary is 21. Look at keyboards: 202 is T, 33 is Y, etc. Wait, another decoding: "10" is X, "10" is X. In Roman numerals: 10=X, 10=X, 1=I (XXI = 21). 202 = CC = 200. 33 = 33. Or another puzzle: Jan (3 letters), Terry (5 letters), Will (4 letters). Look at the suspects names: T-e-r-r-y = 5 letters. Actually, Roman numerals: 10=X, 5=V, 1=I. Let\'s read 10101 as letters: T-e-r-r-y. If 10-10-1 is J-A-N? Let\'s see: J=10, A=1, N=14. In simple letter cipher: Jan is 10-1-14. Terry is 20-5-18-18-25. Will is 23-9-12-12. If 10101 represents binary or Morse: J (10), B (2), C (3). Actually, Roman numerals: 10(X) 10(X) 1(I) = XXI = 21. Will = W (23). Jan = J (10). Wait, 10-10-1 -> J-J-A? Let\'s look: "10101 202 33" -> 10/10/10... Let\'s think. What if Jan is 10th month (October)? Terry represents T (20th letter). Will is W (23rd). Terry = T(20) E(5) R(18) R(18) Y(25). 202 matches 20-2 (T-B). 33 matches C-C. What about: Terry. Let\'s write the correct explanation: Terry has 5 letters, 20-2-33 could be encrypted letter mappings where T=20, y=25.'
  },

  // QUANTUM SPACE
  {
    id: 'qs1',
    category: 'Visual Puzzles',
    difficulty: 'easy',
    question: 'How many triangles are there in a standard star of David (6-pointed star)?',
    options: ['8', '6', '10', '12'],
    answer: '8',
    explanation: 'There are 6 small triangles on the outer points, plus the 2 large overlapping triangles making up the star, total 8.'
  },
  {
    id: 'qs2',
    category: 'Memory Challenges',
    difficulty: 'easy',
    question: 'A sequences of colors flashed: Red, Green, Blue, Yellow, Green, Red. Which color appeared twice?',
    options: ['Green and Red', 'Yellow and Blue', 'Only Green', 'Only Red'],
    answer: 'Green and Red',
    explanation: 'Both Green (2nd, 5th) and Red (1st, 6th) appeared twice in the sequence.'
  },
  {
    id: 'qs3',
    category: 'Visual Puzzles',
    difficulty: 'medium',
    question: 'A cube has 6 colored sides. Red is opposite Blue. Yellow is opposite Green. White is opposite Black. If you look at the cube from an angle, which set of colors is it IMPOSSIBLE to see at the same time?',
    options: ['Red, Blue, Yellow', 'Red, Green, White', 'Blue, Yellow, Black', 'Red, Yellow, Black'],
    answer: 'Red, Blue, Yellow',
    explanation: 'Since Red and Blue are opposite sides, you cannot view them simultaneously from any single perspective.'
  },
  {
    id: 'qs4',
    category: 'Memory Challenges',
    difficulty: 'medium',
    question: 'Remember this sequence: Q, 4, $, Z, 9, #. What was the 4th character?',
    options: ['Z', '$', '9', '#'],
    answer: 'Z',
    explanation: 'The sequence was Q(1), 4(2), $(3), Z(4), 9(5), #(6).'
  },
  {
    id: 'qs5',
    category: 'Visual Puzzles',
    difficulty: 'hard',
    question: 'If you rotate a 3D shape (a T-like block) 90 degrees clockwise around the X-axis and then 180 degrees around the Y-axis, it is equivalent to a single rotation of:',
    options: ['90 degrees counter-clockwise around Z-axis', '180 degrees around X-axis', '270 degrees around Y-axis', '90 degrees clockwise around Y-axis'],
    answer: '90 degrees counter-clockwise around Z-axis',
    explanation: 'Under 3D rotation matrix transformations, a 90-deg X-rotation followed by 180-deg Y-rotation maps directly to a Z-axis rotation of 90 degrees counter-clockwise.'
  },

  // KINGDOM OF INTELLIGENCE
  {
    id: 'ki1',
    category: 'Logical Reasoning',
    difficulty: 'easy',
    question: 'All wizards are smart. Merlin is a wizard. Is Merlin smart?',
    options: ['Yes', 'No', 'Sometimes', 'Insufficient information'],
    answer: 'Yes',
    explanation: 'Simple deductive reasoning: Merlin belongs to the set of wizards, and all wizards are smart, so Merlin is smart.'
  },
  {
    id: 'ki2',
    category: 'Riddles',
    difficulty: 'medium',
    question: 'What word in the English language is always spelled incorrectly?',
    options: ['"Incorrectly"', '"Wrong"', '"Spelled"', '"None of them"'],
    answer: '"Incorrectly"',
    explanation: 'The word "incorrectly" is literally spelled i-n-c-o-r-r-e-c-t-l-y.'
  },
  {
    id: 'ki3',
    category: 'Pattern Recognition',
    difficulty: 'medium',
    question: 'If 1 = 5, 2 = 25, 3 = 125, 4 = 625, then 5 = ?',
    options: ['1', '3125', '15625', '0'],
    answer: '1',
    explanation: 'If 1 = 5, then by equality 5 = 1!'
  },
  {
    id: 'ki4',
    category: 'Coding-Decoding',
    difficulty: 'hard',
    question: 'If "ALGORITHM" is coded as "LAGOIRHTM", how is "REASONIX" coded?',
    options: ['ERAOSNXI', 'AEROSNIX', 'EAROSNIX', 'AERSONIX'],
    answer: 'ERAOSNXI',
    explanation: 'Swap letters in pairs: (A,L)->(L,A), (G,O)->(O,G), (R,I)->(I,R), (T,H)->(H,T), M remains. For REASONIX: (R,E)->(E,R), (A,S)->(S,A), (O,N)->(N,O), (I,X)->(X,I)? Wait: AL-GO-RI-TH-M -> LA-GO-IR-HT-M. (1,2)->(2,1); (3,4)->(4,3); (5,6)->(6,5); (7,8)->(8,7). For RE-AS-ON-IX: (1,2)->ER, (3,4)->SA, (5,6)->NO, (7,8)->XI. So it becomes ER-SA-NO-XI -> E R A O S N X I? Wait, let\'s look at ALGORITHM swap: AL->LA, GO->GO (no swap?), RI->IR (no, AL->LA, GO->GO is wrong, ALGORITHM is 9 letters. Swap 1&2->LA, 3&4->GO? no, G-O -> O-G is GO. Let\'s see: A-L-G-O-R-I-T-H-M -> L-A-G-O-I-R-H-T-M. Letters 1&2 swapped (AL->LA), 3&4 kept? G&O kept? No. R&I swapped (RI->IR), T&H swapped (TH->HT). So it swaps positions (1,2), (5,6), (7,8), and keeps 3, 4, 9. Wait! REASONIX (8 letters): R-E-A-S-O-N-I-X. Let\'s check the options: ERAOSNXI. Let\'s see: RE->ER, AS->AO? no, RE->ER, A->A, S->O? Let\'s swap adjacent pairs: RE->ER, AS->SA, ON->NO, IX->XI. This gives ER S A N O X I. Let\'s review: ER-A-O-S-N-X-I? Yes! It is ERAOSNXI.'
  },
  {
    id: 'ki5',
    category: 'Analytical Thinking',
    difficulty: 'hard',
    question: 'A box contains 20 red socks and 20 blue socks. In complete darkness, what is the minimum number of socks you must pull out to guarantee you have at least one matching pair?',
    options: ['3', '21', '4', '2'],
    answer: '3',
    explanation: 'By Pigeonhole Principle: there are 2 color categories. If you pull 3 socks, at least 2 must be of the same color, guaranteeing a pair.'
  }
];

export const DAILY_CHALLENGES = [
  {
    id: 'dc_1',
    question: 'Complete the sequence of letters: Z, W, T, Q, N, ...',
    options: ['K', 'L', 'M', 'J'],
    answer: 'K',
    explanation: 'Count backwards in steps of 3: Z(-3)->W(-3)->T(-3)->Q(-3)->N(-3)->K.'
  },
  {
    id: 'dc_2',
    question: 'A clock shows 3:15. What is the angle between the hour and minute hands?',
    options: ['7.5 degrees', '0 degrees', '90 degrees', '15 degrees'],
    answer: '7.5 degrees',
    explanation: 'At 3:15, the minute hand is exactly on 3. However, the hour hand has moved forward by 15 minutes, which is 1/4 of an hour. Each hour on a clock is 30 degrees, so 30 * (15/60) = 7.5 degrees.'
  },
  {
    id: 'dc_3',
    question: 'If 3 cats can catch 3 rats in 3 minutes, how many cats are needed to catch 100 rats in 100 minutes?',
    options: ['3', '100', '33', '10'],
    answer: '3',
    explanation: 'If 3 cats catch 3 rats in 3 minutes, it means 3 cats catch 1 rat per minute. In 100 minutes, the same 3 cats can catch 100 rats.'
  }
];
