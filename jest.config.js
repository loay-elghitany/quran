module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/tests/setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/frontend/"],
  verbose: true,
  bail: 1,
};
