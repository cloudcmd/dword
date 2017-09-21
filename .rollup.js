import babel from 'rollup-plugin-babel';
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs';
import uglify from 'rollup-plugin-uglify';
import filesize from 'rollup-plugin-filesize';
import postcss from 'rollup-plugin-postcss';
import nano from 'cssnano';

export default {
    input: 'src/index.js',
    name: 'CodeMirror',
    plugins: [
    postcss({
        extenstions: ['.css'],
            plugins: [
                nano
           ],
         }),
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
            runtimeHelpers: false,
            externalHelpers: false
        }),
        uglify(),
        filesize()
    ]
};

