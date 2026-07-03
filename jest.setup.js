// Jest setup: register mocks for native modules that have no implementation
// in the Node/jsdom test environment.

/* eslint-disable no-undef */

// AsyncStorage ships an official in-memory mock for Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Gesture handler needs its jest setup to register native components.
require('react-native-gesture-handler/jestSetup');

// expo-linear-gradient renders a native view; stub it with a plain View.
jest.mock('expo-linear-gradient', () => {
  const { View } = require('react-native');
  return { LinearGradient: View };
});

// Biometric auth — default to "available and successful" so screens render.
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(false),
  isEnrolledAsync: jest.fn().mockResolvedValue(false),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
}));

// Image picker — no camera/library in tests; return a canceled result by default.
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
}));

// Screen orientation is a no-op in tests.
jest.mock('expo-screen-orientation', () => ({
  unlockAsync: jest.fn().mockResolvedValue(undefined),
}));

// Filter a couple of known-noisy warnings while letting all real errors through.
const originalConsoleError = console.error;
jest.spyOn(console, 'error').mockImplementation((msg, ...args) => {
  if (typeof msg === 'string' && msg.includes('useNativeDriver')) return;
  originalConsoleError(msg, ...args);
});
