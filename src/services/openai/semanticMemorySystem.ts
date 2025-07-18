import OpenAI from 'openai';
import config from '@/constants/config';
import { AIContext, AIResponse } from './aiOrchestrator';
import {
  User,
  DailyReflection,
  Pattern,
  LifeSystem,
  TransformationPhase,
} from '@/types/database';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface SemanticMemory {
  id: string;
  user_id: string;
  memory_type: 'insight' | 'breakthrough' | 'pattern' | 'connection' | 'resistance' | 'transformation';
  content: string;
  context: {
    phase: TransformationPhase;
    life_systems: string[];
    emotional_state: string;
    depth_level: number;
    session_date: string;
  };
  embeddings: number[]; // Vector embeddings for semantic search
  importance_score: number; // 0-1, how important this memory is
  connections: string[]; // IDs of related memories
  access_count: number;
  last_accessed: string;
  consolidation_level: number; // How well this memory is consolidated
  metadata: {
    triggers: string[]; // What triggers this memory to be relevant
    outcomes: string[]; // What outcomes this memory led to
    life_areas_impacted: string[];
    transformation_markers: string[];
  };
}

export interface MemoryCluster {
  cluster_id: string;
  theme: string;
  memories: SemanticMemory[];
  cluster_insights: string[];
  evolution_timeline: {
    date: string;
    insight: string;
    transformation_marker: string;
  }[];
}

export interface ContextualRetrieval {
  relevant_memories: SemanticMemory[];
  memory_clusters: MemoryCluster[];
  synthesis_insights: string[];
  missing_context: string[];
  retrieval_confidence: number;
}

export const semanticMemorySystem = {
  // Store new insights with semantic encoding
  storeMemory: async (
    memory: Omit<SemanticMemory, 'id' | 'embeddings' | 'access_count' | 'last_accessed' | 'consolidation_level'>
  ): Promise<SemanticMemory> => {
    // Generate embeddings for semantic search
    const embeddings = await generateEmbeddings(memory.content);
    
    // Calculate importance score
    const importanceScore = await calculateImportanceScore(memory);
    
    // Find connections to existing memories
    const connections = await findMemoryConnections(memory, embeddings);
    
    const fullMemory: SemanticMemory = {
      ...memory,
      id: generateMemoryId(),
      embeddings,
      importance_score: importanceScore,
      connections,
      access_count: 0,
      last_accessed: new Date().toISOString(),
      consolidation_level: 0.1, // Start low, increases with access and time
    };

    // Store in database (placeholder - would integrate with Supabase)
    await storeMemoryInDatabase(fullMemory);
    
    return fullMemory;
  },

  // Retrieve contextually relevant memories
  retrieveRelevantMemories: async (
    context: AIContext,
    currentInput: string,
    maxMemories: number = 10
  ): Promise<ContextualRetrieval> => {
    // Generate embeddings for current input
    const inputEmbeddings = await generateEmbeddings(currentInput);
    
    // Get all user memories
    const userMemories = await getUserMemories(context.user.id);
    
    // Calculate semantic similarity
    const rankedMemories = await rankMemoriesBySimilarity(
      userMemories,
      inputEmbeddings,
      context
    );
    
    // Filter by relevance threshold and limit
    const relevantMemories = rankedMemories
      .filter(m => m.similarity_score > 0.6)
      .slice(0, maxMemories);
    
    // Create memory clusters
    const memoryClusters = await createMemoryClusters(relevantMemories);
    
    // Generate synthesis insights
    const synthesisInsights = await generateSynthesisInsights(
      relevantMemories.map(rm => rm.memory),
      memoryClusters,
      context
    );
    
    // Identify missing context
    const missingContext = await identifyMissingContext(
      relevantMemories.map(rm => rm.memory),
      context,
      currentInput
    );
    
    // Update access patterns
    await updateMemoryAccess(relevantMemories);
    
    return {
      relevant_memories: relevantMemories.map(rm => rm.memory),
      memory_clusters: memoryClusters,
      synthesis_insights: synthesisInsights,
      missing_context: missingContext,
      retrieval_confidence: calculateRetrievalConfidence(relevantMemories),
    };
  },

  // Consolidate memories over time
  consolidateMemories: async (
    userId: string,
    timeWindow: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<{
    consolidated_clusters: MemoryCluster[];
    strengthened_connections: { from: string; to: string; strength: number }[];
    transformation_patterns: string[];
    memory_evolution: any[];
  }> => {
    const memories = await getUserMemories(userId);
    const timeThreshold = getTimeThreshold(timeWindow);
    
    // Group memories by time and theme
    const temporalGroups = groupMemoriesByTime(memories, timeThreshold);
    
    // Strengthen connections between frequently co-accessed memories
    const strengthenedConnections = await strengthenMemoryConnections(memories);
    
    // Identify transformation patterns
    const transformationPatterns = await identifyTransformationPatterns(temporalGroups);
    
    // Create consolidated clusters
    const consolidatedClusters = await createConsolidatedClusters(temporalGroups);
    
    // Track memory evolution
    const memoryEvolution = await trackMemoryEvolution(memories);
    
    return {
      consolidated_clusters: consolidatedClusters,
      strengthened_connections: strengthenedConnections,
      transformation_patterns: transformationPatterns,
      memory_evolution: memoryEvolution,
    };
  },

  // Advanced memory search and synthesis
  searchMemories: async (
    userId: string,
    query: string,
    filters?: {
      memory_types?: string[];
      life_systems?: string[];
      phase_range?: [number, number];
      importance_threshold?: number;
      time_range?: [string, string];
    }
  ): Promise<{
    search_results: SemanticMemory[];
    synthesized_response: string;
    related_clusters: MemoryCluster[];
    insight_connections: string[];
  }> => {
    const queryEmbeddings = await generateEmbeddings(query);
    const userMemories = await getUserMemories(userId);
    
    // Apply filters
    const filteredMemories = applyMemoryFilters(userMemories, filters);
    
    // Rank by semantic similarity
    const rankedResults = await rankMemoriesBySimilarity(
      filteredMemories,
      queryEmbeddings
    );
    
    // Get top results
    const searchResults = rankedResults.slice(0, 20).map(r => r.memory);
    
    // Synthesize a response based on memories
    const synthesizedResponse = await synthesizeMemoryResponse(searchResults, query);
    
    // Find related clusters
    const relatedClusters = await findRelatedClusters(searchResults);
    
    // Identify insight connections
    const insightConnections = await identifyInsightConnections(searchResults);
    
    return {
      search_results: searchResults,
      synthesized_response: synthesizedResponse,
      related_clusters: relatedClusters,
      insight_connections: insightConnections,
    };
  },

  // Memory-guided conversation context
  buildConversationContext: async (
    context: AIContext,
    conversationHistory: any[]
  ): Promise<{
    contextual_memories: SemanticMemory[];
    conversation_themes: string[];
    transformation_trajectory: any;
    recommended_focus: string[];
  }> => {
    // Extract themes from conversation history
    const conversationThemes = await extractConversationThemes(conversationHistory);
    
    // Retrieve memories related to conversation themes
    const contextualMemories = await getThemeRelatedMemories(
      context.user.id,
      conversationThemes
    );
    
    // Analyze transformation trajectory
    const transformationTrajectory = await analyzeTransformationTrajectory(
      contextualMemories,
      context
    );
    
    // Generate focus recommendations
    const recommendedFocus = await generateFocusRecommendations(
      contextualMemories,
      transformationTrajectory,
      context
    );
    
    return {
      contextual_memories: contextualMemories,
      conversation_themes: conversationThemes,
      transformation_trajectory: transformationTrajectory,
      recommended_focus: recommendedFocus,
    };
  },
};

// Helper functions for semantic memory system

async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    // Return zero vector as fallback
    return new Array(1536).fill(0);
  }
}

async function calculateImportanceScore(memory: Partial<SemanticMemory>): Promise<number> {
  const importanceFactors = {
    breakthrough: 0.9,
    insight: 0.7,
    pattern: 0.6,
    connection: 0.5,
    resistance: 0.4,
    transformation: 0.8,
  };
  
  let score = importanceFactors[memory.memory_type as keyof typeof importanceFactors] || 0.5;
  
  // Adjust for depth level
  if (memory.context?.depth_level) {
    score += (memory.context.depth_level / 10) * 0.3;
  }
  
  // Adjust for life systems impacted
  if (memory.metadata?.life_areas_impacted?.length) {
    score += (memory.metadata.life_areas_impacted.length / 6) * 0.2;
  }
  
  return Math.min(1, score);
}

async function findMemoryConnections(
  memory: Partial<SemanticMemory>,
  embeddings: number[]
): Promise<string[]> {
  // Simplified connection finding - would use vector similarity in practice
  // This would query existing memories and find semantic connections
  
  return []; // Placeholder - would return IDs of connected memories
}

function generateMemoryId(): string {
  return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function storeMemoryInDatabase(memory: SemanticMemory): Promise<void> {
  // Placeholder for Supabase integration
  console.log('Storing memory:', memory.id);
  // In real implementation:
  // await supabase.from('semantic_memories').insert(memory);
}

async function getUserMemories(userId: string): Promise<SemanticMemory[]> {
  // Placeholder for database retrieval
  // In real implementation:
  // return await supabase.from('semantic_memories').select('*').eq('user_id', userId);
  
  return []; // Return empty array for now
}

async function rankMemoriesBySimilarity(
  memories: SemanticMemory[],
  targetEmbeddings: number[],
  context?: AIContext
): Promise<{ memory: SemanticMemory; similarity_score: number }[]> {
  const rankedMemories = memories.map(memory => {
    // Calculate cosine similarity
    const similarity = calculateCosineSimilarity(memory.embeddings, targetEmbeddings);
    
    // Apply context weighting
    let contextWeight = 1;
    if (context) {
      // Boost memories from same phase
      if (memory.context.phase === context.user.current_phase) {
        contextWeight += 0.2;
      }
      
      // Boost recent memories
      const daysSince = Math.floor(
        (Date.now() - new Date(memory.context.session_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince < 7) {
        contextWeight += 0.1;
      }
      
      // Boost high-importance memories
      contextWeight += memory.importance_score * 0.3;
    }
    
    return {
      memory,
      similarity_score: similarity * contextWeight,
    };
  });
  
  return rankedMemories.sort((a, b) => b.similarity_score - a.similarity_score);
}

function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length !== vectorB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (normA * normB);
}

async function createMemoryClusters(
  rankedMemories: { memory: SemanticMemory; similarity_score: number }[]
): Promise<MemoryCluster[]> {
  const memories = rankedMemories.map(rm => rm.memory);
  
  // Simple clustering based on memory type and life systems
  const clusters: { [key: string]: SemanticMemory[] } = {};
  
  memories.forEach(memory => {
    const clusterKey = `${memory.memory_type}_${memory.context.life_systems.join('_')}`;
    if (!clusters[clusterKey]) {
      clusters[clusterKey] = [];
    }
    clusters[clusterKey].push(memory);
  });
  
  // Convert to MemoryCluster format
  return Object.entries(clusters).map(([key, clusterMemories]) => ({
    cluster_id: `cluster_${key}_${Date.now()}`,
    theme: generateClusterTheme(clusterMemories),
    memories: clusterMemories,
    cluster_insights: [], // Would generate insights about the cluster
    evolution_timeline: [], // Would track how cluster evolved over time
  }));
}

function generateClusterTheme(memories: SemanticMemory[]): string {
  const themes = memories.map(m => m.memory_type);
  const mostCommon = themes.reduce((a, b, i, arr) =>
    arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
  );
  
  const lifeSystems = [...new Set(memories.flatMap(m => m.context.life_systems))];
  
  return `${mostCommon} patterns in ${lifeSystems.join(', ')}`;
}

async function generateSynthesisInsights(
  memories: SemanticMemory[],
  clusters: MemoryCluster[],
  context: AIContext
): Promise<string[]> {
  if (memories.length === 0) return [];
  
  const synthesisPrompt = `Analyze these user memories and generate synthesis insights:

Memories (${memories.length} total):
${memories.slice(0, 5).map(m => `- ${m.memory_type}: "${m.content.substring(0, 100)}..."`).join('\n')}

Memory Clusters: ${clusters.map(c => c.theme).join(', ')}
User Current Phase: ${context.user.current_phase}

Generate 3-5 synthesis insights that connect these memories and reveal transformation patterns.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a memory synthesis specialist creating insights from user transformation data.',
        },
        { role: 'user', content: synthesisPrompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    return response.split('\n').filter(line => line.trim().length > 0).slice(0, 5);
  } catch (error) {
    console.error('Error generating synthesis insights:', error);
    return [
      'Multiple patterns emerging across different life areas',
      'Transformation journey showing progressive deepening',
      'Connections between insights becoming more sophisticated',
    ];
  }
}

async function identifyMissingContext(
  memories: SemanticMemory[],
  context: AIContext,
  currentInput: string
): Promise<string[]> {
  // Identify what context might be missing for better understanding
  const coverageAreas = memories.map(m => m.context.life_systems).flat();
  const allLifeSystems = ['health', 'wealth', 'relationships', 'growth', 'purpose', 'environment'];
  
  const missingAreas = allLifeSystems.filter(area => 
    !coverageAreas.includes(area)
  );
  
  const missingContext = [];
  
  if (missingAreas.length > 0) {
    missingContext.push(`Limited memory context for: ${missingAreas.join(', ')}`);
  }
  
  if (memories.length < 3) {
    missingContext.push('Insufficient historical context for pattern recognition');
  }
  
  const recentMemories = memories.filter(m => {
    const daysSince = Math.floor(
      (Date.now() - new Date(m.context.session_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysSince < 7;
  });
  
  if (recentMemories.length === 0) {
    missingContext.push('No recent memories for current context assessment');
  }
  
  return missingContext;
}

async function updateMemoryAccess(
  memories: { memory: SemanticMemory; similarity_score: number }[]
): Promise<void> {
  // Update access patterns for retrieved memories
  memories.forEach(({ memory }) => {
    memory.access_count += 1;
    memory.last_accessed = new Date().toISOString();
    memory.consolidation_level = Math.min(1, memory.consolidation_level + 0.05);
  });
  
  // In real implementation, would update database
  // await supabase.from('semantic_memories').upsert(updatedMemories);
}

function calculateRetrievalConfidence(
  rankedMemories: { memory: SemanticMemory; similarity_score: number }[]
): number {
  if (rankedMemories.length === 0) return 0;
  
  const avgSimilarity = rankedMemories.reduce(
    (acc, rm) => acc + rm.similarity_score, 0
  ) / rankedMemories.length;
  
  const topSimilarity = rankedMemories[0]?.similarity_score || 0;
  const memoryCount = Math.min(rankedMemories.length / 10, 1); // Normalize by expected count
  
  return (avgSimilarity + topSimilarity + memoryCount) / 3;
}

function getTimeThreshold(timeWindow: 'daily' | 'weekly' | 'monthly'): number {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  switch (timeWindow) {
    case 'daily': return now - day;
    case 'weekly': return now - (7 * day);
    case 'monthly': return now - (30 * day);
    default: return now - (7 * day);
  }
}

function groupMemoriesByTime(memories: SemanticMemory[], threshold: number): any {
  const groups: { [key: string]: SemanticMemory[] } = {};
  
  memories.forEach(memory => {
    const memoryTime = new Date(memory.context.session_date).getTime();
    if (memoryTime >= threshold) {
      const dayKey = new Date(memoryTime).toISOString().split('T')[0];
      if (!groups[dayKey]) {
        groups[dayKey] = [];
      }
      groups[dayKey].push(memory);
    }
  });
  
  return groups;
}

async function strengthenMemoryConnections(memories: SemanticMemory[]): Promise<any[]> {
  // Analyze which memories are frequently accessed together
  const connections: { [key: string]: number } = {};
  
  // Simple co-occurrence analysis (would be more sophisticated in practice)
  memories.forEach(memory => {
    memory.connections.forEach(connectionId => {
      const connectionKey = [memory.id, connectionId].sort().join('_');
      connections[connectionKey] = (connections[connectionKey] || 0) + 1;
    });
  });
  
  return Object.entries(connections)
    .filter(([, count]) => count > 2) // Only strong connections
    .map(([connectionKey, strength]) => {
      const [from, to] = connectionKey.split('_');
      return { from, to, strength: strength / 10 }; // Normalize strength
    });
}

async function identifyTransformationPatterns(temporalGroups: any): Promise<string[]> {
  // Analyze patterns across time groups
  const patterns = [];
  
  const groupKeys = Object.keys(temporalGroups).sort();
  if (groupKeys.length >= 2) {
    patterns.push('Progressive development pattern detected across time periods');
  }
  
  // Check for recurring themes
  const allTypes = Object.values(temporalGroups)
    .flat()
    .map((m: any) => m.memory_type);
  
  const typeFrequency: { [key: string]: number } = {};
  allTypes.forEach(type => {
    typeFrequency[type] = (typeFrequency[type] || 0) + 1;
  });
  
  const dominantType = Object.entries(typeFrequency)
    .sort(([, a], [, b]) => b - a)[0]?.[0];
  
  if (dominantType) {
    patterns.push(`Strong focus on ${dominantType} development`);
  }
  
  return patterns;
}

async function createConsolidatedClusters(temporalGroups: any): Promise<MemoryCluster[]> {
  // Create clusters from temporal groups
  return Object.entries(temporalGroups).map(([date, memories]: [string, any]) => ({
    cluster_id: `temporal_${date}`,
    theme: `Insights from ${date}`,
    memories: memories as SemanticMemory[],
    cluster_insights: [`${memories.length} insights captured on this day`],
    evolution_timeline: [{
      date,
      insight: 'Consolidation checkpoint',
      transformation_marker: 'memory_consolidation',
    }],
  }));
}

async function trackMemoryEvolution(memories: SemanticMemory[]): Promise<any[]> {
  // Track how memories have evolved over time
  const evolution = memories
    .sort((a, b) => new Date(a.context.session_date).getTime() - new Date(b.context.session_date).getTime())
    .map(memory => ({
      date: memory.context.session_date,
      memory_type: memory.memory_type,
      importance: memory.importance_score,
      consolidation: memory.consolidation_level,
      access_pattern: memory.access_count,
    }));
  
  return evolution;
}

function applyMemoryFilters(memories: SemanticMemory[], filters?: any): SemanticMemory[] {
  if (!filters) return memories;
  
  return memories.filter(memory => {
    if (filters.memory_types && !filters.memory_types.includes(memory.memory_type)) {
      return false;
    }
    
    if (filters.importance_threshold && memory.importance_score < filters.importance_threshold) {
      return false;
    }
    
    if (filters.phase_range && (
      memory.context.phase < filters.phase_range[0] ||
      memory.context.phase > filters.phase_range[1]
    )) {
      return false;
    }
    
    return true;
  });
}

async function synthesizeMemoryResponse(memories: SemanticMemory[], query: string): Promise<string> {
  if (memories.length === 0) {
    return 'No relevant memories found for this query.';
  }
  
  const synthesisPrompt = `Based on these user memories, synthesize a response to their query:

Query: "${query}"

Relevant Memories:
${memories.slice(0, 5).map(m => `- ${m.memory_type}: "${m.content}"`).join('\n')}

Provide a synthesized response that connects these memories to answer their query.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are synthesizing user memories to provide contextual responses.',
        },
        { role: 'user', content: synthesisPrompt },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'Unable to synthesize response from memories.';
  } catch (error) {
    console.error('Error synthesizing memory response:', error);
    return 'Error processing memories for response synthesis.';
  }
}

async function findRelatedClusters(memories: SemanticMemory[]): Promise<MemoryCluster[]> {
  // Find clusters related to the search results
  const clusters = await createMemoryClusters(
    memories.map(m => ({ memory: m, similarity_score: 1 }))
  );
  
  return clusters;
}

async function identifyInsightConnections(memories: SemanticMemory[]): Promise<string[]> {
  const connections = [];
  
  // Identify connections between memories
  const themes = [...new Set(memories.map(m => m.memory_type))];
  const lifeSystems = [...new Set(memories.flatMap(m => m.context.life_systems))];
  
  if (themes.length > 1) {
    connections.push(`Connections across ${themes.join(', ')} themes`);
  }
  
  if (lifeSystems.length > 1) {
    connections.push(`Cross-system insights spanning ${lifeSystems.join(', ')}`);
  }
  
  // Look for transformation progression
  const phases = [...new Set(memories.map(m => m.context.phase))].sort();
  if (phases.length > 1) {
    connections.push(`Transformation progression from Phase ${phases[0]} to Phase ${phases[phases.length - 1]}`);
  }
  
  return connections;
}

async function extractConversationThemes(conversationHistory: any[]): Promise<string[]> {
  if (!conversationHistory.length) return [];
  
  const recentMessages = conversationHistory.slice(-10);
  const combinedText = recentMessages.map(msg => msg.content).join(' ');
  
  // Extract themes using keyword analysis (simplified)
  const themeKeywords = {
    health: ['health', 'energy', 'fitness', 'wellness', 'physical'],
    wealth: ['money', 'wealth', 'financial', 'income', 'career'],
    relationships: ['relationship', 'social', 'connection', 'family', 'friend'],
    growth: ['learning', 'skill', 'development', 'growth', 'education'],
    purpose: ['purpose', 'meaning', 'mission', 'calling', 'fulfillment'],
    environment: ['environment', 'space', 'setting', 'context', 'culture'],
  };
  
  const detectedThemes = [];
  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    if (keywords.some(keyword => combinedText.toLowerCase().includes(keyword))) {
      detectedThemes.push(theme);
    }
  }
  
  return detectedThemes.length > 0 ? detectedThemes : ['general'];
}

async function getThemeRelatedMemories(userId: string, themes: string[]): Promise<SemanticMemory[]> {
  const userMemories = await getUserMemories(userId);
  
  return userMemories.filter(memory => 
    themes.some(theme => 
      memory.context.life_systems.includes(theme) ||
      memory.content.toLowerCase().includes(theme)
    )
  );
}

async function analyzeTransformationTrajectory(memories: SemanticMemory[], context: AIContext): Promise<any> {
  if (memories.length === 0) return { trend: 'insufficient_data' };
  
  const sortedMemories = memories.sort((a, b) => 
    new Date(a.context.session_date).getTime() - new Date(b.context.session_date).getTime()
  );
  
  const trajectory = {
    start_phase: sortedMemories[0].context.phase,
    current_phase: context.user.current_phase,
    depth_progression: sortedMemories.map(m => m.context.depth_level),
    breakthrough_points: sortedMemories.filter(m => m.memory_type === 'breakthrough').length,
    pattern_evolution: sortedMemories.filter(m => m.memory_type === 'pattern').length,
    trend: 'progressing', // Would calculate actual trend
  };
  
  return trajectory;
}

async function generateFocusRecommendations(
  memories: SemanticMemory[],
  trajectory: any,
  context: AIContext
): Promise<string[]> {
  const recommendations = [];
  
  // Analyze memory patterns for recommendations
  const memoryTypes = memories.map(m => m.memory_type);
  const typeFrequency: { [key: string]: number } = {};
  
  memoryTypes.forEach(type => {
    typeFrequency[type] = (typeFrequency[type] || 0) + 1;
  });
  
  // Recommend based on gaps
  if (typeFrequency.pattern < 2) {
    recommendations.push('Focus on identifying behavior patterns');
  }
  
  if (typeFrequency.connection < 2) {
    recommendations.push('Explore connections between life systems');
  }
  
  if (trajectory.depth_progression.length > 0) {
    const avgDepth = trajectory.depth_progression.reduce((a: number, b: number) => a + b, 0) / trajectory.depth_progression.length;
    if (avgDepth < 7) {
      recommendations.push('Deepen reflection and analysis practices');
    }
  }
  
  return recommendations.length > 0 ? recommendations : ['Continue current exploration patterns'];
}

export default semanticMemorySystem;