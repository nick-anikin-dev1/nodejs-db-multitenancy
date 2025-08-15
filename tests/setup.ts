// Global test setup
process.env.NODE_ENV = 'test';

// Note: Jest globals are available at runtime, not compile time
// These will be available when Jest runs the tests

// Global test utilities
(global as any).testUtils = {
  // Add any global test utilities here
};
