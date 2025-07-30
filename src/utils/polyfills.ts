// Polyfills for missing browser APIs in React Native
// These are required for newer versions of Supabase and other dependencies

/**
 * Polyfill for structuredClone (missing in React Native)
 * Used by @supabase/supabase-js v2.51.0+
 */
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (obj: any) => {
    // Simple implementation using JSON for most cases
    // This handles the majority of use cases that Supabase needs
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch (error) {
      // Fallback for non-serializable objects
      console.warn('structuredClone polyfill: Using shallow copy for non-serializable object');
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => structuredClone(item));
      }
      
      // For plain objects, copy properties
      const cloned: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = structuredClone(obj[key]);
        }
      }
      return cloned;
    }
  };
  
  console.log('✅ structuredClone polyfill loaded for React Native compatibility');
}

/**
 * Additional polyfills can be added here as needed
 */

export {}; // Make this a module 