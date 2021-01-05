module.exports = {
    root: true,
    env: {
        node: true,
        browser: true,
        commonjs: true,
        es6: true
    },
    extends: ['plugin:vue/essential', 'eslint:recommended'],
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        quotes: ['error', 'single'],
        semi: ['error', 'never'],
        indent: 'off',
        eqeqeq: 2,
        'vue/script-indent': ['error', 4, { baseIndent: 1, switchCase: 1 }],
        'vue/no-parsing-error': [2, { 'x-invalid-end-tag': false }],
        'no-multiple-empty-lines': [2, { max: 1 }],
        'no-trailing-spaces': 2,
        'no-this-before-super': 2,
        'no-undef': 2,
        'no-redeclare': 0,
        'no-spaced-func': 2,
        'no-sparse-arrays': 2,
        'comma-spacing': 2,
        'space-infix-ops': 2,
        'space-unary-ops': [2, { words: true, nonwords: false }],
        'key-spacing': [2, { 'beforeColon': false, 'afterColon': true, 'mode': 'strict' }],
        'keyword-spacing': ['error', { before: true }],
        'space-before-function-paren': [2, 'always'],
        'space-in-parens': [2, 'never'],
        'default-case': ["error", { "commentPattern": "^skip\\sdefault" }]
    },
    parserOptions: {
        parser: 'babel-eslint',
        ecmaVersion: 2017
    }
}
