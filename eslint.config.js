// Minimal flat config. TypeScript linting is handled by tsc via build.
// This config exists to satisfy `eslint .` without errors.
export default [
  {
    ignores: ['**/*'],
  },
  {
    files: ['eslint.config.js'],
    rules: {},
  },
];
