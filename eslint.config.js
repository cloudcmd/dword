import {safeAlign} from 'eslint-plugin-putout';
import {matchToFlat} from '@putout/eslint-flat';
import {defineConfig} from 'eslint/config';

export const match = {
    '**/client/*': {
        'n/no-unsupported-features/node-builtins': 'off',
    },
};

export default defineConfig([safeAlign, matchToFlat(match)]);
