module.exports = {
  preset: 'react-native',
  // Watchman can't resolve this project's root in some sandboxed environments and
  // falls back to a slow node crawl after a long timeout. Skip straight to the crawler.
  watchman: false,
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|react-native-safe-area-context|@react-native-async-storage/async-storage|@d11/react-native-fast-image)/)',
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
};
