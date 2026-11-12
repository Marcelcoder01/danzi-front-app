// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const features = ['academy', 'danzi-students'];

const isolationFor = (feature) => ({
  files: [`src/app/features/${feature}/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: features
          .filter((other) => other !== feature)
          .flatMap((other) => [
            {
              group: [`@${other}/*`, `**/features/${other}/**`],
              message: `La feature "${feature}" no puede importar de "${other}". Mueve el código compartido a domain/ o shared/.`,
            },
          ]),
      },
    ],
  },
});

module.exports = tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
    },
  },
  ...features.map(isolationFor),
  {
    files: ['src/app/shared/**/*.ts', 'src/app/core/**/*.ts', 'src/app/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: features.flatMap((f) => [`@${f}/*`, `**/features/${f}/**`]),
              message: 'shared/, core/ y domain/ no pueden depender de las features.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
    rules: {},
  },
);
