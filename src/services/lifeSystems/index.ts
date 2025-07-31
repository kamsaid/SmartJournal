// Export life systems framework
export { default as systemsFramework, LIFE_SYSTEMS_DEFINITIONS, SYSTEM_INTERCONNECTIONS } from './systemsFramework';
export type {
  SystemDefinition,
  SystemHealth,
  SystemInterconnection,
  SystemArchitecture,
} from './systemsFramework';

// Re-export database life systems service
export { lifeSystemsService } from '@/services/supabase';

// Life systems utilities
export const lifeSystemsUtils = {
  // Get system display name
  getSystemDisplayName: (systemType: string): string => {
    const names = {
      health: 'Health & Energy',
      wealth: 'Wealth & Resources',
      relationships: 'Relationships & Connection',
      growth: 'Learning & Growth',
      purpose: 'Purpose & Meaning',
      environment: 'Environment & Context',
    };
    return names[systemType as keyof typeof names] || systemType;
  },

  // Get system icon
  getSystemIcon: (systemType: string): string => {
    const icons = {
      health: '💪',
      wealth: '💰',
      relationships: '❤️',
      growth: '📈',
      purpose: '🎯',
      environment: '🏠',
    };
    return icons[systemType as keyof typeof icons] || '⚡';
  },

  // Get system color using Duson palette
  getSystemColor: (systemType: string): string => {
    const colors = {
      health: '#FFB000',     // Duson Golden Yellow for health/growth
      wealth: '#FFB000',     // Duson Golden Yellow for wealth/abundance
      relationships: '#FD1F4A', // Duson Coral Red for relationships/passion
      growth: '#FFB000',     // Duson Golden Yellow for growth/development
      purpose: '#FD1F4A',    // Duson Coral Red for purpose/energy
      environment: '#2D2C2E', // Duson Dark Charcoal for environment/stability
    };
    return colors[systemType as keyof typeof colors] || '#FFB000';
  },

  // Calculate system health score from 1-10
  calculateHealthScore: (system: any): number => {
    if (!system) return 3;
    return Math.max(1, Math.min(10, system.current_state?.satisfaction_level || 3));
  },

  // Format health score for display
  formatHealthScore: (score: number): string => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Needs Attention';
  },

  // Get health score color using Duson palette
  getHealthScoreColor: (score: number): string => {
    if (score >= 8) return '#FFB000'; // Duson Golden Yellow for excellent
    if (score >= 6) return '#FFCA5C'; // Lighter golden for good
    if (score >= 4) return '#FD1F4A'; // Duson Coral Red for needs attention
    return '#2D2C2E'; // Duson Dark Charcoal for poor
  },

  // Calculate overall life architecture score
  calculateOverallScore: (systemsHealth: any[]): number => {
    if (!systemsHealth.length) return 0;
    const total = systemsHealth.reduce((acc, system) => acc + system.overall_score, 0);
    return total / systemsHealth.length;
  },

  // Identify the weakest system (highest leverage opportunity)
  identifyWeakestSystem: (systemsHealth: any[]): string | null => {
    if (!systemsHealth.length) return null;
    const weakest = systemsHealth.reduce((min, system) => 
      system.overall_score < min.overall_score ? system : min
    );
    return weakest.system_type;
  },

  // Identify the strongest system (potential leverage source)
  identifyStrongestSystem: (systemsHealth: any[]): string | null => {
    if (!systemsHealth.length) return null;
    const strongest = systemsHealth.reduce((max, system) => 
      system.overall_score > max.overall_score ? system : max
    );
    return strongest.system_type;
  },

  // Get system balance score (how evenly developed all systems are)
  getSystemBalance: (systemsHealth: any[]): number => {
    if (!systemsHealth.length) return 0;
    
    const scores = systemsHealth.map(s => s.overall_score);
    const avg = scores.reduce((acc, score) => acc + score, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - avg, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = better balance (scale 0-1)
    return Math.max(0, 1 - (standardDeviation / 5));
  },

  // Generate system health summary
  generateHealthSummary: (systemsHealth: any[]): string => {
    const overallScore = lifeSystemsUtils.calculateOverallScore(systemsHealth);
    const weakest = lifeSystemsUtils.identifyWeakestSystem(systemsHealth);
    const strongest = lifeSystemsUtils.identifyStrongestSystem(systemsHealth);
    const balance = lifeSystemsUtils.getSystemBalance(systemsHealth);

    let summary = `Overall life architecture: ${lifeSystemsUtils.formatHealthScore(overallScore)} (${overallScore.toFixed(1)}/10)`;
    
    if (weakest) {
      summary += `\nHighest leverage opportunity: ${lifeSystemsUtils.getSystemDisplayName(weakest)}`;
    }
    
    if (strongest && strongest !== weakest) {
      summary += `\nStrongest foundation: ${lifeSystemsUtils.getSystemDisplayName(strongest)}`;
    }
    
    summary += `\nSystem balance: ${(balance * 100).toFixed(0)}%`;
    
    return summary;
  },

  // Validate system interconnection data
  validateSystemData: (systemData: any): boolean => {
    const requiredFields = ['system_type', 'current_state', 'target_state'];
    return requiredFields.every(field => field in systemData);
  },
};