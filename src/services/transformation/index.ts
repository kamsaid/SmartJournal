// Export transformation services
export { default as phaseManager } from './phaseManager';
export type {
  PhaseMetrics,
  PhaseCompletionCriteria,
  PhaseTransition,
} from './phaseManager';

// Re-export database transformation service
export { transformationService } from '@/services/supabase';

// Transformation utilities
export const transformationUtils = {
  // Calculate overall transformation progress (0-1)
  calculateOverallProgress: (currentPhase: number, phaseProgress: number): number => {
    return ((currentPhase - 1) + phaseProgress) / 7;
  },

  // Get phase color for UI using Duson palette
  getPhaseColor: (phase: number): string => {
    const colors = {
      1: '#FD1F4A', // Recognition - Duson Coral Red
      2: '#FF6195', // Understanding - Medium coral  
      3: '#FFB000', // Realization - Duson Golden Yellow
      4: '#FFCA5C', // Transformation - Light golden
      5: '#FFE5B9', // Vision - Very light golden
      6: '#E69D00', // Reality - Darker golden
      7: '#FFB000', // Integration - Duson Golden Yellow
    };
    return colors[phase as keyof typeof colors] || '#FFB000';
  },

  // Get phase icon for UI
  getPhaseIcon: (phase: number): string => {
    const icons = {
      1: '👁️', // Recognition
      2: '🔄', // Understanding
      3: '💡', // Realization
      4: '⚡', // Transformation
      5: '🔮', // Vision
      6: '🏗️', // Reality
      7: '👑', // Integration
    };
    return icons[phase as keyof typeof icons] || '🎯';
  },

  // Format phase duration for display
  formatPhaseDuration: (days: number): string => {
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''}`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) !== 1 ? 's' : ''}`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) !== 1 ? 's' : ''}`;
  },

  // Get motivational message based on progress
  getMotivationalMessage: (phase: number, progress: number): string => {
    if (progress >= 0.9) {
      return "You're almost ready for the next phase! 🚀";
    } else if (progress >= 0.7) {
      return "Great progress! Keep diving deeper. 💪";
    } else if (progress >= 0.5) {
      return "You're building momentum! 📈";
    } else {
      return "Every insight matters. Keep exploring! 🌱";
    }
  },

  // Validate phase data integrity
  validatePhaseProgression: (phases: any[]): boolean => {
    // Check if phases are in correct order
    const sortedPhases = phases.sort((a, b) => a.phase_number - b.phase_number);
    
    for (let i = 0; i < sortedPhases.length; i++) {
      if (sortedPhases[i].phase_number !== i + 1) {
        return false;
      }
    }
    
    return true;
  },
};