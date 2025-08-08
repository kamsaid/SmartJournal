import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/supabase/userService';
import { AnimatedButton, AnimatedTextInput, AnimatedCard, LoadingAnimation } from '@/components/animated';
import { theme, SPRING_CONFIGS } from '@/design-system';

interface AuthScreenProps {
  navigation: any;
}

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Use the authentication hook
  const { signIn, signUp, user, loading, error } = useAuth();
  
  // Animation values
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);
  const subtitleOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const formOpacity = useSharedValue(0);
  const particleRotation = useSharedValue(0);
  
  // Initialize entrance animations
  useEffect(() => {
    // Staggered entrance animation
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    titleScale.value = withDelay(200, withSpring(1, SPRING_CONFIGS.bouncy));
    
    subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    
    cardOpacity.value = withDelay(1000, withTiming(1, { duration: 800 }));
    cardTranslateY.value = withDelay(1000, withSpring(0, SPRING_CONFIGS.gentle));
    
    formOpacity.value = withDelay(1400, withTiming(1, { duration: 600 }));
    
    // Continuous particle rotation
    particleRotation.value = withTiming(360, { duration: 20000 }, () => {
      particleRotation.value = 0;
    });
  }, []);

  // Log when user is authenticated (navigation handled by AppNavigator)
  useEffect(() => {
    if (user) {
      console.log('User authenticated successfully:', user.email);
    }
  }, [user]);

  // Show auth errors
  useEffect(() => {
    if (error) {
      Alert.alert('Authentication Error', error);
    }
  }, [error]);

  const validateForm = () => {
    let isValid = true;
    
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleAuth = async () => {
    if (!validateForm()) {
      return;
    }
    
    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        
        if (result.requiresConfirmation) {
          // Email confirmation required - show success message
          Alert.alert(
            'Check Your Email', 
            'We\'ve sent you a confirmation email. Please click the link in the email to complete your signup.',
            [{ text: 'OK' }]
          );
        } else {
          // Immediate success - show welcome message
          Alert.alert(
            'Account Created', 
            'Welcome! Your account has been created successfully. You can now access the app.',
            [{ text: 'OK' }]
          );
        }
      } else {
        await signIn(email, password);
        console.log('Sign in successful - navigation will happen automatically');
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      // Handle any remaining error cases
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      // For sign up, most errors will be handled above, this is for unexpected errors
      if (isSignUp) {
        Alert.alert('Signup Error', errorMessage);
      }
      // For sign in, errors will be shown via useEffect from the auth hook
    }
  };

  // Clear any existing errors when switching between sign in/up
  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setEmailError('');
    setPasswordError('');
    
    // Animate form transition
    formOpacity.value = withSequence(
      withTiming(0.7, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
  };
  
  // Animated styles
  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));
  
  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));
  
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));
  
  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
  }));
  
  const particleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${particleRotation.value}deg` }],
  }));

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Animated Background with Gradient */}
      <LinearGradient
        colors={[theme.colors.dark.bg, '#1a1a2e', theme.colors.dark.bg]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Floating Particles Background */}
      <Animated.View style={[styles.particleContainer, particleAnimatedStyle]}>
        {[...Array(6)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.particle,
              {
                top: `${20 + (index * 12)}%`,
                left: `${10 + (index * 15)}%`,
                opacity: 0.1,
                transform: [{ scale: 0.5 + (index * 0.1) }],
              },
            ]}
          />
        ))}
      </Animated.View>
      
      <View style={styles.content}>
        {/* Animated Title */}
        <Animated.Text style={[styles.title, titleAnimatedStyle]}>
          Life Systems Architect
        </Animated.Text>
        
        {/* Animated Subtitle */}
        <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
          Transform from reactive problem-solving to proactive life design
        </Animated.Text>

        {/* Animated Card Container */}
        <Animated.View style={cardAnimatedStyle}>
          <AnimatedCard
            variant="glass"
            size="lg"
            style={styles.authCard}
            glowEffect={true}
            borderGlow={true}
          >
            <Animated.View style={formAnimatedStyle}>
              {/* Email Input */}
              <AnimatedTextInput
                label="Email"
                variant="floating"
                value={email}
                onChangeText={setEmail}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                glowOnFocus={true}
                hapticFeedback={true}
                containerStyle={styles.inputContainer}
              />
              
              {/* Password Input */}
              <AnimatedTextInput
                label="Password"
                variant="floating"
                value={password}
                onChangeText={setPassword}
                error={passwordError}
                secureTextEntry
                glowOnFocus={true}
                hapticFeedback={true}
                containerStyle={styles.inputContainer}
              />

              {/* Main Auth Button */}
              <AnimatedButton
                title={isSignUp ? 'Create Account' : 'Sign In'}
                onPress={handleAuth}
                variant="cosmic"
                size="lg"
                disabled={loading}
                loading={loading}
                fullWidth={true}
                glowEffect={true}
                hapticFeedback={true}
                style={styles.authButton}
              />

              {/* Toggle Auth Mode */}
              <AnimatedButton
                title={isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                onPress={toggleAuthMode}
                variant="ghost"
                size="md"
                fullWidth={true}
                hapticFeedback={true}
                style={styles.toggleButton}
              />

              {/* Development Buttons */}
              {__DEV__ && (
                <>
                  <AnimatedButton
                    title="Use Dev Account"
                    onPress={() => {
                      setEmail('dev@smartjournal.com');
                      setPassword('password123');
                    }}
                    variant="secondary"
                    size="sm"
                    fullWidth={true}
                    style={styles.devButton}
                  />

                  <AnimatedButton
                    title="🚨 EMERGENCY: Confirm User"
                    onPress={async () => {
                      if (!email) {
                        Alert.alert('Error', 'Please enter an email address first');
                        return;
                      }
                      
                      try {
                        console.log('🚨 Emergency: Manually confirming user');
                        const result = await userService.manuallyConfirmUser(email);
                        
                        Alert.alert(
                          result.success ? '✅ Success' : '❌ Error',
                          result.message,
                          [{ text: 'OK' }]
                        );
                        
                        if (result.success) {
                          setTimeout(() => {
                            Alert.alert(
                              'Try Sign In',
                              'User confirmed! Now try signing in with your password.',
                              [{ text: 'OK' }]
                            );
                          }, 1000);
                        }
                      } catch (error) {
                        console.error('Emergency confirmation error:', error);
                        Alert.alert('Error', 'Failed to manually confirm user');
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    fullWidth={true}
                    style={styles.emergencyButton}
                  />
                </>
              )}
            </Animated.View>
          </AnimatedCard>
        </Animated.View>
        
        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <LoadingAnimation
              variant="cosmic"
              size="lg"
              text="Authenticating..."
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
  },
  particleContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary[500],
  },
  title: {
    fontSize: theme.typography.fontSizes['4xl'],
    fontWeight: theme.typography.fontWeights.extrabold,
    color: theme.colors.primary[500],
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
    textShadowColor: `${theme.colors.primary[500]}40`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.dark.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing['5xl'],
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.fontSizes.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  authCard: {
    marginVertical: theme.spacing.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  authButton: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  toggleButton: {
    marginBottom: theme.spacing.lg,
  },
  devButton: {
    marginBottom: theme.spacing.md,
    opacity: 0.8,
  },
  emergencyButton: {
    marginBottom: theme.spacing.md,
    opacity: 0.6,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 15, 35, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});