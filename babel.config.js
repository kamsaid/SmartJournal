module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/services': './src/services',
            '@/utils': './src/utils',
            '@/constants': './src/constants',
            '@/types': './src/types',
            '@/hooks': './src/hooks',
            '@/navigation': './src/navigation',
            '@/ai': './src/ai',
            '@/design-system': './src/design-system',
            '@/contexts': './src/contexts'
          }
        }
      ],
      'react-native-reanimated/plugin' // This should be last
    ]
  };
}; 