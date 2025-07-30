import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/supabase/userService';

interface AuthScreenProps {
  navigation: any;
}

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Use the authentication hook
  const { signIn, signUp, user, loading, error } = useAuth();

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

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
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
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Life Systems Architect</Text>
      <Text style={styles.subtitle}>
        Transform from reactive problem-solving to proactive life design
      </Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#6b7280"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#6b7280"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={toggleAuthMode}
        >
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Quick test account for development */}
        <TouchableOpacity
          style={styles.demoButton}
          onPress={() => {
            setEmail('dev@smartjournal.com'); // Use different email to avoid confirmation issues
            setPassword('password123');
          }}
        >
          <Text style={styles.demoButtonText}>
            Use Dev Account (Fresh Email)
          </Text>
        </TouchableOpacity>

        {/* Emergency manual confirmation - working functionality */}
        {__DEV__ && (
          <>
            {/* Emergency manual confirmation */}
            <TouchableOpacity
              style={styles.emergencyButton}
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
                    // Try to sign in after successful confirmation
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
            >
              <Text style={styles.emergencyButtonText}>
                🚨 EMERGENCY: Confirm User
              </Text>
            </TouchableOpacity>
            
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8b5cf6',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  button: {
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  switchText: {
    color: '#6366f1',
    fontSize: 14,
  },
  demoButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  demoButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  emergencyButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#d97706',
  },
  emergencyButtonText: {
    color: '#d97706',
    fontSize: 12,
    fontWeight: '500',
  },
});