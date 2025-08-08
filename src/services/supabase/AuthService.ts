// AuthService.ts - Handles user authentication
import { supabase } from './client';
import { User } from '@supabase/supabase-js';

/**
 * Get the currently authenticated user
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 */
// Removed unused isAuthenticated export to reduce dead-code

/**
 * Get the current session
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}; 