import { supabase, handleSupabaseResponse } from './client';
import { User, TransformationPhase, LifeSystemType } from '@/types/database';

export const userService = {
  // Create a new user profile after authentication
  createUserProfile: async (userId: string, email: string): Promise<User> => {
    const userData = {
      id: userId,
      email,
      current_phase: 1 as TransformationPhase,
      transformation_start_date: new Date().toISOString(),
      life_systems_data: {
        health: { initialized: false },
        wealth: { initialized: false },
        relationships: { initialized: false },
        growth: { initialized: false },
        purpose: { initialized: false },
        environment: { initialized: false },
      },
      profile_data: {
        preferences: {
          questioning_depth: 'medium',
          reminder_frequency: 'daily',
          privacy_level: 'standard',
        },
      },
    };

    const response = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get user profile by ID
  getUserProfile: async (userId: string): Promise<User | null> => {
    const response = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return response.data;
  },

  // Update user's current transformation phase
  updateTransformationPhase: async (
    userId: string,
    phase: TransformationPhase
  ): Promise<User> => {
    const response = await supabase
      .from('users')
      .update({ 
        current_phase: phase,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Update life systems data
  updateLifeSystemsData: async (
    userId: string,
    systemType: LifeSystemType,
    data: any
  ): Promise<User> => {
    // First get current life_systems_data
    const currentUser = await userService.getUserProfile(userId);
    if (!currentUser) throw new Error('User not found');

    const updatedLifeSystemsData = {
      ...currentUser.life_systems_data,
      [systemType]: data,
    };

    const response = await supabase
      .from('users')
      .update({ 
        life_systems_data: updatedLifeSystemsData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Update user profile data
  updateProfileData: async (
    userId: string,
    profileData: Partial<User['profile_data']>
  ): Promise<User> => {
    const response = await supabase
      .from('users')
      .update({ 
        profile_data: profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Check if user has completed initial setup
  hasCompletedInitialSetup: async (userId: string): Promise<boolean> => {
    const user = await userService.getUserProfile(userId);
    if (!user) return false;

    // Check if user has basic profile info and has started Phase 1
    return !!(
      user.profile_data.name &&
      user.current_phase >= 1 &&
      user.transformation_start_date
    );
  },

  // Get user's transformation progress summary
  getTransformationSummary: async (userId: string) => {
    const user = await userService.getUserProfile(userId);
    if (!user) throw new Error('User not found');

    const phases = await supabase
      .from('phases')
      .select('*')
      .eq('user_id', userId)
      .order('phase_number', { ascending: true });

    const recentReflections = await supabase
      .from('daily_reflections')
      .select('date, depth_level')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(7);

    return {
      user,
      phases: phases.data || [],
      recent_reflections: recentReflections.data || [],
      transformation_days: Math.floor(
        (Date.now() - new Date(user.transformation_start_date).getTime()) / 
        (1000 * 60 * 60 * 24)
      ),
    };
  },
};