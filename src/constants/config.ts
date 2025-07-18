import Constants from 'expo-constants';

// Environment variable validation
const validateConfig = () => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

  if (!supabaseUrl) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL is required in .env file');
  }
  if (!supabaseAnonKey) {
    throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY is required in .env file');
  }
  if (!openaiApiKey) {
    console.warn('EXPO_PUBLIC_OPENAI_API_KEY is missing - AI features will be disabled');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    openaiApiKey,
  };
};

const envVars = validateConfig();

const config = {
  supabase: {
    url: envVars.supabaseUrl,
    anonKey: envVars.supabaseAnonKey,
  },
  openai: {
    apiKey: envVars.openaiApiKey || '',
  },
  app: {
    name: 'Life Systems Architect',
    version: Constants.expoConfig?.version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
  },
};

export default config;