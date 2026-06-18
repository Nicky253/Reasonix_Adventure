import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace with user's Firebase config or load from process.env if available
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "MOCK_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-reasonix.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "mock-reasonix",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-reasonix.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:12345:web:mock123"
};

// Check if we are running in mock mode
const isMockMode = firebaseConfig.apiKey === "MOCK_API_KEY" || !process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

let app: any;
let authInstance: any;
let dbInstance: any;

if (!isMockMode) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    console.log("Firebase initialized successfully with credentials.");
  } catch (error) {
    console.warn("Failed to initialize Firebase with credentials, using mock fallback.", error);
    app = null;
    authInstance = null;
    dbInstance = null;
  }
}

// Interfaces for our app state
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  level: number; // 1 to 7
  levelTitle: string; // e.g. Beginner Thinker
  xp: number;
  coins: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
  achievements: string[];
  analytics: {
    accuracy: number;
    totalAnswered: number;
    correctAnswered: number;
    categoryStats: { [category: string]: { total: number; correct: number } };
    recentResponseTimes: number[];
  };
}

// In-Memory Database for Mock Mode (seeded from AsyncStorage for persistence)
class MockDatabase {
  private users: { [uid: string]: UserProfile } = {};
  private leaderboard: { uid: string; name: string; score: number; levelTitle: string }[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedUsers = await AsyncStorage.getItem('mock_users');
      const storedLeaderboard = await AsyncStorage.getItem('mock_leaderboard');
      
      if (storedUsers) this.users = JSON.parse(storedUsers);
      if (storedLeaderboard) {
        this.leaderboard = JSON.parse(storedLeaderboard);
      } else {
        // Seed default leaderboard
        this.leaderboard = [
          { uid: 'cpu1', name: 'Sophia (Mind Warrior)', score: 2400, levelTitle: 'Mind Warrior' },
          { uid: 'cpu2', name: 'Liam (Strategy Master)', score: 1850, levelTitle: 'Strategy Master' },
          { uid: 'cpu3', name: 'Emma (Puzzle Solver)', score: 1200, levelTitle: 'Puzzle Solver' },
          { uid: 'cpu4', name: 'Noah (Logic Explorer)', score: 850, levelTitle: 'Logic Explorer' },
          { uid: 'cpu5', name: 'Olivia (Beginner Thinker)', score: 350, levelTitle: 'Beginner Thinker' }
        ];
        await AsyncStorage.setItem('mock_leaderboard', JSON.stringify(this.leaderboard));
      }
    } catch (e) {
      console.error("Mock storage load error", e);
    }
  }

  async save() {
    try {
      await AsyncStorage.setItem('mock_users', JSON.stringify(this.users));
      await AsyncStorage.setItem('mock_leaderboard', JSON.stringify(this.leaderboard));
    } catch (e) {
      console.error("Mock storage save error", e);
    }
  }

  async getUser(uid: string): Promise<UserProfile | null> {
    await this.loadFromStorage();
    return this.users[uid] || null;
  }

  async setUser(uid: string, profile: UserProfile): Promise<void> {
    this.users[uid] = profile;
    // Sync to leaderboard
    const idx = this.leaderboard.findIndex(l => l.uid === uid);
    const lbEntry = {
      uid,
      name: profile.name,
      score: profile.xp,
      levelTitle: profile.levelTitle
    };
    if (idx >= 0) {
      this.leaderboard[idx] = lbEntry;
    } else {
      this.leaderboard.push(lbEntry);
    }
    this.leaderboard.sort((a, b) => b.score - a.score);
    await this.save();
  }

  async getLeaderboard() {
    await this.loadFromStorage();
    return this.leaderboard;
  }
}

const mockDB = new MockDatabase();

// Mock Auth State Manager
class MockAuth {
  private currentUser: any = null;
  private listeners: ((user: any) => void)[] = [];

  constructor() {
    this.loadUser();
  }

  private async loadUser() {
    if (typeof window === 'undefined') return;
    const userJson = await AsyncStorage.getItem('mock_current_user');
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(cb => cb(this.currentUser));
  }

  onAuthStateChanged(cb: (user: any) => void) {
    this.listeners.push(cb);
    cb(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  async signInAnonymously() {
    const uid = 'guest_' + Math.random().toString(36).substring(2, 9);
    const user = { uid, email: '', isAnonymous: true, displayName: 'Guest Investigator' };
    this.currentUser = user;
    await AsyncStorage.setItem('mock_current_user', JSON.stringify(user));
    
    // Set default profile if not exists
    const existing = await mockDB.getUser(uid);
    if (!existing) {
      const defaultProfile: UserProfile = {
        uid,
        name: 'Guest Investigator',
        email: '',
        level: 1,
        levelTitle: 'Beginner Thinker',
        xp: 0,
        coins: 100,
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        achievements: [],
        analytics: {
          accuracy: 0,
          totalAnswered: 0,
          correctAnswered: 0,
          categoryStats: {},
          recentResponseTimes: []
        }
      };
      await mockDB.setUser(uid, defaultProfile);
    }
    this.notifyListeners();
    return { user };
  }

  async signInWithEmail(email: string) {
    const uid = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '');
    const user = { uid, email, isAnonymous: false, displayName: email.split('@')[0] };
    this.currentUser = user;
    await AsyncStorage.setItem('mock_current_user', JSON.stringify(user));

    const existing = await mockDB.getUser(uid);
    if (!existing) {
      const defaultProfile: UserProfile = {
        uid,
        name: user.displayName,
        email,
        level: 1,
        levelTitle: 'Beginner Thinker',
        xp: 0,
        coins: 100,
        streak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
        achievements: [],
        analytics: {
          accuracy: 0,
          totalAnswered: 0,
          correctAnswered: 0,
          categoryStats: {},
          recentResponseTimes: []
        }
      };
      await mockDB.setUser(uid, defaultProfile);
    }
    this.notifyListeners();
    return { user };
  }

  async signUpWithEmail(email: string, name: string) {
    const uid = 'user_' + email.replace(/[^a-zA-Z0-9]/g, '');
    const user = { uid, email, isAnonymous: false, displayName: name };
    this.currentUser = user;
    await AsyncStorage.setItem('mock_current_user', JSON.stringify(user));

    const defaultProfile: UserProfile = {
      uid,
      name,
      email,
      level: 1,
      levelTitle: 'Beginner Thinker',
      xp: 0,
      coins: 100,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      achievements: [],
      analytics: {
        accuracy: 0,
        totalAnswered: 0,
        correctAnswered: 0,
        categoryStats: {},
        recentResponseTimes: []
      }
    };
    await mockDB.setUser(uid, defaultProfile);
    this.notifyListeners();
    return { user };
  }

  async signOut() {
    this.currentUser = null;
    await AsyncStorage.removeItem('mock_current_user');
    this.notifyListeners();
  }
}

const mockAuth = new MockAuth();

// EXPORTED SERVICES
// Wrap firebase auth & firestore database, falling back dynamically

export const auth = {
  currentUser: isMockMode ? null : authInstance?.currentUser,
  onAuthStateChanged: (callback: (user: any) => void) => {
    if (isMockMode) {
      return mockAuth.onAuthStateChanged(callback);
    }
    return onAuthStateChanged(authInstance, callback);
  },
  signInAnonymously: async () => {
    if (isMockMode) {
      return mockAuth.signInAnonymously();
    }
    return signInAnonymously(authInstance);
  },
  signInWithEmail: async (email: string, pass: string) => {
    if (isMockMode) {
      return mockAuth.signInWithEmail(email);
    }
    return signInWithEmailAndPassword(authInstance, email, pass);
  },
  signUpWithEmail: async (email: string, pass: string, name: string) => {
    if (isMockMode) {
      return mockAuth.signUpWithEmail(email, name);
    }
    const cred = await createUserWithEmailAndPassword(authInstance, email, pass);
    // Create profile in Firestore
    const userRef = doc(dbInstance, 'users', cred.user.uid);
    const defaultProfile: UserProfile = {
      uid: cred.user.uid,
      name,
      email,
      level: 1,
      levelTitle: 'Beginner Thinker',
      xp: 0,
      coins: 100,
      streak: 1,
      lastActiveDate: new Date().toISOString().split('T')[0],
      achievements: [],
      analytics: {
        accuracy: 0,
        totalAnswered: 0,
        correctAnswered: 0,
        categoryStats: {},
        recentResponseTimes: []
      }
    };
    await setDoc(userRef, defaultProfile);
    return cred;
  },
  signOut: async () => {
    if (isMockMode) {
      return mockAuth.signOut();
    }
    return signOut(authInstance);
  }
};

export const database = {
  getUserProfile: async (uid: string): Promise<UserProfile | null> => {
    if (isMockMode) {
      return mockDB.getUser(uid);
    }
    const userRef = doc(dbInstance, 'users', uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  },
  setUserProfile: async (uid: string, profile: UserProfile): Promise<void> => {
    if (isMockMode) {
      return mockDB.setUser(uid, profile);
    }
    const userRef = doc(dbInstance, 'users', uid);
    await setDoc(userRef, profile, { merge: true });

    // Update leaderboard doc as well
    const lbRef = doc(dbInstance, 'leaderboard', uid);
    await setDoc(lbRef, {
      uid,
      name: profile.name,
      score: profile.xp,
      levelTitle: profile.levelTitle
    }, { merge: true });
  },
  getLeaderboard: async () => {
    if (isMockMode) {
      return mockDB.getLeaderboard();
    }
    const lbCol = collection(dbInstance, 'leaderboard');
    const q = query(lbCol, orderBy('score', 'desc'), limit(20));
    const snap = await getDocs(q);
    const list: any[] = [];
    snap.forEach(d => list.push(d.data()));
    return list;
  }
};
