module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!**/node_modules/**'
  ]
};
