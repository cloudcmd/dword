'use strict';

const {run} = require('madrun');

module.exports = {
    'start': () => 'bin/dword.js package.json',
    'start:dev': async () => `NODE_ENV=development ${await run('start')}`,
    'lint': () => `putout .`,
    'fresh:lint': () => run('lint', '--fresh'),
    'lint:fresh': () => run('lint', '--fresh'),
    'fix:lint': () => run('lint', '--fix'),
    'build-progress': () => 'webpack --progress',
    'build:client': () => run('build-progress', '--mode production'),
    'build:client:dev': async () => `NODE_ENV=development ${await run('build-progress')} --mode development`,
    'build:start': () => run(['build:client', 'start']),
    'build:start:dev': () => run(['build:client:dev', 'start:dev']),
    'cp:codemirror:modules': () => 'cp -r node_modules/codemirror modules/',
    'build-progress:codemirror': () => 'webpack --progress --config ./webpack.config.codemirror.js',
    'build:codemirror:dev': async () => `NODE_ENV=development ${await run('build-progress:codemirror')} --mode development`,
    'build:codemirror': () => run('build-progress:codemirror', '--mode production'),
    'watch:server': async () => await run('watch', await run('start')),
    'watch:client': async () => await run('watch', await run('build:client:dev')),
    'watch': () => 'nodemon -w server -w client -x',
    'build': () => run(['build:client*', 'build:codemirror*', 'cp:codemirror:*']),
    'wisdom': () => run('build'),
    'rm:dist': () => 'rimraf dist',
    'rm:dist-dev': () => 'rimraf dist-dev',
};

