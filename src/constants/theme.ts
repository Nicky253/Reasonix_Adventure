import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#ffffff', // Forcing dark mode elements even in light mode for unified gaming experience
    background: '#0f051d',
    backgroundElement: '#1a0b2e',
    backgroundSelected: '#2c124d',
    textSecondary: '#a594cf',
    primary: '#6b3fa0',
    accent: '#ffd700',
    cyan: '#00f5ff',
    magenta: '#ff007f',
    green: '#4CAF50',
    error: '#f44336',
  },
  dark: {
    text: '#ffffff',
    background: '#0f051d', // Deep space purple
    backgroundElement: '#1a0b2e', // Midnight plum
    backgroundSelected: '#2c124d', // Active item background
    textSecondary: '#a594cf', // Lavender purple
    primary: '#8a4fcf',
    accent: '#ffd700', // Royal Gold
    cyan: '#00f5ff', // Cosmic Cyan
    magenta: '#ff007f', // Cyber Magenta
    green: '#4CAF50',
    error: '#f44336',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
export type ColorsType = typeof Colors.dark;
