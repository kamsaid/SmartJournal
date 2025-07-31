// Export leverage engine
export { default as leverageEngine } from './leverageEngine';
export type {
  LeverageAnalysis,
  LeverageMap,
  InterventionStrategy,
} from './leverageEngine';

// Leverage utilities
export const leverageUtils = {
  // Calculate leverage ratio
  calculateLeverageRatio: (impact: number, effort: number): number => {
    return effort > 0 ? impact / effort : impact;
  },

  // Categorize leverage ratio
  categorizeLeverageRatio: (ratio: number): string => {
    if (ratio >= 2.5) return 'Ultra High';
    if (ratio >= 2.0) return 'Very High';
    if (ratio >= 1.5) return 'High';
    if (ratio >= 1.0) return 'Medium';
    return 'Low';
  },

  // Get leverage type description
  getLeverageTypeDescription: (type: string): string => {
    const descriptions = {
      keystone: 'Habits that automatically trigger positive changes in other areas',
      bottleneck: 'Constraints that when removed unlock significant capacity',
      multiplier: 'Changes that amplify the effectiveness of other systems',
      gateway: 'Entry points that lead naturally to bigger transformations',
      catalyst: 'Interventions that accelerate transformation across all systems',
    };
    return descriptions[type as keyof typeof descriptions] || type;
  },

  // Get leverage type icon
  getLeverageTypeIcon: (type: string): string => {
    const icons = {
      keystone: '🗝️',
      bottleneck: '🚰',
      multiplier: '📈',
      gateway: '🚪',
      catalyst: '⚡',
    };
    return icons[type as keyof typeof icons] || '🎯';
  },

  // Get leverage type color using Duson palette
  getLeverageTypeColor: (type: string): string => {
    const colors = {
      keystone: '#FFB000',   // Duson Golden Yellow for keystone opportunities
      bottleneck: '#FD1F4A', // Duson Coral Red for bottlenecks/obstacles
      multiplier: '#FFB000', // Duson Golden Yellow for multipliers
      gateway: '#FFCA5C',    // Lighter golden for gateways
      catalyst: '#FD1F4A',   // Duson Coral Red for catalysts/action
    };
    return colors[type as keyof typeof colors] || '#FFB000';
  },

  // Format impact score for display
  formatImpactScore: (score: number): string => {
    const percentage = (score * 100).toFixed(0);
    if (score >= 0.8) return `${percentage}% (High)`;
    if (score >= 0.6) return `${percentage}% (Medium)`;
    if (score >= 0.4) return `${percentage}% (Low)`;
    return `${percentage}% (Minimal)`;
  },

  // Format effort required for display
  formatEffortRequired: (effort: number): string => {
    if (effort <= 0.3) return 'Low Effort';
    if (effort <= 0.6) return 'Medium Effort';
    return 'High Effort';
  },

  // Calculate compound effect potential
  calculateCompoundPotential: (
    cascadePotential: number,
    affectedSystemsCount: number,
    timeToImpact: string
  ): number => {
    const systemFactor = Math.min(affectedSystemsCount / 6, 1); // Max 6 systems
    const timeFactor = timeToImpact === 'immediate' ? 1 : 
                      timeToImpact === 'weeks' ? 0.8 : 
                      timeToImpact === 'months' ? 0.6 : 0.4;
    
    return cascadePotential * systemFactor * timeFactor;
  },

  // Generate leverage point summary
  generateLeveragePointSummary: (leveragePoint: any): string => {
    const ratio = leverageUtils.calculateLeverageRatio(
      leveragePoint.impact_score,
      leveragePoint.effort_required
    );
    
    return `${leveragePoint.intervention_name} (${leveragePoint.leverage_type})
Impact: ${leverageUtils.formatImpactScore(leveragePoint.impact_score)}
Effort: ${leverageUtils.formatEffortRequired(leveragePoint.effort_required)}
Leverage Ratio: ${ratio.toFixed(1)}x (${leverageUtils.categorizeLeverageRatio(ratio)})
Affects: ${leveragePoint.affected_systems.length} life systems`;
  },

  // Prioritize leverage points
  prioritizeLeveragePoints: (leveragePoints: any[]): any[] => {
    return leveragePoints.sort((a, b) => {
      // Primary sort: leverage ratio
      const ratioA = leverageUtils.calculateLeverageRatio(a.impact_score, a.effort_required);
      const ratioB = leverageUtils.calculateLeverageRatio(b.impact_score, b.effort_required);
      
      if (Math.abs(ratioA - ratioB) > 0.2) {
        return ratioB - ratioA;
      }
      
      // Secondary sort: cascade potential
      if (Math.abs(a.cascade_potential - b.cascade_potential) > 0.1) {
        return b.cascade_potential - a.cascade_potential;
      }
      
      // Tertiary sort: number of affected systems
      return b.affected_systems.length - a.affected_systems.length;
    });
  },

  // Validate leverage analysis data
  validateLeverageAnalysis: (analysis: any): {
    isValid: boolean;
    issues: string[];
  } => {
    const issues: string[] = [];
    
    if (!analysis.intervention_name || analysis.intervention_name.length < 3) {
      issues.push('Intervention name is required and must be descriptive');
    }
    
    if (analysis.impact_score < 0 || analysis.impact_score > 1) {
      issues.push('Impact score must be between 0 and 1');
    }
    
    if (analysis.effort_required < 0 || analysis.effort_required > 1) {
      issues.push('Effort required must be between 0 and 1');
    }
    
    if (!analysis.affected_systems || analysis.affected_systems.length === 0) {
      issues.push('Must specify at least one affected system');
    }
    
    if (!analysis.compound_effects || analysis.compound_effects.length === 0) {
      issues.push('Must specify expected compound effects');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  },

  // Generate implementation timeline
  generateImplementationTimeline: (leveragePoint: any): {
    phase: string;
    duration: string;
    milestones: string[];
  }[] => {
    const baseTimeline = [
      {
        phase: 'Setup & Design',
        duration: '1 week',
        milestones: ['Assessment complete', 'System designed', 'Environment prepared'],
      },
      {
        phase: 'Initial Implementation',
        duration: '2-3 weeks',
        milestones: ['Habit initiated', 'Consistency building', 'First improvements visible'],
      },
      {
        phase: 'Stabilization',
        duration: '3-4 weeks',
        milestones: ['Automatic execution', 'Resistance overcome', 'Identity shift beginning'],
      },
      {
        phase: 'Compound Effects',
        duration: '2-3 months',
        milestones: ['Spillover effects', 'System integration', 'Measurable transformation'],
      },
    ];

    // Adjust timeline based on complexity
    if (leveragePoint.implementation_difficulty === 'low') {
      baseTimeline.forEach(phase => {
        phase.duration = phase.duration.replace(/(\d+)/g, (match) => 
          Math.max(1, parseInt(match) - 1).toString()
        );
      });
    } else if (leveragePoint.implementation_difficulty === 'high') {
      baseTimeline.forEach(phase => {
        phase.duration = phase.duration.replace(/(\d+)/g, (match) => 
          (parseInt(match) + 1).toString()
        );
      });
    }

    return baseTimeline;
  },
};