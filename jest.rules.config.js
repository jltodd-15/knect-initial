// Security rules tests only. Kept apart from jest.config.js (React Native preset) so
// `npm test` never needs a JDK or a running emulator. Run via `npm run test:rules`.
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/firestore-tests'],
  watchman: false,
};
