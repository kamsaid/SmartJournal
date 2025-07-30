// Export AI services and engines
export { default as wisdomEngine } from './wisdomEngine';
export { default as socraticEngine } from './wisdomEngine'; // Legacy export for backward compatibility
export { default as patternRecognition } from './patternRecognition';

// Re-export AI orchestrator and prompts
export { aiOrchestrator, aiUtils, aiPatterns } from '@/services/openai';
export { default as masterPrompts } from './prompts/masterPrompts';

// Export types
export type {
  QuestionContext,
  GeneratedQuestion,
  QuestionResponse,
} from './wisdomEngine';

export type {
  PatternAnalysis,
  PatternCluster,
  PatternEvolution,
  PatternInsight,
} from './patternRecognition';

// AI system utilities
export const aiSystemUtils = {
  // Calculate overall AI engagement score
  calculateEngagementScore: (
    reflectionDepth: number,
    emotionalResonance: number,
    breakthroughCount: number
  ): number => {
    return (reflectionDepth * 0.4 + emotionalResonance * 0.3 + breakthroughCount * 0.3) / 10;
  },

  // Determine optimal question depth for user
  getOptimalQuestionDepth: (userPhase: number, avgResponseDepth: number): number => {
    const baseDepth = Math.floor(userPhase / 2) + 3; // Phase-based baseline
    const depthAdjustment = avgResponseDepth < 5 ? -1 : avgResponseDepth > 7 ? 1 : 0;
    return Math.max(1, Math.min(10, baseDepth + depthAdjustment));
  },

  // Assess breakthrough potential
  assessBreakthroughPotential: (
    patterns: any[],
    questionDepth: number,
    userReadiness: number
  ): number => {
    const patternComplexity = patterns.length * 0.1;
    const depthFactor = questionDepth / 10;
    const readinessFactor = userReadiness;
    
    return Math.min(1, (patternComplexity + depthFactor + readinessFactor) / 3);
  },

  // Generate insight confidence score
  calculateInsightConfidence: (
    evidenceCount: number,
    patternStrength: number,
    aiConfidence: number
  ): number => {
    const evidenceScore = Math.min(1, evidenceCount / 5); // Max at 5 pieces of evidence
    const patternScore = patternStrength;
    const aiScore = aiConfidence;
    
    return (evidenceScore * 0.3 + patternScore * 0.4 + aiScore * 0.3);
  },

  // Validate AI response quality
  validateAIResponse: (response: string, expectedType: string): {
    isValid: boolean;
    quality: number;
    issues: string[];
  } => {
    const issues: string[] = [];
    let quality = 1.0;

    // Check length
    if (response.length < 20) {
      issues.push('Response too short');
      quality -= 0.3;
    }
    if (response.length > 1000) {
      issues.push('Response too long');
      quality -= 0.2;
    }

    // Check for AI disclaimers
    const disclaimers = ['as an ai', 'i cannot', 'i am not able'];
    if (disclaimers.some(d => response.toLowerCase().includes(d))) {
      issues.push('Contains AI disclaimers');
      quality -= 0.4;
    }

    // Check for question marks (for wisdom questions)
    if (expectedType === 'question' && !response.includes('?')) {
      issues.push('Question should contain question mark');
      quality -= 0.3;
    }

    // Check depth indicators
    const depthWords = ['why', 'how', 'what if', 'imagine', 'consider'];
    const depthCount = depthWords.filter(word => 
      response.toLowerCase().includes(word)
    ).length;
    
    if (expectedType === 'question' && depthCount === 0) {
      issues.push('Lacks depth indicators');
      quality -= 0.2;
    }

    return {
      isValid: quality > 0.5,
      quality: Math.max(0, quality),
      issues,
    };
  },

  // Extract key concepts from AI response
  extractKeyConcepts: (response: string): string[] => {
    const concepts: string[] = [];
    
    // Common life architecture concepts
    const conceptPatterns = [
      /system[s]?\s+(\w+)/gi,
      /pattern[s]?\s+of\s+(\w+)/gi,
      /leverage\s+(\w+)/gi,
      /design[s]?\s+(\w+)/gi,
      /architect[s]?\s+(\w+)/gi,
    ];

    conceptPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        concepts.push(...matches.map(match => match.trim()));
      }
    });

    // Remove duplicates and return top concepts
    return [...new Set(concepts)].slice(0, 5);
  },

  // Generate follow-up question suggestions
  generateFollowUpSuggestions: (
    userResponse: string,
    currentDepth: number,
    patterns: string[]
  ): string[] => {
    const suggestions: string[] = [];

    // Depth-based follow-ups
    if (currentDepth < 5) {
      suggestions.push('What assumptions might you be making here?');
    }
    if (currentDepth < 7) {
      suggestions.push('How does this connect to other areas of your life?');
    }
    if (currentDepth >= 7) {
      suggestions.push('What would you design differently knowing this?');
    }

    // Pattern-based follow-ups
    if (patterns.length > 0) {
      suggestions.push(`How does this relate to your ${patterns[0]} pattern?`);
    }

    // Response-specific follow-ups
    if (userResponse.toLowerCase().includes('difficult') || userResponse.toLowerCase().includes('hard')) {
      suggestions.push('What would make this easier or more natural?');
    }

    if (userResponse.toLowerCase().includes('always') || userResponse.toLowerCase().includes('never')) {
      suggestions.push('What would have to be true for the opposite to happen?');
    }

    return suggestions.slice(0, 3);
  },
};