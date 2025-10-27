module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true
    },
    extends: ['airbnb', 'plugin:jsx-a11y/recommended', 'plugin:react-hooks/recommended', 'prettier'],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
            experimentalObjectRestSpread: true,
            impliedStrict: true
        }
    },
    settings: {
        react: { version: '18.2' },
        'import/resolver': {
            node: {
                moduleDirectory: ['node_modules', 'src/']
            },
            alias: {
                map: [
                    ['@', './src'],
                    ['@core', './src/core'],
                    ['@app', './src/app'],
                    ['@views', './src/app/views'],
                    ['@assets', './src/assets'],
                    ['@store', './src/app/store'],
                    ['@hooks', './src/hooks']
                ],
                extensions: ['.js', '.jsx', '.ts', '.tsx']
            }
        }
    },
    plugins: ['react', 'react-hooks', 'prettier', 'import', 'react-refresh'],
    rules: {
        'jsx-a11y/no-autofocus': [
            'error',
            {
                ignoreNonDOM: false
            }
        ],
        'react/jsx-no-target-blank': [
            'error',
            {
                allowReferrer: false
            }
        ],
        'react-refresh/only-export-components': ['warn', { allowConstantExport: false }],
        'react/jsx-filename-extension': 'error',
        'no-param-reassign': ['error', { props: false }],
        'react/prop-types': 'warn',
        'react/require-default-props': 'off',
        'react/no-array-index-key': 'error',
        'react/jsx-props-no-spreading': 'error',
        'react/forbid-prop-types': 'error',
        'import/order': 'error',
        'import/no-cycle': 'error',
        'no-console': 'warn',
        'jsx-a11y/anchor-is-valid': 'error',
        'prefer-destructuring': 'error',
        'no-shadow': 'error',
        'import/prefer-default-export': 'warn',
        'react/no-unstable-nested-components': 'error',
        'prefer-regex-literals': 'error',
        'no-promise-executor-return': 'error',
        'no-unsafe-optional-chaining': 'error',
        'react/jsx-no-constructed-context-values': 'error',
        'react/jsx-no-useless-fragment': 'error',
        'react/function-component-definition': 'error',
        'react/react-in-jsx-scope': 'off',
        'import/no-named-as-default': 'error',
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: ['vite.config.js', '**/*.config.js']
            }
        ],
        'no-unused-vars': [
            'warn',
            {
                ignoreRestSiblings: true
            }
        ],
        'no-var': 'error',
        'prettier/prettier': [
            'error',
            {
                bracketSpacing: true,
                printWidth: 120,
                singleQuote: true,
                trailingComma: 'none',
                tabWidth: 4,
                useTabs: false,
                endOfLine: 'auto'
            }
        ]
    }
}


