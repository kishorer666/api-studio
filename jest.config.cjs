module.exports = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/dist/'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};