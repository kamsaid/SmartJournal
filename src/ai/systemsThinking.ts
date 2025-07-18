import {
  User,
  DailyReflection,
  LifeSystem,
  LifeSystemType,
  SocraticConversation,
} from '@/types/database';
import { aiOrchestrator } from '@/services/openai';

export interface SystemsThinkingAnalysis {
  analysis_id: string;
  user_id: string;
  systems_thinking_score: number; // 0-1
  analysis_date: string;
  component_scores: {
    causal_thinking: number;
    systems_perspective: number;
    interconnection_awareness: number;
    leverage_identification: number;
    holistic_thinking: number;
    dynamic_thinking: number;
    design_orientation: number;
  };
  evidence: {
    systems_language_usage: string[];
    causal_reasoning_examples: string[];
    interconnection_insights: string[];
    leverage_identifications: string[];
    design_thinking_examples: string[];
  };
  development_areas: string[];
  growth_trajectory: 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
  next_development_steps: string[];
}

export interface SystemsMap {
  map_id: string;
  user_response: string;
  identified_systems: {
    system_name: string;
    system_type: 'personal' | 'social' | 'organizational' | 'environmental';
    boundaries: string[];
    components: string[];
    purpose: string;
  }[];
  relationships: {
    from_system: string;
    to_system: string;
    relationship_type: 'influences' | 'depends_on' | 'enables' | 'constrains' | 'feedback_loop';
    strength: number;
    description: string;
  }[];
  feedback_loops: {
    loop_type: 'reinforcing' | 'balancing';
    description: string;
    components: string[];
    intervention_points: string[];
  }[];
  leverage_points: {
    point: string;
    level: 'parameters' | 'material_flows' | 'regulating_rules' | 'information_flows' | 'rules' | 'power_over_rules' | 'goals' | 'paradigms' | 'transcending_paradigms';
    impact_potential: number;
  }[];
}

export interface CausalAnalysis {
  analysis_id: string;
  root_causes: {
    cause: string;
    level: 'surface' | 'intermediate' | 'root' | 'systemic';
    evidence: string[];
    intervention_potential: number;
  }[];
  causal_chains: {
    chain: string[];
    chain_strength: number;
    intervention_points: string[];
  }[];
  systemic_causes: {
    cause: string;
    affected_systems: LifeSystemType[];
    pattern_type: string;
    transformation_potential: number;
  }[];
  intervention_hierarchy: {
    level: string;
    interventions: string[];
    impact_potential: number;
    difficulty: number;
  }[];
}

export interface DesignThinkingAnalysis {
  current_approach: 'problem_solving' | 'optimization' | 'system_design' | 'outcome_architecture';
  design_maturity: number; // 0-1
  design_capabilities: {
    problem_reframing: number;
    system_modeling: number;
    intervention_design: number;
    outcome_architecture: number;
    iterative_improvement: number;
  };
  design_opportunities: {
    area: string;
    current_design: string;
    proposed_design: string;
    design_principles: string[];
    implementation_approach: string;
  }[];
  architectural_thinking_indicators: string[];
}

// Systems thinking capability levels
const SYSTEMS_THINKING_LEVELS = {
  novice: {
    score_range: [0, 0.2],
    characteristics: ['Linear thinking', 'Event-focused', 'Single cause attribution'],
    development_focus: ['Cause-effect awareness', 'Multiple perspective taking'],
  },
  developing: {
    score_range: [0.2, 0.4],
    characteristics: ['Some pattern recognition', 'Beginning systems awareness', 'Simple connections'],
    development_focus: ['Pattern analysis', 'System mapping', 'Feedback loop identification'],
  },
  proficient: {
    score_range: [0.4, 0.6],
    characteristics: ['Systems perspective', 'Pattern thinking', 'Interconnection awareness'],
    development_focus: ['Complex system analysis', 'Leverage point identification', 'Design thinking'],
  },
  advanced: {
    score_range: [0.6, 0.8],
    characteristics: ['Holistic thinking', 'Dynamic system understanding', 'Design orientation'],
    development_focus: ['Meta-system awareness', 'Paradigm examination', 'Architectural mastery'],
  },
  expert: {
    score_range: [0.8, 1.0],
    characteristics: ['Transcendent systems view', 'Paradigm flexibility', 'Outcome architecture'],
    development_focus: ['Teaching others', 'System creation', 'Paradigm innovation'],
  },
};

export const systemsThinking = {
  // Comprehensive systems thinking analysis
  analyzeSystemsThinking: async (
    userId: string,
    textData: {
      responses: string[];
      conversations: string[];
      timeframe: 'week' | 'month' | 'quarter';
    }
  ): Promise<SystemsThinkingAnalysis> => {
    // Analyze different components of systems thinking
    const causalThinking = await analyzeCausalThinking(textData.responses);
    const systemsPerspective = await analyzeSystemsPerspective(textData.responses);
    const interconnectionAwareness = await analyzeInterconnectionAwareness(textData.responses);
    const leverageIdentification = await analyzeLeverageIdentification(textData.responses);
    const holisticThinking = await analyzeHolisticThinking(textData.responses);
    const dynamicThinking = await analyzeDynamicThinking(textData.responses);
    const designOrientation = await analyzeDesignOrientation(textData.responses);

    const componentScores = {
      causal_thinking: causalThinking.score,
      systems_perspective: systemsPerspective.score,
      interconnection_awareness: interconnectionAwareness.score,
      leverage_identification: leverageIdentification.score,
      holistic_thinking: holisticThinking.score,
      dynamic_thinking: dynamicThinking.score,
      design_orientation: designOrientation.score,
    };

    const overallScore = Object.values(componentScores).reduce((acc, score) => acc + score, 0) / 7;

    const evidence = {
      systems_language_usage: extractSystemsLanguage(textData.responses),
      causal_reasoning_examples: causalThinking.examples,
      interconnection_insights: interconnectionAwareness.examples,
      leverage_identifications: leverageIdentification.examples,
      design_thinking_examples: designOrientation.examples,
    };

    const developmentAreas = identifyDevelopmentAreas(componentScores);
    const growthTrajectory = determineGrowthTrajectory(overallScore);
    const nextSteps = generateNextDevelopmentSteps(growthTrajectory, developmentAreas);

    return {
      analysis_id: crypto.randomUUID(),
      user_id: userId,
      systems_thinking_score: overallScore,
      analysis_date: new Date().toISOString(),
      component_scores: componentScores,
      evidence,
      development_areas: developmentAreas,
      growth_trajectory: growthTrajectory,
      next_development_steps: nextSteps,
    };
  },

  // Map systems from user responses
  mapSystems: async (userResponse: string): Promise<SystemsMap> => {
    // Use AI to identify and map systems
    const aiResponse = await aiOrchestrator.analyzeLifeSystems(
      { user: { id: 'temp' } as User },
      'system_mapping'
    );

    const identifiedSystems = await extractSystemsFromResponse(userResponse);
    const relationships = await identifySystemRelationships(identifiedSystems, userResponse);
    const feedbackLoops = await identifyFeedbackLoops(userResponse, relationships);
    const leveragePoints = await identifySystemLeveragePoints(userResponse, identifiedSystems);

    return {
      map_id: crypto.randomUUID(),
      user_response: userResponse,
      identified_systems: identifiedSystems,
      relationships: relationships,
      feedback_loops: feedbackLoops,
      leverage_points: leveragePoints,
    };
  },

  // Analyze causal thinking patterns
  analyzeCausalThinking: async (
    userId: string,
    responses: string[]
  ): Promise<CausalAnalysis> => {
    const rootCauses = await identifyRootCauses(responses);
    const causalChains = await mapCausalChains(responses);
    const systemicCauses = await identifySystemicCauses(responses);
    const interventionHierarchy = await createInterventionHierarchy(rootCauses, causalChains);

    return {
      analysis_id: crypto.randomUUID(),
      root_causes: rootCauses,
      causal_chains: causalChains,
      systemic_causes: systemicCauses,
      intervention_hierarchy: interventionHierarchy,
    };
  },

  // Analyze design thinking capabilities
  analyzeDesignThinking: async (
    userId: string,
    responses: string[]
  ): Promise<DesignThinkingAnalysis> => {
    const currentApproach = await determineCurrentApproach(responses);
    const designMaturity = await calculateDesignMaturity(responses);
    const designCapabilities = await assessDesignCapabilities(responses);
    const designOpportunities = await identifyDesignOpportunities(responses);
    const architecturalIndicators = await extractArchitecturalThinking(responses);

    return {
      current_approach: currentApproach,
      design_maturity: designMaturity,
      design_capabilities: designCapabilities,
      design_opportunities: designOpportunities,
      architectural_thinking_indicators: architecturalIndicators,
    };
  },

  // Track systems thinking development over time
  trackDevelopment: async (
    userId: string,
    timeframe: 'month' | 'quarter' | 'year'
  ): Promise<{
    development_timeline: {
      date: string;
      systems_thinking_score: number;
      key_developments: string[];
      breakthrough_moments: string[];
    }[];
    growth_rate: number;
    development_trajectory: 'accelerating' | 'steady' | 'plateauing' | 'declining';
    mastery_predictions: {
      proficient_eta: string;
      advanced_eta: string;
      expert_eta: string;
    };
    recommended_focus_areas: string[];
  }> => {
    // Implementation would track development over time
    // This is a placeholder for the comprehensive tracking system
    return {
      development_timeline: [],
      growth_rate: 0.1, // 10% improvement per month
      development_trajectory: 'steady',
      mastery_predictions: {
        proficient_eta: '6 months',
        advanced_eta: '18 months',
        expert_eta: '3 years',
      },
      recommended_focus_areas: [
        'Practice system mapping',
        'Identify leverage points',
        'Design thinking exercises',
      ],
    };
  },

  // Generate systems thinking exercises
  generateExercises: async (
    currentLevel: string,
    developmentAreas: string[]
  ): Promise<{
    daily_exercises: {
      exercise: string;
      instructions: string;
      expected_outcome: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }[];
    weekly_challenges: {
      challenge: string;
      description: string;
      success_criteria: string[];
    }[];
    reflection_prompts: string[];
  }> => {
    const exercises = generateLevelAppropriateExercises(currentLevel, developmentAreas);
    const challenges = generateWeeklyChallenges(currentLevel);
    const prompts = generateReflectionPrompts(currentLevel);

    return {
      daily_exercises: exercises,
      weekly_challenges: challenges,
      reflection_prompts: prompts,
    };
  },
};

// Analysis algorithms
async function analyzeCausalThinking(responses: string[]): Promise<{ score: number; examples: string[] }> {
  const causalIndicators = [
    'because', 'leads to', 'results in', 'causes', 'due to',
    'stems from', 'originates', 'root cause', 'underlying',
    'drives', 'influences', 'affects', 'impacts'
  ];

  const examples: string[] = [];
  let indicatorCount = 0;
  let totalWords = 0;

  responses.forEach(response => {
    const words = response.toLowerCase().split(' ');
    totalWords += words.length;
    
    causalIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        indicatorCount++;
        if (examples.length < 3) {
          const sentences = response.split(/[.!?]/);
          const relevantSentence = sentences.find(s => 
            s.toLowerCase().includes(indicator)
          );
          if (relevantSentence) {
            examples.push(relevantSentence.trim());
          }
        }
      }
    });
  });

  const score = Math.min(1, (indicatorCount / Math.max(totalWords / 100, 1)) * 2);
  
  return { score, examples };
}

async function analyzeSystemsPerspective(responses: string[]): Promise<{ score: number; examples: string[] }> {
  const systemsKeywords = [
    'system', 'pattern', 'connection', 'relationship', 'network',
    'structure', 'process', 'feedback', 'loop', 'cycle',
    'holistic', 'interconnected', 'integrated', 'whole'
  ];

  const examples: string[] = [];
  let keywordCount = 0;
  let totalWords = 0;

  responses.forEach(response => {
    const words = response.toLowerCase().split(' ');
    totalWords += words.length;
    
    systemsKeywords.forEach(keyword => {
      const count = (response.toLowerCase().match(new RegExp(keyword, 'g')) || []).length;
      keywordCount += count;
      
      if (count > 0 && examples.length < 3) {
        const sentences = response.split(/[.!?]/);
        const relevantSentence = sentences.find(s => 
          s.toLowerCase().includes(keyword)
        );
        if (relevantSentence) {
          examples.push(relevantSentence.trim());
        }
      }
    });
  });

  const score = Math.min(1, (keywordCount / Math.max(totalWords / 50, 1)));
  
  return { score, examples };
}

async function analyzeInterconnectionAwareness(responses: string[]): Promise<{ score: number; examples: string[] }> {
  const connectionIndicators = [
    'connected to', 'relates to', 'affects', 'influences',
    'impacts', 'linked', 'tied to', 'associated with',
    'depends on', 'enables', 'supports', 'reinforces'
  ];

  const examples: string[] = [];
  let connectionCount = 0;

  responses.forEach(response => {
    connectionIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        connectionCount++;
        if (examples.length < 3) {
          const sentences = response.split(/[.!?]/);
          const relevantSentence = sentences.find(s => 
            s.toLowerCase().includes(indicator)
          );
          if (relevantSentence) {
            examples.push(relevantSentence.trim());
          }
        }
      }
    });
  });

  const score = Math.min(1, connectionCount / Math.max(responses.length * 2, 1));
  
  return { score, examples };
}

async function analyzeLeverageIdentification(responses: string[]): Promise<{ score: number; examples: string[] }> {
  const leverageIndicators = [
    'leverage', 'key point', 'most important', 'crucial',
    'vital', 'critical', 'high impact', 'biggest change',
    'most effective', 'game changer', 'turning point'
  ];

  const examples: string[] = [];
  let leverageCount = 0;

  responses.forEach(response => {
    leverageIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        leverageCount++;
        if (examples.length < 3) {
          const sentences = response.split(/[.!?]/);
          const relevantSentence = sentences.find(s => 
            s.toLowerCase().includes(indicator)
          );
          if (relevantSentence) {
            examples.push(relevantSentence.trim());
          }
        }
      }
    });
  });

  const score = Math.min(1, leverageCount / Math.max(responses.length, 1));
  
  return { score, examples };
}

async function analyzeHolisticThinking(responses: string[]): Promise<{ score: number; examples: string[] }> {
  const holisticIndicators = [
    'big picture', 'overall', 'everything', 'whole',
    'complete', 'comprehensive', 'all aspects',
    'different areas', 'multiple', 'various'
  ];

  const examples: string[] = [];
  let holisticCount = 0;

  responses.forEach(response => {
    holisticIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        holisticCount++;
        if (examples.length < 3) {
          const sentences = response.split(/[.!?]/);
          const relevantSentence = sentences.find(s => 
            s.toLowerCase().includes(indicator)
          );
          if (relevantSentence) {
            examples.push(relevantSentence.trim());
          }
        }
      }
    });
  });

  const score = Math.min(1, holisticCount / Math.max(responses.length, 1));
  
  return { score, examples };
}

async function analyzeDynamicThinking(responses: string[]): Promise<{ score: number; examples: string[] }> {
  const dynamicIndicators = [
    'over time', 'changing', 'evolving', 'developing',
    'growing', 'shifting', 'dynamic', 'fluid',
    'adapting', 'transforming', 'progression'
  ];

  const examples: string[] = [];
  let dynamicCount = 0;

  responses.forEach(response => {
    dynamicIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        dynamicCount++;
        if (examples.length < 3) {
          const sentences = response.split(/[.!?]/);
          const relevantSentence = sentences.find(s => 
            s.toLowerCase().includes(indicator)
          );
          if (relevantSentence) {
            examples.push(relevantSentence.trim());
          }
        }
      }
    });
  });

  const score = Math.min(1, dynamicCount / Math.max(responses.length, 1));
  
  return { score, examples };
}

async function analyzeDesignOrientation(responses: string[]): Promise<{ score: number; examples: string[] }> {
  const designIndicators = [
    'design', 'create', 'build', 'architect', 'construct',
    'develop', 'establish', 'set up', 'organize',
    'structure', 'plan', 'intentionally', 'deliberately'
  ];

  const examples: string[] = [];
  let designCount = 0;

  responses.forEach(response => {
    designIndicators.forEach(indicator => {
      if (response.toLowerCase().includes(indicator)) {
        designCount++;
        if (examples.length < 3) {
          const sentences = response.split(/[.!?]/);
          const relevantSentence = sentences.find(s => 
            s.toLowerCase().includes(indicator)
          );
          if (relevantSentence) {
            examples.push(relevantSentence.trim());
          }
        }
      }
    });
  });

  const score = Math.min(1, designCount / Math.max(responses.length, 1));
  
  return { score, examples };
}

// Helper functions
function extractSystemsLanguage(responses: string[]): string[] {
  const systemsTerms = [
    'system', 'pattern', 'connection', 'relationship',
    'feedback', 'loop', 'cycle', 'network', 'structure'
  ];

  const usage: string[] = [];
  
  responses.forEach(response => {
    systemsTerms.forEach(term => {
      if (response.toLowerCase().includes(term) && usage.length < 5) {
        const context = extractTermContext(response, term);
        if (context) usage.push(context);
      }
    });
  });

  return usage;
}

function extractTermContext(text: string, term: string): string | null {
  const sentences = text.split(/[.!?]/);
  const relevantSentence = sentences.find(s => 
    s.toLowerCase().includes(term.toLowerCase())
  );
  return relevantSentence?.trim() || null;
}

function identifyDevelopmentAreas(componentScores: any): string[] {
  const areas: string[] = [];
  const threshold = 0.6;

  Object.entries(componentScores).forEach(([component, score]) => {
    if ((score as number) < threshold) {
      areas.push(component.replace('_', ' '));
    }
  });

  return areas;
}

function determineGrowthTrajectory(score: number): 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert' {
  if (score < 0.2) return 'novice';
  if (score < 0.4) return 'developing';
  if (score < 0.6) return 'proficient';
  if (score < 0.8) return 'advanced';
  return 'expert';
}

function generateNextDevelopmentSteps(trajectory: string, developmentAreas: string[]): string[] {
  const levelSteps = SYSTEMS_THINKING_LEVELS[trajectory as keyof typeof SYSTEMS_THINKING_LEVELS];
  
  const steps = [...levelSteps.development_focus];
  
  // Add specific steps for development areas
  developmentAreas.forEach(area => {
    switch (area) {
      case 'causal thinking':
        steps.push('Practice asking "What causes this?" multiple times');
        break;
      case 'systems perspective':
        steps.push('Look for patterns and connections in daily experiences');
        break;
      case 'interconnection awareness':
        steps.push('Map how different life areas affect each other');
        break;
      case 'leverage identification':
        steps.push('Identify the most impactful intervention points');
        break;
      case 'design orientation':
        steps.push('Practice designing solutions instead of just solving problems');
        break;
    }
  });

  return steps.slice(0, 5); // Top 5 steps
}

// Placeholder implementations for complex functions
async function extractSystemsFromResponse(response: string): Promise<any[]> {
  return []; // Would implement system extraction logic
}

async function identifySystemRelationships(systems: any[], response: string): Promise<any[]> {
  return []; // Would implement relationship identification
}

async function identifyFeedbackLoops(response: string, relationships: any[]): Promise<any[]> {
  return []; // Would implement feedback loop detection
}

async function identifySystemLeveragePoints(response: string, systems: any[]): Promise<any[]> {
  return []; // Would implement leverage point identification
}

async function identifyRootCauses(responses: string[]): Promise<any[]> {
  return []; // Would implement root cause analysis
}

async function mapCausalChains(responses: string[]): Promise<any[]> {
  return []; // Would implement causal chain mapping
}

async function identifySystemicCauses(responses: string[]): Promise<any[]> {
  return []; // Would implement systemic cause identification
}

async function createInterventionHierarchy(rootCauses: any[], causalChains: any[]): Promise<any[]> {
  return []; // Would implement intervention hierarchy creation
}

async function determineCurrentApproach(responses: string[]): Promise<any> {
  return 'problem_solving'; // Would analyze approach from responses
}

async function calculateDesignMaturity(responses: string[]): Promise<number> {
  return 0.5; // Would calculate based on design thinking indicators
}

async function assessDesignCapabilities(responses: string[]): Promise<any> {
  return {
    problem_reframing: 0.5,
    system_modeling: 0.5,
    intervention_design: 0.5,
    outcome_architecture: 0.5,
    iterative_improvement: 0.5,
  };
}

async function identifyDesignOpportunities(responses: string[]): Promise<any[]> {
  return []; // Would identify opportunities from responses
}

async function extractArchitecturalThinking(responses: string[]): Promise<string[]> {
  return []; // Would extract architectural thinking indicators
}

function generateLevelAppropriateExercises(level: string, areas: string[]): any[] {
  return [
    {
      exercise: 'Daily Systems Observation',
      instructions: 'Identify one system you interact with and map its components',
      expected_outcome: 'Increased systems awareness',
      difficulty: 'easy',
    },
  ];
}

function generateWeeklyChallenges(level: string): any[] {
  return [
    {
      challenge: 'Life Systems Mapping',
      description: 'Create a visual map of how your life systems interconnect',
      success_criteria: ['At least 3 systems mapped', '5+ connections identified'],
    },
  ];
}

function generateReflectionPrompts(level: string): string[] {
  return [
    'What patterns do you notice in your daily experiences?',
    'How do different areas of your life influence each other?',
    'What would you design differently if you could start over?',
  ];
}

export default systemsThinking;