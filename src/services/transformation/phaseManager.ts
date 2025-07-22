import {
  User,
  Phase,
  DailyReflection,
  SocraticConversation,
  TransformationPhase,
} from '@/types/database';
import { transformationService } from '@/services/supabase';
import { socraticEngine } from '@/ai/socraticEngine';
import { aiOrchestrator } from '@/services/openai';

export interface PhaseMetrics {
  phase_number: TransformationPhase;
  days_in_phase: number;
  reflection_depth_average: number;
  breakthrough_count: number;
  pattern_recognition_score: number;
  systems_thinking_indicators: number;
  completion_readiness_score: number;
  key_insights: string[];
  remaining_milestones: string[];
}

export interface PhaseCompletionCriteria {
  minimum_days: number;
  required_depth_average: number;
  required_breakthroughs: number;
  required_insights: string[];
  systems_thinking_threshold: number;
  readiness_threshold: number;
}

export interface PhaseTransition {
  from_phase: TransformationPhase;
  to_phase: TransformationPhase;
  transition_trigger: string;
  celebration_message: string;
  next_phase_preview: string;
  recommended_focus_areas: string[];
}

export interface PhaseAssessment {
  phase_number: TransformationPhase;
  readiness_score: number;
  confidence_level: number;
  assessment_date: string;
  breakthrough_indicators: string[];
  growth_areas: string[];
  recommended_actions: string[];
  estimated_completion_days: number;
}

export interface DynamicContent {
  content_type: 'question' | 'insight' | 'challenge' | 'reflection' | 'guidance';
  content: string;
  phase_relevance: number;
  user_readiness_level: number;
  expected_impact: 'low' | 'medium' | 'high';
  delivery_timing: 'immediate' | 'next_session' | 'phase_milestone';
}

// Define completion criteria for each phase
const PHASE_COMPLETION_CRITERIA: Record<TransformationPhase, PhaseCompletionCriteria> = {
  1: {
    minimum_days: 7,
    required_depth_average: 5,
    required_breakthroughs: 2,
    required_insights: [
      'Recognition of reactive vs proactive patterns',
      'Awareness of problem-solving vs system-building mindset',
      'Understanding that current approaches may be limiting',
    ],
    systems_thinking_threshold: 0.3,
    readiness_threshold: 0.7,
  },
  2: {
    minimum_days: 10,
    required_depth_average: 6,
    required_breakthroughs: 3,
    required_insights: [
      'Identification of high-leverage activities',
      'Recognition of interconnected life systems',
      'Understanding of compound effects',
    ],
    systems_thinking_threshold: 0.5,
    readiness_threshold: 0.75,
  },
  3: {
    minimum_days: 14,
    required_depth_average: 7,
    required_breakthroughs: 4,
    required_insights: [
      'Shift from symptom-solving to root cause analysis',
      'Recognition of personal meta-patterns',
      'Understanding of system design opportunities',
    ],
    systems_thinking_threshold: 0.7,
    readiness_threshold: 0.8,
  },
  4: {
    minimum_days: 21,
    required_depth_average: 7.5,
    required_breakthroughs: 5,
    required_insights: [
      'Problems reframed as design challenges',
      'Systems that create inevitable outcomes',
      'Personal agency in outcome architecture',
    ],
    systems_thinking_threshold: 0.8,
    readiness_threshold: 0.85,
  },
  5: {
    minimum_days: 21,
    required_depth_average: 8,
    required_breakthroughs: 6,
    required_insights: [
      'Vision of compound transformation potential',
      'Understanding of exponential vs linear change',
      'Recognition of previously impossible possibilities',
    ],
    systems_thinking_threshold: 0.85,
    readiness_threshold: 0.9,
  },
  6: {
    minimum_days: 30,
    required_depth_average: 8.5,
    required_breakthroughs: 8,
    required_insights: [
      'Daily practice of systems thinking',
      'Integration across all life areas',
      'Consistent architectural approach to challenges',
    ],
    systems_thinking_threshold: 0.9,
    readiness_threshold: 0.95,
  },
  7: {
    minimum_days: 42,
    required_depth_average: 9,
    required_breakthroughs: 10,
    required_insights: [
      'Complete identity shift to life architect',
      'Mastery of meta-skill application',
      'Wisdom integration and sharing capability',
    ],
    systems_thinking_threshold: 0.95,
    readiness_threshold: 1.0,
  },
};

// Phase-specific milestones and focus areas
const PHASE_MILESTONES: Record<TransformationPhase, string[]> = {
  1: [
    'Recognize the difference between reactive and proactive approaches',
    'Identify at least 3 recurring problems in your life',
    'Understand why quick fixes haven\'t created lasting change',
    'Begin questioning underlying assumptions',
  ],
  2: [
    'Identify high-leverage activities in each life area',
    'Recognize connections between different life systems',
    'Understand compound effects of small changes',
    'Begin thinking in terms of systems rather than isolated problems',
  ],
  3: [
    'Consistently ask "what system creates this outcome?"',
    'Identify root causes rather than symptoms',
    'Recognize personal meta-patterns across life areas',
    'Begin designing system-level solutions',
  ],
  4: [
    'Reframe problems as design challenges automatically',
    'Create systems that make desired outcomes inevitable',
    'Experience the power of architectural thinking',
    'Build confidence in outcome design capabilities',
  ],
  5: [
    'Envision exponential transformation potential',
    'Design systems for previously impossible outcomes',
    'Understand compound effects across time',
    'Develop mastery-level vision for life architecture',
  ],
  6: [
    'Practice daily systems thinking across all life areas',
    'Integrate architectural approach into daily decisions',
    'Maintain systems perspective under pressure',
    'Demonstrate consistent life design mastery',
  ],
  7: [
    'Embody the identity of a life systems architect',
    'Apply meta-skill to continuously evolving challenges',
    'Share wisdom and guide others\' transformations',
    'Continue evolving and refining life architecture',
  ],
};

export const phaseManager = {
  // Assess current phase metrics
  assessPhaseProgress: async (userId: string): Promise<PhaseMetrics> => {
    try {
      const userSummary = await transformationService.getUserTransformationSummary(userId);
      
      // Handle case where user doesn't exist yet
      if (!userSummary.user) {
        return {
          phase_number: 1,
          days_in_phase: 0,
          reflection_depth_average: 0,
          breakthrough_count: 0,
          pattern_recognition_score: 0,
          systems_thinking_indicators: 0,
          completion_readiness_score: 0,
          key_insights: [],
          remaining_milestones: PHASE_MILESTONES[1],
        };
      }

      const currentPhase = await transformationService.getCurrentPhase(userId);
      
      // Handle case where no active phase exists - create default phase 1 data
      if (!currentPhase) {
        return {
          phase_number: 1,
          days_in_phase: 0,
          reflection_depth_average: 0,
          breakthrough_count: 0,
          pattern_recognition_score: 0,
          systems_thinking_indicators: 0,
          completion_readiness_score: 0,
          key_insights: [],
          remaining_milestones: PHASE_MILESTONES[1],
        };
      }

      const recentReflections = await transformationService.getRecentReflections(userId, 30);
      const conversations = await transformationService.getUserConversations(userId, 10);

      const metrics = calculatePhaseMetrics(currentPhase, recentReflections, conversations);
      
      return metrics;
    } catch (error) {
      console.error('Error in assessPhaseProgress:', error);
      // Return safe default if anything fails
      return {
        phase_number: 1,
        days_in_phase: 0,
        reflection_depth_average: 0,
        breakthrough_count: 0,
        pattern_recognition_score: 0,
        systems_thinking_indicators: 0,
        completion_readiness_score: 0,
        key_insights: [],
        remaining_milestones: PHASE_MILESTONES[1],
      };
    }
  },

  // Check if user is ready to advance to next phase
  checkPhaseCompletion: async (userId: string): Promise<{
    isReady: boolean;
    completionScore: number;
    missingCriteria: string[];
    recommendations: string[];
  }> => {
    const metrics = await phaseManager.assessPhaseProgress(userId);
    const criteria = PHASE_COMPLETION_CRITERIA[metrics.phase_number];

    const checks = {
      daysCheck: metrics.days_in_phase >= criteria.minimum_days,
      depthCheck: metrics.reflection_depth_average >= criteria.required_depth_average,
      breakthroughCheck: metrics.breakthrough_count >= criteria.required_breakthroughs,
      systemsThinkingCheck: metrics.systems_thinking_indicators >= criteria.systems_thinking_threshold,
      readinessCheck: metrics.completion_readiness_score >= criteria.readiness_threshold,
    };

    const completionScore = Object.values(checks).filter(Boolean).length / Object.keys(checks).length;
    const isReady = completionScore >= 0.8; // 80% of criteria must be met

    const missingCriteria = [];
    const recommendations = [];

    if (!checks.daysCheck) {
      missingCriteria.push(`Need ${criteria.minimum_days - metrics.days_in_phase} more days in phase`);
      recommendations.push('Continue daily practice and reflection');
    }
    if (!checks.depthCheck) {
      missingCriteria.push('Need deeper reflection responses');
      recommendations.push('Spend more time contemplating questions before answering');
    }
    if (!checks.breakthroughCheck) {
      missingCriteria.push('Need more breakthrough insights');
      recommendations.push('Explore patterns and connections you haven\'t considered');
    }
    if (!checks.systemsThinkingCheck) {
      missingCriteria.push('Need more systems thinking demonstration');
      recommendations.push('Focus on interconnections between life areas');
    }

    return {
      isReady,
      completionScore,
      missingCriteria,
      recommendations,
    };
  },

  // Advance user to next phase
  advanceToNextPhase: async (userId: string): Promise<PhaseTransition> => {
    const completionCheck = await phaseManager.checkPhaseCompletion(userId);
    
    if (!completionCheck.isReady) {
      throw new Error('User not ready for phase advancement');
    }

    const currentPhase = await transformationService.getCurrentPhase(userId);
    if (!currentPhase) throw new Error('No active phase found');

    // Complete current phase
    const { completedPhase, nextPhase } = await transformationService.completePhase(
      currentPhase.id,
      userId
    );

    if (!nextPhase) {
      // User has completed all phases
      return {
        from_phase: completedPhase.phase_number,
        to_phase: 7,
        transition_trigger: 'transformation_complete',
        celebration_message: generateCompletionCelebration(completedPhase),
        next_phase_preview: 'You have completed your transformation journey into a Life Systems Architect!',
        recommended_focus_areas: ['Continuous evolution', 'Sharing wisdom', 'Advanced mastery'],
      };
    }

    // Create transition
    const transition: PhaseTransition = {
      from_phase: completedPhase.phase_number,
      to_phase: nextPhase.phase_number,
      transition_trigger: 'criteria_met',
      celebration_message: generatePhaseCelebration(completedPhase, nextPhase),
      next_phase_preview: generatePhasePreview(nextPhase.phase_number),
      recommended_focus_areas: PHASE_MILESTONES[nextPhase.phase_number].slice(0, 3),
    };

    return transition;
  },

  // Get phase-specific guidance and content
  getPhaseGuidance: async (userId: string, phase: TransformationPhase) => {
    const milestones = PHASE_MILESTONES[phase];
    const criteria = PHASE_COMPLETION_CRITERIA[phase];
    
    // Generate AI-powered phase guidance
    const user = await transformationService.getUserTransformationSummary(userId);
    const aiResponse = await aiOrchestrator.generateLifeDesign(
      { user: user.user },
      'growth',
      `Provide guidance for Phase ${phase} of transformation`
    );

    return {
      phase_number: phase,
      phase_name: getPhaseName(phase),
      description: getPhaseDescription(phase),
      key_concepts: getPhaseKeyConcepts(phase),
      milestones,
      completion_criteria: criteria,
      ai_guidance: aiResponse.content,
      estimated_duration: `${criteria.minimum_days}-${criteria.minimum_days * 2} days`,
      success_indicators: generateSuccessIndicators(phase),
    };
  },

  // Handle phase regression if needed
  assessPhaseRegression: async (userId: string): Promise<{
    needsRegression: boolean;
    suggestedPhase?: TransformationPhase;
    reason?: string;
  }> => {
    const metrics = await phaseManager.assessPhaseProgress(userId);
    const currentPhase = metrics.phase_number;

    // Check if user is consistently underperforming for their current phase
    if (metrics.reflection_depth_average < (PHASE_COMPLETION_CRITERIA[currentPhase].required_depth_average - 2)) {
      return {
        needsRegression: true,
        suggestedPhase: Math.max(1, currentPhase - 1) as TransformationPhase,
        reason: 'Reflection depth significantly below phase requirements',
      };
    }

    if (metrics.systems_thinking_indicators < (PHASE_COMPLETION_CRITERIA[currentPhase].systems_thinking_threshold - 0.3)) {
      return {
        needsRegression: true,
        suggestedPhase: Math.max(1, currentPhase - 1) as TransformationPhase,
        reason: 'Systems thinking capabilities below phase requirements',
      };
    }

    return { needsRegression: false };
  },

  // Generate personalized next steps based on current phase progress
  generateNextSteps: async (userId: string): Promise<string[]> => {
    const metrics = await phaseManager.assessPhaseProgress(userId);
    const completionCheck = await phaseManager.checkPhaseCompletion(userId);

    if (completionCheck.isReady) {
      return [
        'You\'re ready to advance to the next phase!',
        'Review your key insights from this phase',
        'Prepare for the next level of transformation',
      ];
    }

    return [
      ...completionCheck.recommendations,
      ...generatePhaseSpecificSteps(metrics),
    ];
  },

  // Real-time phase assessment based on latest user responses
  performRealTimeAssessment: async (
    userId: string,
    latestReflection?: DailyReflection
  ): Promise<PhaseAssessment> => {
    try {
      const metrics = await phaseManager.assessPhaseProgress(userId);
      const userSummary = await transformationService.getUserTransformationSummary(userId);
      
      // Handle case where user doesn't exist yet - return default assessment
      if (!userSummary.user) {
        return {
          phase_number: 1,
          readiness_score: 0,
          confidence_level: 0.5,
          assessment_date: new Date().toISOString(),
          breakthrough_indicators: [],
          growth_areas: ['Complete initial setup to begin transformation journey'],
          recommended_actions: ['Set up your user profile', 'Start with Phase 1 - Recognition'],
          estimated_completion_days: 7,
        };
      }
      
      // Analyze latest responses for breakthrough indicators
      const breakthroughIndicators = [];
      const growthAreas = [];
      
      if (latestReflection) {
        // AI analysis of latest reflection for phase progression signals
        const aiContext = { user: userSummary.user };
        const analysisResponse = await aiOrchestrator.recognizePatterns(
          aiContext,
          JSON.stringify(latestReflection.responses)
        );
        
        if (analysisResponse.metadata.patterns_identified) {
          breakthroughIndicators.push(...analysisResponse.metadata.patterns_identified);
        }
      }

      // Calculate dynamic readiness score
      const baseReadiness = metrics.completion_readiness_score;
      const recentProgress = calculateRecentProgressBoost(userSummary.recent_reflections);
      const readinessScore = Math.min(1, baseReadiness + recentProgress);

      // Estimate completion timeline
      const progressRate = calculateProgressRate(userSummary.recent_reflections, metrics.phase_number);
      const estimatedDays = Math.max(1, Math.round((1 - readinessScore) / progressRate));

      return {
        phase_number: metrics.phase_number,
        readiness_score: readinessScore,
        confidence_level: calculateAssessmentConfidence(userSummary.recent_reflections),
        assessment_date: new Date().toISOString(),
        breakthrough_indicators: breakthroughIndicators,
        growth_areas: identifyGrowthAreas(metrics),
        recommended_actions: generateRecommendedActions(metrics, readinessScore),
        estimated_completion_days: estimatedDays,
      };
    } catch (error) {
      console.error('Error in performRealTimeAssessment:', error);
      // Return safe default assessment if anything fails
      return {
        phase_number: 1,
        readiness_score: 0,
        confidence_level: 0.5,
        assessment_date: new Date().toISOString(),
        breakthrough_indicators: [],
        growth_areas: ['Unable to assess current progress'],
        recommended_actions: ['Please try again or contact support'],
        estimated_completion_days: 7,
      };
    }
  },

  // Generate dynamic, personalized content based on phase and user state
  generateDynamicContent: async (
    userId: string,
    contentType: DynamicContent['content_type'] = 'question'
  ): Promise<DynamicContent> => {
    const assessment = await phaseManager.performRealTimeAssessment(userId);
    const user = await transformationService.getUserTransformationSummary(userId);
    
    const aiContext = { user: user.user, currentPhase: user.phases.find(p => p.phase_number === assessment.phase_number) };
    
    let contentPrompt = '';
    switch (contentType) {
      case 'question':
        contentPrompt = generatePhaseSpecificQuestionPrompt(assessment);
        break;
      case 'insight':
        contentPrompt = generateInsightPrompt(assessment);
        break;
      case 'challenge':
        contentPrompt = generateChallengePrompt(assessment);
        break;
      case 'reflection':
        contentPrompt = generateReflectionPrompt(assessment);
        break;
      case 'guidance':
        contentPrompt = generateGuidancePrompt(assessment);
        break;
    }

    const aiResponse = await aiOrchestrator.generateSocraticQuestion(aiContext, contentPrompt);

    return {
      content_type: contentType,
      content: aiResponse.content,
      phase_relevance: assessment.readiness_score,
      user_readiness_level: assessment.readiness_score,
      expected_impact: assessment.readiness_score > 0.7 ? 'high' : assessment.readiness_score > 0.4 ? 'medium' : 'low',
      delivery_timing: determineDeliveryTiming(assessment),
    };
  },

  // Track phase milestones and celebrate achievements
  trackMilestone: async (
    userId: string,
    milestoneDescription: string,
    impactLevel: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<void> => {
    const currentPhase = await transformationService.getCurrentPhase(userId);
    if (!currentPhase) return;

    const updatedInsights = [...currentPhase.insights, milestoneDescription];
    
    if (impactLevel === 'high') {
      const updatedBreakthroughs = [...currentPhase.breakthroughs, milestoneDescription];
      await transformationService.updatePhaseProgress(
        currentPhase.id,
        updatedInsights,
        updatedBreakthroughs
      );
    } else {
      await transformationService.updatePhaseProgress(
        currentPhase.id,
        updatedInsights,
        currentPhase.breakthroughs
      );
    }
  },

  // Get phase-specific motivation and encouragement
  getPhaseEncouragement: async (userId: string): Promise<string> => {
    try {
      const assessment = await phaseManager.performRealTimeAssessment(userId);
      const phase = assessment.phase_number;
      const readiness = assessment.readiness_score;

      const encouragementTemplates = {
        1: {
          low: "You're beginning to see the patterns that have been guiding your life. This recognition is the first step toward designing the reality you want.",
          medium: "Your awareness of reactive vs. proactive thinking is growing. You're starting to question assumptions that have limited you for years.",
          high: "You're on the verge of a major breakthrough in understanding how life architects think differently. Keep pushing deeper.",
        },
        2: {
          low: "The leverage principle is becoming clearer to you. Small changes in the right places can transform everything.",
          medium: "You're identifying connections between life areas that most people never see. This systems thinking will accelerate your growth exponentially.",
          high: "Your understanding of leverage is reaching a tipping point. You're ready to start building systems that make success inevitable.",
        },
        3: {
          low: "You're shifting from symptom-solving to root cause analysis. This change in thinking will revolutionize how you approach challenges.",
          medium: "The meta-patterns in your life are becoming visible. You're learning to design solutions at the system level.",
          high: "You're mastering the art of system design. Problems are becoming opportunities for architectural thinking.",
        },
        4: {
          low: "You're beginning to see how problems can be reframed as design challenges. This perspective shift is transformational.",
          medium: "Your ability to create systems that produce inevitable outcomes is developing rapidly. You're becoming unstoppable.",
          high: "You've reached the transformation phase. You're now thinking like a life systems architect. The possibilities are infinite.",
        },
        5: {
          low: "Your vision of what's possible is expanding beyond previous limitations. You're seeing exponential potential.",
          medium: "You're designing outcomes that seemed impossible before. Your architectural thinking is reaching mastery level.",
          high: "You're ready to manifest the life you're truly capable of. Your vision is becoming your reality.",
        },
        6: {
          low: "You're integrating systems thinking into your daily reality. Every decision becomes an architectural choice.",
          medium: "Your life is becoming a masterpiece of intentional design. You're living as the architect you've become.",
          high: "You've achieved the architected life. You're now a master of life systems design.",
        },
        7: {
          low: "You're integrating all phases into a complete transformation. You've become who you were meant to be.",
          medium: "Your journey to becoming a Life Systems Architect is nearly complete. You're embodying the wisdom you've gained.",
          high: "You've completed the transformation. You are now a Life Systems Architect, ready to design unlimited possibilities.",
        },
      };

      const levelKey = readiness < 0.4 ? 'low' : readiness < 0.7 ? 'medium' : 'high';
      const phaseTemplates = encouragementTemplates[phase as keyof typeof encouragementTemplates];
      
      if (phaseTemplates) {
        return phaseTemplates[levelKey as keyof typeof phaseTemplates];
      }

      // Default encouragement if phase not found
      return "You're on a remarkable journey of transformation. Every step forward is building the life you're designing.";
      
    } catch (error) {
      console.error('Error getting phase encouragement:', error);
      // Return default encouragement if anything fails
      return "Welcome to your transformation journey. Take it one step at a time, and trust the process of becoming who you're meant to be.";
    }
  },
};

// Helper functions
function calculatePhaseMetrics(
  phase: Phase,
  reflections: DailyReflection[],
  conversations: SocraticConversation[]
): PhaseMetrics {
  const daysInPhase = Math.floor(
    (Date.now() - new Date(phase.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  const reflectionDepthAverage = reflections.length > 0
    ? reflections.reduce((acc, r) => acc + r.depth_level, 0) / reflections.length
    : 0;

  const breakthroughCount = reflections.reduce(
    (acc, r) => acc + (r.ai_analysis?.patterns_identified?.length || 0), 0
  );

  const systemsThinkingIndicators = calculateSystemsThinkingScore(reflections, conversations);

  return {
    phase_number: phase.phase_number,
    days_in_phase: daysInPhase,
    reflection_depth_average: reflectionDepthAverage,
    breakthrough_count: breakthroughCount,
    pattern_recognition_score: calculatePatternRecognitionScore(reflections),
    systems_thinking_indicators: systemsThinkingIndicators,
    completion_readiness_score: calculateReadinessScore(phase, reflections, conversations),
    key_insights: phase.insights,
    remaining_milestones: PHASE_MILESTONES[phase.phase_number].filter(
      milestone => !phase.insights.some(insight => insight.includes(milestone.split(' ')[0]))
    ),
  };
}

function calculateSystemsThinkingScore(
  reflections: DailyReflection[],
  conversations: SocraticConversation[]
): number {
  // Analyze language patterns for systems thinking indicators
  const systemsKeywords = ['system', 'pattern', 'connection', 'leverage', 'design', 'architecture'];
  
  let totalWords = 0;
  let systemsWords = 0;

  reflections.forEach(reflection => {
    reflection.responses.forEach(response => {
      const words = response.response.toLowerCase().split(' ');
      totalWords += words.length;
      systemsWords += words.filter(word => 
        systemsKeywords.some(keyword => word.includes(keyword))
      ).length;
    });
  });

  return totalWords > 0 ? Math.min(systemsWords / totalWords * 20, 1) : 0;
}

function calculatePatternRecognitionScore(reflections: DailyReflection[]): number {
  const patternIndicators = reflections.reduce(
    (acc, r) => acc + (r.ai_analysis?.patterns_identified?.length || 0), 0
  );
  
  return Math.min(patternIndicators / 10, 1);
}

function calculateReadinessScore(
  phase: Phase,
  reflections: DailyReflection[],
  conversations: SocraticConversation[]
): number {
  const criteria = PHASE_COMPLETION_CRITERIA[phase.phase_number];
  
  // Calculate weighted score based on multiple factors
  const depthScore = reflections.length > 0 
    ? Math.min(reflections.reduce((acc, r) => acc + r.depth_level, 0) / reflections.length / criteria.required_depth_average, 1)
    : 0;
  
  const breakthroughScore = Math.min(
    reflections.reduce((acc, r) => acc + (r.ai_analysis?.patterns_identified?.length || 0), 0) / criteria.required_breakthroughs,
    1
  );

  const systemsScore = calculateSystemsThinkingScore(reflections, conversations);

  return (depthScore * 0.4 + breakthroughScore * 0.3 + systemsScore * 0.3);
}

function generatePhaseCelebration(completedPhase: Phase, nextPhase: Phase): string {
  const phaseNames = {
    1: 'Recognition',
    2: 'Understanding', 
    3: 'Realization',
    4: 'Transformation',
    5: 'Vision',
    6: 'Reality',
    7: 'Integration',
  };

  return `🎉 Congratulations! You've completed Phase ${completedPhase.phase_number}: ${phaseNames[completedPhase.phase_number]}!

You've demonstrated the ${getPhaseName(completedPhase.phase_number).toLowerCase()} and are ready for ${getPhaseName(nextPhase.phase_number)}.

Your transformation continues to deepen. Welcome to Phase ${nextPhase.phase_number}!`;
}

function generateCompletionCelebration(completedPhase: Phase): string {
  return `🏆 TRANSFORMATION COMPLETE! 🏆

You have successfully completed all seven phases of becoming a Life Systems Architect!

You now think in systems, design outcomes, and architect reality. You've joined the rare group of people who don't just live life—they design it.

Your journey of mastery continues...`;
}

function generatePhasePreview(phase: TransformationPhase): string {
  const previews = {
    1: 'You\'ll begin recognizing the fundamental difference between reactive and proactive approaches to life.',
    2: 'You\'ll discover the leverage principle and how small changes can transform everything.',
    3: 'You\'ll shift from fixing problems to eliminating their root causes through system design.',
    4: 'You\'ll experience problems becoming design challenges and success becoming systematic.',
    5: 'You\'ll envision the life you\'re truly capable of through proper system architecture.',
    6: 'You\'ll live daily as a life systems designer, with all areas functioning by design.',
    7: 'You\'ll integrate all learning and become a master of the meta-skill that improves everything.',
  };

  return previews[phase];
}

function getPhaseName(phase: TransformationPhase): string {
  const names = {
    1: 'Recognition - The Two Types of People',
    2: 'Understanding - The Leverage Principle', 
    3: 'Realization - The Meta-Life Loop',
    4: 'Transformation - Infinite Leverage',
    5: 'Vision - The Life You\'re Capable Of',
    6: 'Reality - The Architected Life',
    7: 'Integration - The Complete Transformation',
  };
  return names[phase];
}

function getPhaseDescription(phase: TransformationPhase): string {
  const descriptions = {
    1: 'Awakening to the difference between those who react to life and those who architect it.',
    2: 'Learning to identify the few changes that transform everything through systems thinking.',
    3: 'Transitioning from fixing problems to eliminating their root causes.',
    4: 'Building life systems that make your goals inevitable rather than hopeful.',
    5: 'Seeing what becomes possible with proper system architecture and exponential thinking.',
    6: 'Living daily as a life systems designer with health, wealth, and relationships by design.',
    7: 'Mastering the meta-skill and joining those who architect their reality.',
  };
  return descriptions[phase];
}

function getPhaseKeyConcepts(phase: TransformationPhase): string[] {
  const concepts = {
    1: ['Reactive vs Proactive', 'Problem-solving vs System-building', 'Pattern Recognition', 'Assumption Questioning'],
    2: ['Leverage Points', 'Interconnected Systems', 'Compound Effects', 'Strategic Thinking'],
    3: ['Root Cause Analysis', 'Meta-patterns', 'System Design', 'Architectural Thinking'],
    4: ['Design Challenges', 'Inevitable Outcomes', 'System Architecture', 'Outcome Design'],
    5: ['Exponential Thinking', 'Vision Architecture', 'Impossible Made Possible', 'Compound Transformation'],
    6: ['Daily Systems Practice', 'Integration Mastery', 'Consistent Architecture', 'Design by Default'],
    7: ['Identity Integration', 'Meta-skill Mastery', 'Wisdom Sharing', 'Continuous Evolution'],
  };
  return concepts[phase];
}

function generateSuccessIndicators(phase: TransformationPhase): string[] {
  const indicators = {
    1: ['Asking "why" instead of "how" when problems arise', 'Recognizing patterns in your reactions', 'Questioning long-held assumptions'],
    2: ['Identifying leverage points in daily activities', 'Seeing connections between life areas', 'Thinking systemically about challenges'],
    3: ['Automatically asking about root causes', 'Designing solutions rather than quick fixes', 'Recognizing meta-patterns'],
    4: ['Reframing problems as design opportunities', 'Creating systems for inevitable outcomes', 'Feeling confident in your design abilities'],
    5: ['Envisioning exponential possibilities', 'Designing for compound effects', 'Seeing previously impossible outcomes as achievable'],
    6: ['Living by design rather than default', 'Maintaining systems perspective under pressure', 'Integrating architecture across all life areas'],
    7: ['Embodying architect identity', 'Teaching others systems thinking', 'Continuously evolving your life architecture'],
  };
  return indicators[phase];
}

function generatePhaseSpecificSteps(metrics: PhaseMetrics): string[] {
  const phase = metrics.phase_number;
  
  if (metrics.reflection_depth_average < PHASE_COMPLETION_CRITERIA[phase].required_depth_average) {
    return ['Spend more time reflecting before answering questions', 'Explore the "why" behind your initial responses'];
  }
  
  if (metrics.systems_thinking_indicators < PHASE_COMPLETION_CRITERIA[phase].systems_thinking_threshold) {
    return ['Look for connections between different areas of your life', 'Practice asking "what system creates this outcome?"'];
  }
  
  return ['Continue your current practice', 'Focus on breakthrough insights'];
}

// Enhanced helper functions for real-time assessment
function calculateRecentProgressBoost(recentReflections: any[]): number {
  if (!recentReflections.length) return 0;
  
  const recentDepths = recentReflections.slice(0, 3).map(r => r.depth_level || 0);
  const avgRecentDepth = recentDepths.reduce((acc, depth) => acc + depth, 0) / recentDepths.length;
  
  // Boost if recent reflections show improvement
  const progressBoost = Math.max(0, (avgRecentDepth - 5) / 10);
  return Math.min(0.2, progressBoost); // Max 20% boost
}

function calculateProgressRate(recentReflections: any[], phase: TransformationPhase): number {
  if (!recentReflections.length) return 0.01; // Slow default rate
  
  const avgDepth = recentReflections.reduce((acc, r) => acc + (r.depth_level || 0), 0) / recentReflections.length;
  const phaseBaseRate = 0.02 + (phase * 0.01); // Higher phases progress faster
  
  return phaseBaseRate * (avgDepth / 5); // Scale by reflection quality
}

function calculateAssessmentConfidence(recentReflections: any[]): number {
  if (!recentReflections.length) return 0.5;
  
  const consistency = calculateReflectionConsistency(recentReflections);
  const recency = Math.min(1, recentReflections.length / 5); // More confident with more data
  
  return (consistency + recency) / 2;
}

function calculateReflectionConsistency(reflections: any[]): number {
  if (reflections.length < 2) return 0.5;
  
  const depths = reflections.map(r => r.depth_level || 0);
  const avg = depths.reduce((acc, d) => acc + d, 0) / depths.length;
  const variance = depths.reduce((acc, d) => acc + Math.pow(d - avg, 2), 0) / depths.length;
  
  // Lower variance = higher consistency
  return Math.max(0, 1 - (variance / 10));
}

function identifyGrowthAreas(metrics: PhaseMetrics): string[] {
  const growthAreas = [];
  const criteria = PHASE_COMPLETION_CRITERIA[metrics.phase_number];
  
  if (metrics.reflection_depth_average < criteria.required_depth_average) {
    growthAreas.push('Deeper self-reflection and introspection');
  }
  
  if (metrics.systems_thinking_indicators < criteria.systems_thinking_threshold) {
    growthAreas.push('Systems thinking and pattern recognition');
  }
  
  if (metrics.breakthrough_count < criteria.required_breakthroughs) {
    growthAreas.push('Breakthrough insights and perspective shifts');
  }
  
  return growthAreas;
}

function generateRecommendedActions(metrics: PhaseMetrics, readinessScore: number): string[] {
  const actions = [];
  
  if (readinessScore < 0.3) {
    actions.push('Focus on consistency in daily practice');
    actions.push('Spend more time with each reflection question');
  } else if (readinessScore < 0.7) {
    actions.push('Challenge yourself with deeper questions');
    actions.push('Look for patterns across different life areas');
  } else {
    actions.push('Prepare for phase transition');
    actions.push('Integrate insights into daily decisions');
  }
  
  return actions;
}

// Content generation prompts
function generatePhaseSpecificQuestionPrompt(assessment: PhaseAssessment): string {
  const phase = assessment.phase_number;
  const readiness = assessment.readiness_score;
  
  return `Generate a Socratic question for Phase ${phase} (readiness: ${readiness.toFixed(2)}). 
    Focus on ${assessment.growth_areas.join(', ')}. 
    The question should challenge their current thinking and reveal deeper patterns.`;
}

function generateInsightPrompt(assessment: PhaseAssessment): string {
  return `Based on the user's Phase ${assessment.phase_number} progress (readiness: ${assessment.readiness_score.toFixed(2)}), 
    generate a profound insight that connects their breakthrough indicators: ${assessment.breakthrough_indicators.join(', ')}.`;
}

function generateChallengePrompt(assessment: PhaseAssessment): string {
  return `Create a growth challenge for Phase ${assessment.phase_number} that addresses: ${assessment.growth_areas.join(', ')}. 
    The challenge should push them toward systems thinking.`;
}

function generateReflectionPrompt(assessment: PhaseAssessment): string {
  return `Generate a deep reflection prompt for Phase ${assessment.phase_number} that helps them 
    integrate their recent insights and prepare for the next level of transformation.`;
}

function generateGuidancePrompt(assessment: PhaseAssessment): string {
  return `Provide wise guidance for someone in Phase ${assessment.phase_number} with ${assessment.readiness_score.toFixed(2)} readiness. 
    Address their growth areas: ${assessment.growth_areas.join(', ')}.`;
}

function determineDeliveryTiming(assessment: PhaseAssessment): DynamicContent['delivery_timing'] {
  if (assessment.readiness_score > 0.8) return 'phase_milestone';
  if (assessment.readiness_score > 0.5) return 'next_session';
  return 'immediate';
}

export default phaseManager;