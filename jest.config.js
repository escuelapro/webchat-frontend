module.exports = {
  collectCoverageFrom: [
    'app/**/*.{js,jsx}',
    '!app/**/*.test.{js,jsx}',
    '!app/*/RbGenerated*/*.{js,jsx}',
    '!app/app.js',
    '!app/global-styles.js',
    '!app/*/*/Loadable.{js,jsx}',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    'app/utils/checkStore.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'app/utils/reducerInjectors.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'app/utils/sagaInjectors.js': {
      statements: 100,
      branches: 90,
      functions: 100,
      lines: 100,
    },
    'app/utils/request.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'app/utils/storage.js': {
      statements: 90,
      branches: 80,
      functions: 100,
      lines: 90,
    },
    'app/containers/App/reducer.js': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    'app/components/Chat/MessageList/reducer.js': {
      statements: 100,
      branches: 90,
      functions: 100,
      lines: 100,
    },
    'app/components/Chat/MessageList/saga.js': {
      statements: 95,
      branches: 75,
      functions: 100,
      lines: 95,
    },
    'app/components/Chat/MessageList/index.js': {
      statements: 100,
      branches: 90,
      functions: 100,
      lines: 100,
    },
  },
  moduleDirectories: ['node_modules', 'app'],
  moduleNameMapper: {
    '.*\\.(css|less|styl|scss|sass)$': '<rootDir>/internals/mocks/cssModule.js',
    '.*\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/internals/mocks/image.js',
  },
  setupFilesAfterEnv: [
    '<rootDir>/internals/testing/test-bundler.js',
    'react-testing-library/cleanup-after-each',
  ],
  setupFiles: ['raf/polyfill'],
  testRegex: 'tests/.*\\.test\\.js$',
  snapshotSerializers: [],
};
