import OpenAI from 'openai';
import config from '@/constants/config';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey,
});

// Export interface for chat messages
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Simple OpenAI service wrapper
export const openAIService = {
  /**
   * Creates a chat completion using OpenAI API
   * @param messages Array of chat messages
   * @param options Optional parameters for the completion
   * @returns The assistant's response content
   */
  createChatCompletion: async (
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      max_tokens?: number;
      model?: string;
    }
  ): Promise<string> => {
    try {
      const completion = await openai.chat.completions.create({
        model: options?.model || 'gpt-4-turbo-preview',
        messages,
        temperature: options?.temperature || 0.7,
        max_tokens: options?.max_tokens || 500,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI response');
    }
  },
}; 