import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../config/firebase';
import { Colors, Spacing } from '../constants/theme';

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAuth = async () => {
    if (!email || !password || (isSignUp && !name)) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      if (isSignUp) {
        await auth.signUpWithEmail(email, password, name);
      } else {
        await auth.signInWithEmail(email, password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await auth.signInAnonymously();
    } catch (err: any) {
      setErrorMsg('Failed to start Guest Mode. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Simulating Google login callback
      setTimeout(async () => {
        try {
          await auth.signInWithEmail('google_thinker@reasonix.com', 'GoogleUser123');
        } catch {
          // If profile doesn't exist, sign up
          await auth.signUpWithEmail('google_thinker@reasonix.com', 'GoogleUser123', 'Cosmic Thinker');
        } finally {
          setLoading(false);
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Google login failed.');
      setLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#0f051d', '#1a0b2e', '#05020a']} 
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>REASONIX</Text>
            <Text style={styles.taglineText}>Play Smart. Think Better.</Text>
            <View style={styles.glowBar} />
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeader}>{isSignUp ? 'Create Codex Profile' : 'Access Codex'}</Text>
            
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>NICKNAME / AGENT NAME</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. NeoThinker"
                  placeholderTextColor="#6a5299"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={styles.input}
                placeholder="agent@reasonix.com"
                placeholderTextColor="#6a5299"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>PASSWORD CODE</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#6a5299"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, loading && styles.disabledButton]} 
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0f051d" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isSignUp ? 'INITIALIZE SYSTEM' : 'ENTER ADVENTURE'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.switchText}>
                {isSignUp ? 'Already registered? Log In' : "New investigator? Create profile"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Secondary Options */}
          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={styles.googleButton} 
              onPress={handleGoogleLogin}
              disabled={loading}
            >
              <Text style={styles.googleButtonText}>Sign In with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.guestButton} 
              onPress={handleGuestLogin}
              disabled={loading}
            >
              <Text style={styles.guestButtonText}>Play as Guest (Offline Sync)</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  titleText: {
    fontSize: 42,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 6,
    textShadowColor: Colors.dark.cyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  taglineText: {
    fontSize: 14,
    color: Colors.dark.accent,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: Spacing.one,
  },
  glowBar: {
    width: 120,
    height: 3,
    backgroundColor: Colors.dark.accent,
    marginTop: Spacing.two,
    borderRadius: Spacing.one,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  card: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    borderWidth: 1.5,
    borderColor: '#4d2b99',
    shadowColor: '#4d2b99',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  cardHeader: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: Spacing.three,
    textAlign: 'center',
    letterSpacing: 1,
  },
  errorText: {
    color: Colors.dark.error,
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 11,
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing.one,
  },
  input: {
    backgroundColor: '#0f051d',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: '#3a2075',
    fontSize: 15,
  },
  primaryButton: {
    backgroundColor: Colors.dark.accent,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#0f051d',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  switchButton: {
    marginTop: Spacing.three,
    alignItems: 'center',
  },
  switchText: {
    color: Colors.dark.cyan,
    fontSize: 13,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3a2075',
  },
  dividerText: {
    color: Colors.dark.textSecondary,
    paddingHorizontal: Spacing.three,
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionsContainer: {
    gap: Spacing.two,
  },
  googleButton: {
    backgroundColor: '#ffffff',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#0f051d',
    fontWeight: 'bold',
    fontSize: 14,
  },
  guestButton: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.cyan,
  },
  guestButtonText: {
    color: Colors.dark.cyan,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
