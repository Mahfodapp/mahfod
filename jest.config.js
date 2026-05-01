/**
 * jest.config.js — Test configuration for MAHFOD app
 *
 * Uses inline config instead of jest-expo preset to avoid preset
 * resolution issues on machines where jest-expo isn't installed.
 */
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    // Silence native module imports that can't run in Node
    '^expo-haptics$': '<rootDir>/src/tests/__mocks__/expo-haptics.js',
    '^expo-notifications$': '<rootDir>/src/tests/__mocks__/expo-notifications.js',
    '^react-native$': require.resolve('react-native'),
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '__mocks__',
  ],
  globals: {
    'ts-jest': { tsconfig: { jsx: 'react' } },
  },
};
