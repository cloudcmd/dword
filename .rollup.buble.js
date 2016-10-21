'use strict';

import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';
import nodeResolve from 'rollup-plugin-node-resolve'
import postcss from 'rollup-plugin-postcss';
import nano from 'cssnano';

export default {
    entry: 'src/index.js',
    format: 'umd',
    dest: 'dist/codemirror.js',
    moduleName: 'CodeMirror',
    plugins: [
        postcss({
            extenstions: ['.css'],
                plugins: [
                    nano
               ],
        }),
        buble(),
        uglify(),
        nodeResolve({
            preferBuiltins: true,
            browser: true,
        }),
    ]
};

