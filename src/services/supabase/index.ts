// Export all Supabase services and client
export { supabase, auth, handleSupabaseResponse } from './client';
export { userService } from './userService';
export { transformationService } from './transformationService';
export { lifeSystemsService } from './lifeSystemsService';

// Export database types
export * from '@/types/database';

// Helper functions for common operations
export const dbHelpers = {
  // Check if user exists and has completed setup
  checkUserSetup: async (userId: string) => {
    const { userService } = await import('./userService');
    return userService.hasCompletedInitialSetup(userId);
  },

  // Get user's complete profile with transformation data
  getUserCompleteProfile: async (userId: string) => {
    const { userService, transformationService, lifeSystemsService } = await import('./');
    
    const [profile, phases, recentReflections, lifeSystems] = await Promise.all([
      userService.getUserProfile(userId),
      transformationService.getUserPhases(userId),
      transformationService.getRecentReflections(userId, 5),
      lifeSystemsService.getUserLifeSystems(userId),
    ]);

    return {
      profile,
      phases,
      recent_reflections: recentReflections,
      life_systems: lifeSystems,
    };
  },

  // Initialize new user with default data
  initializeNewUser: async (userId: string, email: string) => {
    const { userService, transformationService } = await import('./');
    
    // Create user profile
    const user = await userService.createUserProfile(userId, email);
    
    // Create first phase
    const phase = await transformationService.createPhase(userId, 1);
    
    return { user, phase };
  },
};