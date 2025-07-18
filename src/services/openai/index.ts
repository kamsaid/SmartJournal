import config from '@/constants/config';

// Export AI orchestrator and related services
export { default as aiOrchestrator } from './aiOrchestrator';
export type { AIContext, AIResponse } from './aiOrchestrator';

// Export prompt templates
export { default as masterPrompts } from '@/ai/prompts/masterPrompts';

// AI service utilities
export const aiUtils = {
  // Check if OpenAI API key is configured
  isConfigured: () => {
    return !!config.openai.apiKey;
  },

  // Validate AI response quality
  validateResponse: (response: string): boolean => {
    return (
      response.length > 10 &&
      response.length < 2000 &&
      !response.toLowerCase().includes('i cannot') &&
      !response.toLowerCase().includes('as an ai')
    );
  },

  // Extract questions from AI response
  extractQuestions: (response: string): string[] => {
    const questionRegex = /[.!?]\s*([^.!?]*\?)/g;
    const matches = response.match(questionRegex);
    return matches?.map(q => q.trim()) || [];
  },

  // Calculate response depth score
  calculateDepthScore: (response: string): number => {
    const depthIndicators = [
      'why', 'what if', 'how might', 'pattern', 'system',
      'underneath', 'root cause', 'leverage', 'design',
      'architecture', 'belief', 'assumption'
    ];

    const score = depthIndicators.reduce((acc, indicator) => {
      const count = (response.toLowerCase().match(new RegExp(indicator, 'g')) || []).length;
      return acc + count;
    }, 0);

    return Math.min(score / 3, 10); // Normalize to 0-10 scale
  },
};

// Common AI interaction patterns
export const aiPatterns = {
  // Generate context-aware prompt
  buildContextPrompt: (basePrompt: string, userContext: any): string => {
    return `${basePrompt}\n\nUser Context: ${JSON.stringify(userContext, null, 2)}`;
  },

  // Format AI response for display
  formatResponse: (response: string): string => {
    return response
      .trim()
      .replace(/\n\n+/g, '\n\n') // Clean up excessive newlines
      .replace(/^["']|["']$/g, ''); // Remove surrounding quotes
  },

  // Extract actionable insights
  extractInsights: (response: string): string[] => {
    const insightPatterns = [
      /(?:insight|realize|understand|recognize|see that):\s*([^.!?]+)/gi,
      /(?:key|important|crucial|vital):\s*([^.!?]+)/gi,
      /(?:pattern|trend|theme):\s*([^.!?]+)/gi,
    ];

    const insights: string[] = [];
    insightPatterns.forEach(pattern => {
      const matches = response.match(pattern);
      if (matches) {
        insights.push(...matches.map(match => match.trim()));
      }
    });

    return insights.filter(insight => insight.length > 20);
  },
};