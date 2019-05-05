'use strict';

const {run} = require('madrun');

module.exports = {
    'start': () => 'bin/dword.js package.json',
    'start:dev': () => `NODE_ENV=development ${run('start')}`,
    'lint': () => run(['putout', 'lint:*']),
    'lint:bin': () => 'eslint --rule \'no-console:0\' bin',
    'lint:client': () => 'eslint --env browser --rule \'no-console:0\' client',
    'lint:server': () => 'eslint server madrun.js',
    'putout': () => 'putout bin client server madrun.js',
    'fix:lint': () => run(['putout', 'lint:*'], '--fix'),
    'build-progress': () => 'webpack --progress',
    'build:client': () => run('build-progress', '--mode production'),
    'build:client:dev': () => `NODE_ENV=development ${run('build-progress')} --mode development`,
    'build:start': () => run(['build:client', 'start']),
    'build:start:dev': () => run(['build:client:dev', 'start:dev']),
    'cp:codemirror:modules': () => 'cp -r node_modules/codemirror modules/',
    'build-progress:codemirror': () => 'webpack --progress --config ./webpack.config.codemirror.js',
    'build:codemirror:dev': () => `NODE_ENV=development ${run('build-progress:codemirror')} --mode development`,
    'build:codemirror': () => run('build-progress:codemirror', '--mode production'),
    'watch:server': () => run('watch' , run('start')),
    'watch:client': () => run('watch', run('build:client:dev')),
    'watch': () => 'nodemon -w server -w client -x',
    'build': () => run(['build:client*', 'build:codemirror*', 'cp:codemirror:*']),
    'wisdom': () => run('build'),
    'rm:dist': () => 'rimraf dist',
    'rm:dist-dev': () => 'rimraf dist-dev',
};

