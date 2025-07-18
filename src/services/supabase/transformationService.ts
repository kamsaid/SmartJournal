import { supabase, handleSupabaseResponse } from './client';
import { 
  Phase, 
  DailyReflection, 
  SocraticConversation, 
  TransformationPhase 
} from '@/types/database';

export const transformationService = {
  // Phase Management
  createPhase: async (
    userId: string,
    phaseNumber: TransformationPhase
  ): Promise<Phase> => {
    const phaseData = {
      user_id: userId,
      phase_number: phaseNumber,
      start_date: new Date().toISOString(),
      insights: [],
      breakthroughs: [],
      completion_status: 'in_progress' as const,
    };

    const response = await supabase
      .from('phases')
      .insert([phaseData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get user's current active phase
  getCurrentPhase: async (userId: string): Promise<Phase | null> => {
    const response = await supabase
      .from('phases')
      .select('*')
      .eq('user_id', userId)
      .eq('completion_status', 'in_progress')
      .single();

    return response.data;
  },

  // Get all phases for a user
  getUserPhases: async (userId: string): Promise<Phase[]> => {
    const response = await supabase
      .from('phases')
      .select('*')
      .eq('user_id', userId)
      .order('phase_number', { ascending: true });

    return handleSupabaseResponse(response) || [];
  },

  // Update phase with insights and breakthroughs
  updatePhaseProgress: async (
    phaseId: string,
    insights: string[],
    breakthroughs: string[]
  ): Promise<Phase> => {
    const response = await supabase
      .from('phases')
      .update({
        insights,
        breakthroughs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', phaseId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Complete a phase and move to next
  completePhase: async (
    phaseId: string,
    userId: string
  ): Promise<{ completedPhase: Phase; nextPhase?: Phase }> => {
    // Mark current phase as completed
    const completedResponse = await supabase
      .from('phases')
      .update({
        completion_status: 'completed',
        completion_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', phaseId)
      .select()
      .single();

    const completedPhase = handleSupabaseResponse(completedResponse);

    // Create next phase if not at the end
    let nextPhase;
    if (completedPhase.phase_number < 7) {
      nextPhase = await transformationService.createPhase(
        userId,
        (completedPhase.phase_number + 1) as TransformationPhase
      );

      // Update user's current phase
      await supabase
        .from('users')
        .update({ 
          current_phase: nextPhase.phase_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
    }

    return { completedPhase, nextPhase };
  },

  // Daily Reflection Management
  createDailyReflection: async (
    userId: string,
    questions: DailyReflection['questions'],
    responses: DailyReflection['responses']
  ): Promise<DailyReflection> => {
    const reflectionData = {
      user_id: userId,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      questions,
      responses,
      ai_analysis: {
        patterns_identified: [],
        leverage_points: [],
        system_connections: [],
        next_questions: [],
      },
      depth_level: Math.max(...responses.map(r => r.reflection_depth)),
    };

    const response = await supabase
      .from('daily_reflections')
      .insert([reflectionData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get daily reflection for specific date
  getDailyReflection: async (
    userId: string,
    date: string
  ): Promise<DailyReflection | null> => {
    const response = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    return response.data;
  },

  // Get recent reflections for a user
  getRecentReflections: async (
    userId: string,
    limit: number = 7
  ): Promise<DailyReflection[]> => {
    const response = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    return handleSupabaseResponse(response) || [];
  },

  // Update reflection with AI analysis
  updateReflectionAnalysis: async (
    reflectionId: string,
    aiAnalysis: DailyReflection['ai_analysis']
  ): Promise<DailyReflection> => {
    const response = await supabase
      .from('daily_reflections')
      .update({
        ai_analysis: aiAnalysis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reflectionId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Socratic Conversation Management
  createSocraticConversation: async (
    userId: string,
    initialMessage: string
  ): Promise<SocraticConversation> => {
    const conversationData = {
      user_id: userId,
      conversation_thread: [
        {
          message_id: crypto.randomUUID(),
          role: 'user' as const,
          content: initialMessage,
          timestamp: new Date().toISOString(),
        },
      ],
      depth_level: 1,
      revelations: [],
      follow_ups: [],
      phase_progression_indicators: [],
    };

    const response = await supabase
      .from('socratic_conversations')
      .insert([conversationData])
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Add message to conversation
  addConversationMessage: async (
    conversationId: string,
    role: 'ai' | 'user',
    content: string,
    metadata?: Record<string, any>
  ): Promise<SocraticConversation> => {
    // First get the current conversation
    const currentResponse = await supabase
      .from('socratic_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    const current = handleSupabaseResponse(currentResponse);

    const newMessage = {
      message_id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const updatedThread = [...current.conversation_thread, newMessage];

    const response = await supabase
      .from('socratic_conversations')
      .update({
        conversation_thread: updatedThread,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Update conversation with revelations and insights
  updateConversationInsights: async (
    conversationId: string,
    revelations: string[],
    followUps: string[],
    phaseProgressionIndicators: string[]
  ): Promise<SocraticConversation> => {
    const response = await supabase
      .from('socratic_conversations')
      .update({
        revelations,
        follow_ups: followUps,
        phase_progression_indicators: phaseProgressionIndicators,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single();

    return handleSupabaseResponse(response);
  },

  // Get user's conversation history
  getUserConversations: async (
    userId: string,
    limit: number = 10
  ): Promise<SocraticConversation[]> => {
    const response = await supabase
      .from('socratic_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return handleSupabaseResponse(response) || [];
  },

  // Get comprehensive user transformation summary
  getUserTransformationSummary: async (userId: string) => {
    const userResponse = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    const user = handleSupabaseResponse(userResponse);

    const phases = await supabase
      .from('phases')
      .select('*')
      .eq('user_id', userId)
      .order('phase_number', { ascending: true });

    const recentReflections = await supabase
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(10);

    const lifeSystems = await supabase
      .from('life_systems')
      .select('*')
      .eq('user_id', userId);

    const patterns = await supabase
      .from('patterns')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      user,
      phases: phases.data || [],
      recent_reflections: recentReflections.data || [],
      life_systems: lifeSystems.data || [],
      patterns: patterns.data || [],
      transformation_days: Math.floor(
        (Date.now() - new Date(user.transformation_start_date).getTime()) / 
        (1000 * 60 * 60 * 24)
      ),
    };
  },
};