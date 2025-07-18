import { createClient } from '@supabase/supabase-js';
import config from '@/constants/config';

export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

// Helper function to handle Supabase responses
export const handleSupabaseResponse = <T>(
  response: { data: T | null; error: any }
) => {
  if (response.error) {
    console.error('Supabase error:', response.error);
    throw new Error(response.error.message);
  }
  return response.data;
};

// Authentication helpers
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return handleSupabaseResponse({ data, error });
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return handleSupabaseResponse({ data, error });
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};