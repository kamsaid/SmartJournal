import { openAIService } from './openAIService';
import { supabase } from '../supabase/client';
import { generateUUID } from '@/utils/uuid';
import { PlanIntent, PlanTask } from '@/types/database';

// AI Prompts for plan generation
const CLARIFY_PROMPT = `
You are a concise life coach.
Rewrite the following goal in <=12 words, starting with a strong verb.
If vague, ask ONE clarifying question first.
User goal: "{{raw_intent}}"
`;

const CHUNK_PROMPT = `
Role: Systems-thinking coach.
Turn the clarified goal below into exactly THREE atomic actions, each <=30 min.
Respond as JSON array: [{"title":"", "estMinutes":25}]
Clarified goal: "{{clarified_intent}}"
`;

interface ClarifyAndChunkResult {
  clarifiedIntent: string;
  tasks: Array<{
    title: string;
    estMinutes: number;
  }>;
  intentId: string;
}

/**
 * Clarifies a user's intent and breaks it down into atomic tasks
 * @param intentText The raw intent text from morning check-in
 * @param userId The user's ID
 * @returns Clarified intent and generated tasks
 */
export async function clarifyAndChunk(
  intentText: string,
  userId: string
): Promise<ClarifyAndChunkResult> {
  try {
    // Step 1: Clarify the intent
    const clarifyPrompt = CLARIFY_PROMPT.replace('{{raw_intent}}', intentText);
    const clarifyResponse = await openAIService.createChatCompletion([
      {
        role: 'system',
        content: 'You are a concise life coach who helps people clarify their goals.'
      },
      {
        role: 'user',
        content: clarifyPrompt
      }
    ], {
      temperature: 0.7,
      max_tokens: 150
    });

    const clarifiedIntent = clarifyResponse.trim();

    // Step 2: Generate atomic tasks
    const chunkPrompt = CHUNK_PROMPT.replace('{{clarified_intent}}', clarifiedIntent);
    const chunkResponse = await openAIService.createChatCompletion([
      {
        role: 'system',
        content: 'You are a systems-thinking coach who breaks down goals into atomic actions.'
      },
      {
        role: 'user',
        content: chunkPrompt
      }
    ], {
      temperature: 0.7,
      max_tokens: 300
    });

    // Parse the JSON response
    let tasks: Array<{ title: string; estMinutes: number }>;
    try {
      tasks = JSON.parse(chunkResponse);
      // Validate the tasks
      if (!Array.isArray(tasks) || tasks.length !== 3) {
        throw new Error('Invalid task format');
      }
      // Ensure all tasks have valid properties
      tasks = tasks.map(task => ({
        title: String(task.title || 'Task'),
        estMinutes: Math.min(30, Math.max(5, Number(task.estMinutes) || 25))
      }));
    } catch (parseError) {
      console.error('Failed to parse AI response:', chunkResponse);
      // Fallback to default tasks
      tasks = [
        { title: 'Define first step', estMinutes: 20 },
        { title: 'Take initial action', estMinutes: 25 },
        { title: 'Review and adjust', estMinutes: 15 }
      ];
    }

    // Step 3: Save to database
    const date = new Date().toISOString().split('T')[0];
    const intentId = generateUUID();

    // Create plan intent record
    const planIntent: PlanIntent = {
      id: intentId,
      user_id: userId,
      date,
      intent_text: intentText,
      clarified_text: clarifiedIntent,
      created_at: new Date().toISOString()
    };

    // Save intent to database
    const { error: intentError } = await supabase
      .from('plan_intents')
      .insert(planIntent);

    if (intentError) {
      console.error('Error saving plan intent:', intentError);
      throw new Error('Failed to save plan intent');
    }

    // Create task records
    const planTasks: PlanTask[] = tasks.map(task => ({
      id: generateUUID(),
      intent_id: intentId,
      title: task.title,
      est_minutes: task.estMinutes,
      status: 'pending' as const,
      created_at: new Date().toISOString()
    }));

    // Save tasks to database
    const { error: tasksError } = await supabase
      .from('plan_tasks')
      .insert(planTasks);

    if (tasksError) {
      console.error('Error saving plan tasks:', tasksError);
      throw new Error('Failed to save plan tasks');
    }

    return {
      clarifiedIntent,
      tasks,
      intentId
    };
  } catch (error) {
    console.error('Error in clarifyAndChunk:', error);
    throw error;
  }
}

/**
 * Updates the status of a plan task
 * @param taskId The task ID to update
 * @param status The new status
 * @param userId The user's ID (for verification)
 */
export async function updateTaskStatus(
  taskId: string,
  status: 'pending' | 'done',
  userId: string
): Promise<void> {
  try {
    // Update task status with RLS check
    const { error } = await supabase
      .from('plan_tasks')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task status:', error);
      throw new Error('Failed to update task status');
    }
  } catch (error) {
    console.error('Error in updateTaskStatus:', error);
    throw error;
  }
}

/**
 * Fetches today's plan intents and tasks for a user
 * @param userId The user's ID
 * @returns Array of intents with their tasks
 */
export async function getTodayPlanIntents(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch intents with their tasks
    const { data: intents, error } = await supabase
      .from('plan_intents')
      .select(`
        *,
        plan_tasks (*)
      `)
      .eq('user_id', userId)
      .eq('date', today)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching plan intents:', error);
      throw new Error('Failed to fetch plan intents');
    }

    return intents || [];
  } catch (error) {
    console.error('Error in getTodayPlanIntents:', error);
    throw error;
  }
} 