import { randomUUID } from 'expo-crypto';

/**
 * Generate a random UUID v4 compatible with React Native
 * Uses expo-crypto which provides cross-platform UUID generation
 */
export const generateUUID = (): string => {
  return randomUUID();
};

/**
 * Demo user UUID for testing purposes
 * This replaces the hardcoded "demo-user" string with a valid UUID
 */
export const DEMO_USER_UUID = '550e8400-e29b-41d4-a716-446655440000';

/**
 * Validate if a string is a valid UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}; 