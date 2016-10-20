'use strict';

import buble from 'rollup-plugin-buble';
import uglify from 'rollup-plugin-uglify';
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
    entry: 'src/index.js',
    format: 'umd',
    dest: 'dist/codemirror.js',
    moduleName: 'CodeMirror',
    plugins: [
        buble(),
        uglify(),
        nodeResolve({
            preferBuiltins: true,
            browser: true,
        }),
    ]
};

