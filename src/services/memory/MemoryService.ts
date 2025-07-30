// MemoryService.ts - Conversational Memory with AI Embeddings
// This service stores user responses and enables semantic retrieval for personalized questions

import OpenAI from 'openai';
import config from '@/constants/config';
import { UserMemory, DailyCheckIn } from '@/types/database';
import { generateUUID } from '@/utils/uuid';

const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

export interface MemoryContext {
  userId: string;
  currentInput: string;
  recentResponses?: string[];
  emotionalState?: string;
  lifeAreaFocus?: string;
}

export interface RelevantMemories {
  memories: UserMemory[];
  contextSummary: string;
  memoryReferences: string[]; // Friendly references like "Last week you mentioned..."
  patterns: string[];
  confidenceScore: number;
}

export const memoryService = {
  // Store a new memory with AI analysis and embeddings
  storeMemory: async (
    userId: string,
    content: string,
    checkInDate: string,
    questionContext?: string
  ): Promise<UserMemory> => {
    try {
      // Generate embeddings for semantic search
      const embeddings = await generateEmbeddings(content);
      
      // Analyze the response with AI
      const analysis = await analyzeResponse(content, questionContext);
      
      const memory: UserMemory = {
        id: generateUUID(),
        user_id: userId,
        content,
        response_date: checkInDate,
        embeddings,
        emotional_resonance: analysis.emotionalResonance,
        depth_score: analysis.depthScore,
        patterns_mentioned: analysis.patterns,
        breakthrough_indicators: analysis.breakthroughs,
        context_tags: analysis.contextTags,
        importance_score: analysis.importanceScore,
        created_at: new Date().toISOString(),
      };

      // Store in database (will implement Supabase integration)
      await storeMemoryInDatabase(memory);
      
      return memory;
    } catch (error) {
      console.error('Error storing memory:', error);
      throw new Error('Failed to store memory');
    }
  },

  // Retrieve relevant memories for contextual question generation
  getRelevantMemories: async (
    context: MemoryContext,
    maxMemories: number = 5
  ): Promise<RelevantMemories> => {
    try {
      // Generate embeddings for current input to find similar memories
      const inputEmbeddings = await generateEmbeddings(context.currentInput);
      
      // Get user's memories from database
      const userMemories = await getUserMemories(context.userId);
      
      // Find most semantically similar memories
      const similarMemories = findSimilarMemories(inputEmbeddings, userMemories, maxMemories);
      
      // Generate friendly memory references
      const memoryReferences = generateMemoryReferences(similarMemories);
      
      // Extract patterns across relevant memories
      const patterns = extractMemoryPatterns(similarMemories);
      
      // Create context summary for AI
      const contextSummary = createContextSummary(similarMemories, patterns);
      
      return {
        memories: similarMemories,
        contextSummary,
        memoryReferences,
        patterns,
        confidenceScore: calculateRetrievalConfidence(similarMemories, context),
      };
    } catch (error) {
      console.error('Error retrieving memories:', error);
      return {
        memories: [],
        contextSummary: '',
        memoryReferences: [],
        patterns: [],
        confidenceScore: 0,
      };
    }
  },

  // Get recent memories for timeline context
  getRecentMemories: async (
    userId: string,
    days: number = 14,
    limit: number = 10
  ): Promise<UserMemory[]> => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const memories = await getUserMemories(userId);
      
      return memories
        .filter(memory => new Date(memory.response_date) >= cutoffDate)
        .sort((a, b) => new Date(b.response_date).getTime() - new Date(a.response_date).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent memories:', error);
      return [];
    }
  },

  // Find patterns across user's memory history
  identifyMemoryPatterns: async (userId: string): Promise<string[]> => {
    try {
      const memories = await getUserMemories(userId);
      
      // Collect all mentioned patterns
      const allPatterns = memories.flatMap(memory => memory.patterns_mentioned);
      
      // Count frequency and return most common patterns
      const patternCounts: Record<string, number> = {};
      allPatterns.forEach(pattern => {
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      });
      
      return Object.entries(patternCounts)
        .filter(([_, count]) => count >= 2) // Pattern must appear at least twice
        .sort(([_, a], [__, b]) => b - a)
        .slice(0, 10)
        .map(([pattern, _]) => pattern);
    } catch (error) {
      console.error('Error identifying patterns:', error);
      return [];
    }
  },

  // Get breakthrough moments for progress tracking
  getBreakthroughMoments: async (userId: string, limit: number = 5): Promise<UserMemory[]> => {
    try {
      const memories = await getUserMemories(userId);
      
      return memories
        .filter(memory => memory.breakthrough_indicators.length > 0)
        .sort((a, b) => b.importance_score - a.importance_score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting breakthrough moments:', error);
      return [];
    }
  },
};

// Helper functions

async function generateEmbeddings(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    return [];
  }
}

async function analyzeResponse(content: string, questionContext?: string): Promise<{
  emotionalResonance: number;
  depthScore: number;
  patterns: string[];
  breakthroughs: string[];
  contextTags: string[];
  importanceScore: number;
}> {
  try {
    const analysisPrompt = `Analyze this user response for a life growth conversation:

Response: "${content}"
Question Context: "${questionContext || 'General reflection'}"

Please analyze and return ONLY a valid JSON object with this exact format:
{
  "emotionalResonance": <1-10 scale, how emotionally engaged>,
  "depthScore": <1-10 scale, how deep and insightful>,
  "patterns": [array of behavioral/thinking patterns mentioned],
  "breakthroughs": [array of breakthrough moments or realizations],
  "contextTags": [array of topics, emotions, life areas mentioned],
  "importanceScore": <0-1 scale, how important this response is for their growth>
}

Look for:
- Self-awareness indicators
- Pattern recognition
- Emotional honesty
- Action-oriented thinking
- Personal responsibility
- Growth mindset markers

Return only the JSON object, no additional text or formatting.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: analysisPrompt }],
      temperature: 0.3,
    });

    let analysis: any = {};
    const responseContent = response.choices[0].message.content || '';
    
    // Try to parse JSON, handling potential formatting issues
    try {
      // Clean the response content - remove potential markdown formatting
      const cleanedContent = responseContent
        .replace(/```json\s*/, '') // Remove opening json markdown
        .replace(/```\s*$/, '')    // Remove closing markdown
        .trim();
      
      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', responseContent);
      // Fall back to extracting values manually or use defaults
      analysis = {
        emotionalResonance: 5,
        depthScore: 5,
        patterns: [],
        breakthroughs: [],
        contextTags: [],
        importanceScore: 0.5,
      };
    }
    
    return {
      emotionalResonance: analysis.emotionalResonance || 5,
      depthScore: analysis.depthScore || 5,
      patterns: analysis.patterns || [],
      breakthroughs: analysis.breakthroughs || [],
      contextTags: analysis.contextTags || [],
      importanceScore: analysis.importanceScore || 0.5,
    };
  } catch (error) {
    console.error('Error analyzing response:', error);
    return {
      emotionalResonance: 5,
      depthScore: 5,
      patterns: [],
      breakthroughs: [],
      contextTags: [],
      importanceScore: 0.5,
    };
  }
}

function findSimilarMemories(
  inputEmbeddings: number[],
  userMemories: UserMemory[],
  maxMemories: number
): UserMemory[] {
  if (inputEmbeddings.length === 0 || userMemories.length === 0) {
    return userMemories.slice(0, maxMemories);
  }

  // Calculate cosine similarity for each memory
  const memoriesWithSimilarity = userMemories.map(memory => {
    const similarity = memory.embeddings 
      ? cosineSimilarity(inputEmbeddings, memory.embeddings)
      : 0;
    
    return { memory, similarity };
  });

  // Sort by similarity and importance, return top matches
  return memoriesWithSimilarity
    .sort((a, b) => {
      // Weight by both similarity and importance
      const scoreA = a.similarity * 0.7 + a.memory.importance_score * 0.3;
      const scoreB = b.similarity * 0.7 + b.memory.importance_score * 0.3;
      return scoreB - scoreA;
    })
    .slice(0, maxMemories)
    .map(item => item.memory);
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function generateMemoryReferences(memories: UserMemory[]): string[] {
  return memories.map(memory => {
    const daysSince = Math.floor(
      (Date.now() - new Date(memory.response_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const timeRef = daysSince === 0 ? 'earlier today' :
                   daysSince === 1 ? 'yesterday' :
                   daysSince < 7 ? `${daysSince} days ago` :
                   daysSince < 30 ? `${Math.floor(daysSince / 7)} weeks ago` :
                   `${Math.floor(daysSince / 30)} months ago`;
    
    const snippet = memory.content.length > 60 
      ? memory.content.substring(0, 60) + '...'
      : memory.content;
    
    return `${timeRef} you mentioned: "${snippet}"`;
  });
}

function extractMemoryPatterns(memories: UserMemory[]): string[] {
  const allPatterns = memories.flatMap(memory => memory.patterns_mentioned);
  const uniquePatterns = [...new Set(allPatterns)];
  return uniquePatterns.slice(0, 5); // Return top 5 patterns
}

function createContextSummary(memories: UserMemory[], patterns: string[]): string {
  if (memories.length === 0) return '';
  
  const recentConcerns = memories
    .flatMap(memory => memory.context_tags)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 3);
  
  const breakthroughs = memories
    .flatMap(memory => memory.breakthrough_indicators)
    .slice(0, 2);
  
  let summary = `Recent conversation themes: ${recentConcerns.join(', ')}.`;
  
  if (patterns.length > 0) {
    summary += ` Recurring patterns: ${patterns.join(', ')}.`;
  }
  
  if (breakthroughs.length > 0) {
    summary += ` Recent insights: ${breakthroughs.join(', ')}.`;
  }
  
  return summary;
}

function calculateRetrievalConfidence(memories: UserMemory[], context: MemoryContext): number {
  if (memories.length === 0) return 0;
  
  const avgImportance = memories.reduce((sum, memory) => sum + memory.importance_score, 0) / memories.length;
  const recencyFactor = memories.some(memory => {
    const daysSince = (Date.now() - new Date(memory.response_date).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  }) ? 0.2 : 0;
  
  return Math.min(avgImportance + recencyFactor, 1);
}

// Database interaction placeholders (will implement with Supabase)
async function storeMemoryInDatabase(memory: UserMemory): Promise<void> {
  // TODO: Implement Supabase storage
  console.log('Storing memory:', memory.id);
}

async function getUserMemories(userId: string): Promise<UserMemory[]> {
  // TODO: Implement Supabase retrieval
  // For now, return empty array
  return [];
}

export default memoryService;