module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json'
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:security/recommended'
  ],
  plugins: ['@typescript-eslint', 'security'],
  env: {
    node: true,
    es6: true,
    jest: true
  },
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

    // Security rules
    'security/detect-object-injection': 'off', // Too many false positives
    'security/detect-non-literal-fs-filename': 'off',

    // General rules
    'no-console': 'off', // Allow console in examples
    'prefer-const': 'error',
    'no-var': 'error'
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.js']
};
