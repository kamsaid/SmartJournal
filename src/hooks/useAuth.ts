// useAuth.ts - Custom hook for authentication state management
import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, handleSupabaseResponse } from '@/services/supabase/client';
import { userService } from '@/services/supabase/userService';
import config from '@/constants/config'; // Import config to check environment
import { User as DatabaseUser } from '@/types/database';

interface AuthState {
  user: SupabaseUser | null;
  userProfile: DatabaseUser | null;
  loading: boolean;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ requiresConfirmation: boolean }>;
  signOut: () => Promise<void>;
  getCurrentUserId: () => string | null;
  ensureUserProfile: () => Promise<DatabaseUser | null>;
}

// Helper function to add timeout to promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Operation timed out')), timeoutMs)
    ),
  ]);
};

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    userProfile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState({
            user: null,
            userProfile: null,
            loading: false,
            error: error.message,
          });
          return;
        }

        if (session?.user) {
          // User is signed in - ensure profile exists
          try {
            let profile = await userService.getUserProfile(session.user.id);
            
            if (!profile && session.user.email) {
              profile = await userService.createUserProfile(
                session.user.id,
                session.user.email
              );
            }

            setAuthState({
              user: session.user,
              userProfile: profile,
              loading: false,
              error: null,
            });
          } catch (profileError) {
            console.error('Error with user profile:', profileError);
            setAuthState({
              user: session.user,
              userProfile: null,
              loading: false,
              error: profileError instanceof Error ? profileError.message : 'Profile creation failed',
            });
          }
        } else {
          setAuthState({
            user: null,
            userProfile: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          userProfile: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Auth initialization failed',
        });
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        try {
          if (session?.user) {
            // User signed in - ensure user profile exists
            let profile = await userService.getUserProfile(session.user.id);
            
            // Create profile if it doesn't exist
            if (!profile && session.user.email) {
              try {
                profile = await userService.createUserProfile(
                  session.user.id,
                  session.user.email
                );
              } catch (profileError) {
                console.error('Error creating user profile:', profileError);
                // Still set the user but with profile error
                setAuthState({
                  user: session.user,
                  userProfile: null,
                  loading: false,
                  error: profileError instanceof Error ? profileError.message : 'Profile creation failed',
                });
                return;
              }
            }

            setAuthState({
              user: session.user,
              userProfile: profile,
              loading: false,
              error: null,
            });
          } else {
            // User signed out
            setAuthState({
              user: null,
              userProfile: null,
              loading: false,
              error: null,
            });
          }
        } catch (error) {
          console.error('Error in auth state change handler:', error);
          setAuthState(prev => ({
            ...prev,
            loading: false,
            error: error instanceof Error ? error.message : 'Authentication error',
          }));
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🔐 Starting sign in for:', email);
      console.log('🔧 structuredClone available:', typeof global.structuredClone !== 'undefined');
      
      // Add 30 second timeout for sign in
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      const { data, error } = await withTimeout(signInPromise, 30000);

      if (error) {
        throw error;
      }

      // User profile will be loaded automatically by the auth state listener
    } catch (error) {
      console.error('Sign in error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Sign in failed',
        loading: false 
      }));
      throw error;
    }
  };

  const signUp = async (email: string, password: string): Promise<{ requiresConfirmation: boolean }> => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      console.log('🚀 Starting signup for:', email);
      
      // Apply development-specific options to bypass email confirmation
      const signUpOptions = {
        email,
        password,
        options: {
          emailRedirectTo: config.app.environment === 'development' ? undefined : `${config.supabase.url}/auth/v1/verify`,
          data: {
            email, // Store email in user metadata
          },
        },
      };
      
      console.log('🔧 Signup options:', {
        environment: config.app.environment,
        emailRedirectTo: signUpOptions.options.emailRedirectTo,
        bypassingEmailConfirmation: config.app.environment === 'development'
      });
      
      // Add 30 second timeout for sign up
      const signUpPromise = supabase.auth.signUp(signUpOptions);
      
      const { data, error } = await withTimeout(signUpPromise, 30000);

      console.log('📋 Signup result:', {
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        userConfirmed: data?.user?.email_confirmed_at ? 'Yes' : 'No',
        error: error?.message
      });

      if (error) {
        console.error('❌ Signup error:', error);
        throw error;
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('📧 Email confirmation required - no session created');
        // Email confirmation required - reset loading state
        setAuthState(prev => ({ 
          ...prev, 
          loading: false,
          error: null
        }));
        // Return success with confirmation requirement
        return { requiresConfirmation: true };
      }

      console.log('✅ Signup successful - session created immediately');
      // User profile will be created automatically by the auth state listener
      return { requiresConfirmation: false };
    } catch (error) {
      console.error('Sign up error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Sign up failed',
        loading: false 
      }));
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      // Add timeout for sign out
      const signOutPromise = supabase.auth.signOut();
      const { error } = await withTimeout(signOutPromise, 10000);
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const getCurrentUserId = (): string | null => {
    return authState.user?.id || null;
  };

  const ensureUserProfile = async (): Promise<DatabaseUser | null> => {
    if (!authState.user) return null;
    
    if (authState.userProfile) {
      return authState.userProfile;
    }

    try {
      // Try to get existing profile
      let profile = await userService.getUserProfile(authState.user.id);
      
      // Create if doesn't exist
      if (!profile && authState.user.email) {
        profile = await userService.createUserProfile(
          authState.user.id,
          authState.user.email
        );
      }

      setAuthState(prev => ({ ...prev, userProfile: profile }));
      return profile;
    } catch (error) {
      console.error('Error ensuring user profile:', error);
      return null;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    getCurrentUserId,
    ensureUserProfile,
  };
}; 