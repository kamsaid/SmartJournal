import { supabase, handleSupabaseResponse } from './client';
import { User, TransformationPhase, LifeSystemType } from '@/types/database';

export const userService = {
  // Create or get existing user profile after authentication
  createUserProfile: async (userId: string, email: string): Promise<User> => {
    console.log('Creating user profile for:', { userId, email });
    
    try {
      // First, check if user profile already exists
      const existingProfile = await userService.getUserProfile(userId);
      if (existingProfile) {
        console.log('User profile already exists, returning existing profile');
        return existingProfile;
      }

      // Create new user profile if doesn't exist
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
        // Add missing required fields with proper defaults
        consecutive_completions: 0,
        total_memories: 0,
        ai_readiness_score: 0.5, // Default middle score
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      console.log('User data to insert:', userData);

      const response = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();

      if (response.error) {
        // If it's a duplicate key error, try to get the existing profile
        if (response.error.code === '23505') {
          console.log('User already exists, fetching existing profile...');
          const existingUser = await userService.getUserProfile(userId);
          if (existingUser) {
            return existingUser;
          }
        }
        
        console.error('Supabase insert error:', response.error);
        throw new Error(`Failed to create user profile: ${response.error.message}`);
      }

      console.log('User profile created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      throw error;
    }
  },

  // Get user profile by ID
  getUserProfile: async (userId: string): Promise<User | null> => {
    console.log('Getting user profile for:', userId);
    
    try {
      const response = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);

      if (response.error) {
        console.error('Error getting user profile:', response.error);
        throw new Error(`Failed to get user profile: ${response.error.message}`);
      }

      // Handle case where user doesn't exist
      const users = response.data || [];
      const user = users.length > 0 ? users[0] : null;
      console.log('Retrieved user profile:', user ? 'Found' : 'Not found');
      return user;
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
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

  // Test database connection and permissions
  testDatabaseAccess: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('Testing database access...');
      
      // Test read access to users table
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      if (error) {
        console.error('Database access test failed:', error);
        return { 
          success: false, 
          error: `Database access failed: ${error.message}` 
        };
      }

      console.log('Database access test successful');
      return { success: true };
    } catch (error) {
      console.error('Database access test error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  // Development helper: manually confirm user email (admin use only)
  // Note: This requires admin privileges and should only be used in development
  devConfirmUser: async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('🔧 Dev: Attempting to confirm user email:', email);
      
      // This is a development helper - in a real app you'd need admin privileges
      // For now, we'll just provide guidance on what needs to be done in Supabase
      return {
        success: false,
        error: 'Manual confirmation requires admin access. Please either:\n1. Disable email confirmation in Supabase\n2. Check your email for confirmation link\n3. Use Supabase admin panel to manually confirm the user'
      };
    } catch (error) {
      console.error('Dev confirm user error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  },

  // Check if email confirmation is disabled by testing signup behavior
  checkEmailConfirmationStatus: async (): Promise<{ 
    confirmationDisabled: boolean; 
    error?: string;
    guidance?: string;
  }> => {
    try {
      // Test with a temporary email to see if confirmation is required
      const testEmail = `temp-test-${Date.now()}@example.com`;
      const testPassword = 'tempPassword123!';
      
      console.log('🔍 Testing email confirmation status...');
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      // Immediately try to delete this test user to clean up
      if (data.user) {
        // Note: This would require admin privileges in a real app
        console.log('🧹 Test user created, should be cleaned up manually');
      }

      if (error) {
        return {
          confirmationDisabled: false,
          error: `Signup test failed: ${error.message}`,
          guidance: 'Check your Supabase configuration and ensure signup is enabled.'
        };
      }

      const hasSession = !!data.session;
      const requiresConfirmation = !hasSession && !!data.user;

      return {
        confirmationDisabled: hasSession,
        guidance: hasSession 
          ? '✅ Email confirmation appears to be DISABLED - new signups work immediately'
          : '⚠️ Email confirmation appears to be ENABLED - new signups require email confirmation'
      };
    } catch (error) {
      console.error('Email confirmation status check error:', error);
      return { 
        confirmationDisabled: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        guidance: 'Could not determine email confirmation status. Check your Supabase settings manually.'
      };
    }
  },

  // Get troubleshooting guidance for stuck accounts
  getTroubleshootingGuidance: (email: string): string => {
    return `🔧 TROUBLESHOOTING GUIDE for ${email}:

📋 QUICK FIXES:
1. Use "Use Dev Account" button for a fresh email
2. Go to Supabase Dashboard > Auth > Users > Find "${email}" > Check "Email Confirmed"
3. Delete the user in Supabase and try again

🔍 CHECK SUPABASE SETTINGS:
• Authentication > Settings > "Enable email confirmations" should be UNCHECKED
• Save settings and wait 30 seconds for propagation

⚡ IMMEDIATE WORKAROUND:
• Use the "🆘 Fix Stuck Account" button to generate a fresh email
• This bypasses any existing account issues

🚨 IF STILL NOT WORKING:
• Check browser console for detailed error logs
• Verify your Supabase project URL and keys
• Check for any RLS policies blocking user creation`;
  },

  // EMERGENCY: Manually confirm user via SQL (development only)
  manuallyConfirmUser: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🚨 EMERGENCY: Manually confirming user:', email);
      
      // This directly updates the auth.users table to confirm the email
      // Note: This requires RLS to be disabled on auth.users or special permissions
      const { data, error } = await supabase.rpc('confirm_user_manually', {
        user_email: email
      });

      if (error) {
        console.error('Manual confirmation error:', error);
        
        // If the RPC doesn't exist, provide guidance
        if (error.message.includes('function confirm_user_manually')) {
          return {
            success: false,
            message: 'Manual confirmation function not available. Please run the SQL script in Supabase SQL Editor:\n\nUPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = \'' + email + '\';'
          };
        }
        
        return {
          success: false,
          message: `Manual confirmation failed: ${error.message}`
        };
      }

      return {
        success: true,
        message: 'User manually confirmed! Try signing in now.'
      };
    } catch (error) {
      console.error('Manual confirmation error:', error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },
};