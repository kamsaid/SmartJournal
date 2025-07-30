// Global type declarations for React Native environment

declare global {
  /**
   * structuredClone polyfill for React Native
   * The native function is not available in React Native, so we provide a polyfill
   */
  function structuredClone<T>(value: T): T;
  
  namespace NodeJS {
    interface Global {
      structuredClone: <T>(value: T) => T;
    }
  }
}

export {}; 