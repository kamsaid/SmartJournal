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

  // Get phase color for UI
  getPhaseColor: (phase: number): string => {
    const colors = {
      1: '#FF6B6B', // Recognition - Red
      2: '#4ECDC4', // Understanding - Teal  
      3: '#45B7D1', // Realization - Blue
      4: '#96CEB4', // Transformation - Green
      5: '#FFEAA7', // Vision - Yellow
      6: '#DDA0DD', // Reality - Purple
      7: '#FFD700', // Integration - Gold
    };
    return colors[phase as keyof typeof colors] || '#6B73FF';
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