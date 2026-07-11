module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:react/jsx-runtime',
    ],
    ignorePatterns: ['dist', 'node_modules'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true,
        },
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
    plugins: ['react-refresh'],
    rules: {
        'no-unused-vars': ['error', { varsIgnorePattern: '^React$' }],
        'react-refresh/only-export-components': 'off',
        'react/prop-types': 'off',
    },
};
