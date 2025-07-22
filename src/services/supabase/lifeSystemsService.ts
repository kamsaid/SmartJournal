import { supabase, handleSupabaseResponse } from './client';
import { generateUUID } from '@/utils/uuid';
import { 
  LifeSystem, 
  Pattern, 
  LeveragePoint, 
  SystemAnalysis,
  ArchitecturalDesign,
  LifeSystemType,
  PatternType,
  AnalysisType 
} from '@/types/database';

export const lifeSystemsService = {
  // Life Systems Management
  createLifeSystem: async (
    userId: string,
    systemType: LifeSystemType,
    currentState: LifeSystem['current_state'],
    targetState: LifeSystem['target_state']
  ): Promise<LifeSystem> => {
    const systemData = {
      user_id: userId,
      system_type: systemType,
      current_state: currentState,
      target_state: targetState,
      interventions: [],
      last_updated: new Date().toISOString(),
    };

    const response = await supabase
      .from('life_systems')
      .insert([systemData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get all life systems for a user
  getUserLifeSystems: async (userId: string): Promise<LifeSystem[]> => {
    const response = await supabase
      .from('life_systems')
      .select('*')
      .eq('user_id', userId)
      .order('system_type', { ascending: true });

    return handleSupabaseResponse(response) || [];
  },

  // Get specific life system
  getLifeSystem: async (
    userId: string,
    systemType: LifeSystemType
  ): Promise<LifeSystem | null> => {
    const response = await supabase
      .from('life_systems')
      .select('*')
      .eq('user_id', userId)
      .eq('system_type', systemType);

    // Handle case where no life system exists for this type
    const systems = response.data || [];
    return systems.length > 0 ? systems[0] : null;
  },

  // Update life system state
  updateLifeSystemState: async (
    systemId: string,
    currentState: Partial<LifeSystem['current_state']>,
    targetState?: Partial<LifeSystem['target_state']>
  ): Promise<LifeSystem> => {
    const updateData: any = {
      last_updated: new Date().toISOString(),
    };

    if (currentState) {
      // Get current system to merge states
      const currentResponse = await supabase
        .from('life_systems')
        .select('current_state, target_state')
        .eq('id', systemId)
        .single();

      const current = handleSupabaseResponse(currentResponse);
      
      if (current) {
        updateData.current_state = {
          ...current.current_state,
          ...currentState,
        };

        if (targetState) {
          updateData.target_state = {
            ...current.target_state,
            ...targetState,
          };
        }
      }
    }

    const response = await supabase
      .from('life_systems')
      .update(updateData)
      .eq('id', systemId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Add intervention to life system
  addSystemIntervention: async (
    systemId: string,
    intervention: LifeSystem['interventions'][0]
  ): Promise<LifeSystem> => {
    // Get current interventions
    const currentResponse = await supabase
      .from('life_systems')
      .select('interventions')
      .eq('id', systemId)
      .single();

    const current = handleSupabaseResponse(currentResponse);
    
    if (!current) {
      throw new Error('Life system not found');
    }
    
    const newIntervention = {
      ...intervention,
      id: generateUUID(),
    };

    const updatedInterventions = [...current.interventions, newIntervention];

    const response = await supabase
      .from('life_systems')
      .update({
        interventions: updatedInterventions,
        last_updated: new Date().toISOString(),
      })
      .eq('id', systemId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Pattern Management
  createPattern: async (
    userId: string,
    patternType: PatternType,
    description: string,
    impactAreas: LifeSystemType[]
  ): Promise<Pattern> => {
    const patternData = {
      user_id: userId,
      pattern_type: patternType,
      description,
      first_identified: new Date().toISOString(),
      impact_areas: impactAreas,
      transformation_potential: 0.5, // Default, will be updated by AI analysis
      examples: [],
      root_causes: [],
      intervention_ideas: [],
      status: 'identified' as const,
    };

    const response = await supabase
      .from('patterns')
      .insert([patternData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get user patterns
  getUserPatterns: async (userId: string): Promise<Pattern[]> => {
    const response = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', userId)
      .order('transformation_potential', { ascending: false });

    return handleSupabaseResponse(response) || [];
  },

  // Update pattern with AI insights
  updatePatternAnalysis: async (
    patternId: string,
    updates: Partial<Pick<Pattern, 'examples' | 'root_causes' | 'intervention_ideas' | 'transformation_potential'>>
  ): Promise<Pattern> => {
    const response = await supabase
      .from('patterns')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Update pattern status
  updatePatternStatus: async (
    patternId: string,
    status: Pattern['status']
  ): Promise<Pattern> => {
    const response = await supabase
      .from('patterns')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', patternId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Leverage Points Management
  createLeveragePoint: async (
    userId: string,
    intervention: string,
    systemConnections: LifeSystemType[],
    potentialImpact: number
  ): Promise<LeveragePoint> => {
    const leverageData = {
      user_id: userId,
      intervention,
      potential_impact: potentialImpact,
      implementation_status: 'identified' as const,
      system_connections: systemConnections,
      effort_required: 0.5, // Default, will be updated by analysis
      timeline_estimate: '',
      dependencies: [],
      risks: [],
      success_indicators: [],
    };

    const response = await supabase
      .from('leverage_points')
      .insert([leverageData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get user leverage points
  getUserLeveragePoints: async (userId: string): Promise<LeveragePoint[]> => {
    const response = await supabase
      .from('leverage_points')
      .select('*')
      .eq('user_id', userId)
      .order('potential_impact', { ascending: false });

    return handleSupabaseResponse(response) || [];
  },

  // Update leverage point details
  updateLeveragePoint: async (
    leverageId: string,
    updates: Partial<LeveragePoint>
  ): Promise<LeveragePoint> => {
    const response = await supabase
      .from('leverage_points')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leverageId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // System Analysis Management
  createSystemAnalysis: async (
    userId: string,
    analysisType: AnalysisType,
    insights: SystemAnalysis['insights'],
    connections: SystemAnalysis['connections'],
    recommendations: SystemAnalysis['recommendations']
  ): Promise<SystemAnalysis> => {
    const analysisData = {
      user_id: userId,
      analysis_type: analysisType,
      insights,
      connections,
      recommendations,
    };

    const response = await supabase
      .from('system_analyses')
      .insert([analysisData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get recent system analyses
  getRecentAnalyses: async (
    userId: string,
    limit: number = 5
  ): Promise<SystemAnalysis[]> => {
    const response = await supabase
      .from('system_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return handleSupabaseResponse(response) || [];
  },

  // Architectural Design Management
  createArchitecturalDesign: async (
    userId: string,
    lifeArea: LifeSystemType,
    currentDesign: ArchitecturalDesign['current_design'],
    proposedDesign: ArchitecturalDesign['proposed_design'],
    implementationSteps: ArchitecturalDesign['implementation_steps']
  ): Promise<ArchitecturalDesign> => {
    const designData = {
      user_id: userId,
      life_area: lifeArea,
      current_design: currentDesign,
      proposed_design: proposedDesign,
      implementation_steps: implementationSteps,
      status: 'drafted' as const,
    };

    const response = await supabase
      .from('architectural_designs')
      .insert([designData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get architectural designs for user
  getUserArchitecturalDesigns: async (userId: string): Promise<ArchitecturalDesign[]> => {
    const response = await supabase
      .from('architectural_designs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return handleSupabaseResponse(response) || [];
  },

  // Update architectural design status
  updateArchitecturalDesignStatus: async (
    designId: string,
    status: ArchitecturalDesign['status']
  ): Promise<ArchitecturalDesign> => {
    const response = await supabase
      .from('architectural_designs')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', designId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get comprehensive life systems overview
  getLifeSystemsOverview: async (userId: string) => {
    const [systems, patterns, leveragePoints, recentAnalyses] = await Promise.all([
      lifeSystemsService.getUserLifeSystems(userId),
      lifeSystemsService.getUserPatterns(userId),
      lifeSystemsService.getUserLeveragePoints(userId),
      lifeSystemsService.getRecentAnalyses(userId),
    ]);

    return {
      systems,
      patterns,
      leverage_points: leveragePoints,
      recent_analyses: recentAnalyses,
      system_health_score: systems.reduce(
        (acc, system) => acc + system.current_state.satisfaction_level,
        0
      ) / systems.length || 0,
    };
  },
};