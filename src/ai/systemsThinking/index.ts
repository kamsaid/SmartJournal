// Export systems thinking analysis
export { default as systemsThinking } from '../systemsThinking';
export type {
  SystemsThinkingAnalysis,
  SystemsMap,
  CausalAnalysis,
  DesignThinkingAnalysis,
} from '../systemsThinking';

// Systems thinking utilities
export const systemsThinkingUtils = {
  // Get level description
  getLevelDescription: (level: string): string => {
    const descriptions = {
      novice: 'Beginning to see connections and patterns',
      developing: 'Growing awareness of system relationships',
      proficient: 'Comfortable with systems perspective and analysis',
      advanced: 'Sophisticated understanding of complex systems',
      expert: 'Master of systems thinking and life architecture',
    };
    return descriptions[level as keyof typeof descriptions] || level;
  },

  // Get level color
  getLevelColor: (level: string): string => {
    const colors = {
      novice: '#EF4444',     // Red
      developing: '#F59E0B', // Amber
      proficient: '#3B82F6', // Blue
      advanced: '#22C55E',   // Green
      expert: '#8B5CF6',     // Purple
    };
    return colors[level as keyof typeof colors] || '#6B73FF';
  },

  // Calculate component balance
  calculateComponentBalance: (componentScores: any): number => {
    const scores = Object.values(componentScores) as number[];
    const avg = scores.reduce((acc, score) => acc + score, 0) / scores.length;
    const variance = scores.reduce((acc, score) => acc + Math.pow(score - avg, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Lower standard deviation = better balance (scale 0-1)
    return Math.max(0, 1 - (standardDeviation / 0.5));
  },

  // Identify strongest component
  getStrongestComponent: (componentScores: any): string => {
    const entries = Object.entries(componentScores) as [string, number][];
    const strongest = entries.reduce((max, [component, score]) => 
      score > max[1] ? [component, score] : max
    );
    return strongest[0].replace('_', ' ');
  },

  // Identify weakest component
  getWeakestComponent: (componentScores: any): string => {
    const entries = Object.entries(componentScores) as [string, number][];
    const weakest = entries.reduce((min, [component, score]) => 
      score < min[1] ? [component, score] : min
    );
    return weakest[0].replace('_', ' ');
  },

  // Format systems thinking score
  formatScore: (score: number): string => {
    const percentage = (score * 100).toFixed(0);
    if (score >= 0.8) return `${percentage}% (Expert Level)`;
    if (score >= 0.6) return `${percentage}% (Advanced)`;
    if (score >= 0.4) return `${percentage}% (Proficient)`;
    if (score >= 0.2) return `${percentage}% (Developing)`;
    return `${percentage}% (Novice)`;
  },

  // Generate development summary
  generateDevelopmentSummary: (analysis: any): string => {
    const level = analysis.growth_trajectory;
    const score = (analysis.systems_thinking_score * 100).toFixed(0);
    const strongest = systemsThinkingUtils.getStrongestComponent(analysis.component_scores);
    const weakest = systemsThinkingUtils.getWeakestComponent(analysis.component_scores);
    
    return `Systems Thinking Level: ${level} (${score}%)
Strongest capability: ${strongest}
Development opportunity: ${weakest}
Next focus: ${analysis.next_development_steps[0] || 'Continue practicing'}`;
  },

  // Validate systems thinking analysis
  validateAnalysis: (analysis: any): {
    isValid: boolean;
    issues: string[];
  } => {
    const issues: string[] = [];
    
    if (!analysis.component_scores || Object.keys(analysis.component_scores).length !== 7) {
      issues.push('Missing or incomplete component scores');
    }
    
    if (analysis.systems_thinking_score < 0 || analysis.systems_thinking_score > 1) {
      issues.push('Systems thinking score must be between 0 and 1');
    }
    
    if (!analysis.growth_trajectory || !['novice', 'developing', 'proficient', 'advanced', 'expert'].includes(analysis.growth_trajectory)) {
      issues.push('Invalid growth trajectory');
    }
    
    if (!analysis.next_development_steps || analysis.next_development_steps.length === 0) {
      issues.push('Must provide next development steps');
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  },

  // Calculate growth velocity
  calculateGrowthVelocity: (currentScore: number, previousScore: number, timeDiff: number): number => {
    if (timeDiff <= 0) return 0;
    return (currentScore - previousScore) / timeDiff;
  },

  // Predict mastery timeline
  predictMasteryTimeline: (currentScore: number, growthVelocity: number): {
    proficient_eta: string;
    advanced_eta: string;
    expert_eta: string;
  } => {
    const monthsToScore = (targetScore: number) => {
      if (growthVelocity <= 0) return 'Unknown';
      const monthsNeeded = Math.ceil((targetScore - currentScore) / growthVelocity);
      return monthsNeeded > 60 ? '5+ years' : `${monthsNeeded} months`;
    };

    return {
      proficient_eta: currentScore >= 0.4 ? 'Achieved' : monthsToScore(0.4),
      advanced_eta: currentScore >= 0.6 ? 'Achieved' : monthsToScore(0.6),
      expert_eta: currentScore >= 0.8 ? 'Achieved' : monthsToScore(0.8),
    };
  },

  // Generate personalized exercises
  generatePersonalizedExercises: (level: string, weakComponents: string[]): any[] => {
    const exercises = [];
    
    // Level-based exercises
    switch (level) {
      case 'novice':
        exercises.push({
          type: 'observation',
          title: 'System Spotting',
          description: 'Identify 3 systems you interact with daily',
          difficulty: 'easy',
        });
        break;
      case 'developing':
        exercises.push({
          type: 'mapping',
          title: 'Connection Mapping',
          description: 'Map connections between your health and other life areas',
          difficulty: 'medium',
        });
        break;
      case 'proficient':
        exercises.push({
          type: 'analysis',
          title: 'Leverage Point Hunt',
          description: 'Identify the highest leverage point in your current challenges',
          difficulty: 'medium',
        });
        break;
      case 'advanced':
        exercises.push({
          type: 'design',
          title: 'System Redesign',
          description: 'Completely redesign one of your life systems',
          difficulty: 'hard',
        });
        break;
      case 'expert':
        exercises.push({
          type: 'teaching',
          title: 'Teaching Systems Thinking',
          description: 'Explain systems thinking to someone else',
          difficulty: 'hard',
        });
        break;
    }

    // Component-specific exercises
    weakComponents.forEach(component => {
      switch (component.replace(' ', '_')) {
        case 'causal_thinking':
          exercises.push({
            type: 'analysis',
            title: '5 Whys Practice',
            description: 'For any problem, ask "why" 5 times to find root causes',
            difficulty: 'easy',
          });
          break;
        case 'interconnection_awareness':
          exercises.push({
            type: 'mapping',
            title: 'Life Systems Web',
            description: 'Draw how all your life systems connect to each other',
            difficulty: 'medium',
          });
          break;
        case 'design_orientation':
          exercises.push({
            type: 'design',
            title: 'Daily Design Challenge',
            description: 'Redesign one small aspect of your daily routine',
            difficulty: 'medium',
          });
          break;
      }
    });

    return exercises.slice(0, 3); // Return top 3 exercises
  },
};