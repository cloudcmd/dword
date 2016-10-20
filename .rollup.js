import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';

export default {
    entry: 'src/index.js',
    moduleName: 'CodeMirror',
    plugins: [
        commonjs({
            include: [
                'node_modules/**'
            ]
        }),
        nodeResolve({
            preferBuiltins: true,
            browser: true,
        }),
        babel({
            exclude: 'node_modules/**',
            runtimeHelpers: true,
            externalHelpers: true
        }),
        uglify(),
        filesize()
    ]
};

