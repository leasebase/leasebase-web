const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/unit/jest.setup.ts"],
  roots: ["<rootDir>/tests/unit"],
  testMatch: ["**/*.test.{ts,tsx}"],
  modulePathIgnorePatterns: ["<rootDir>/.next"],
  moduleNameMapper: {
    "^@/components/(.*)$": "<rootDir>/src/components/$1",
    "^@/lib/(.*)$": "<rootDir>/src/lib/$1",
    "^@/types/(.*)$": "<rootDir>/src/types/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",
  },
};

module.exports = createJestConfig(config);
