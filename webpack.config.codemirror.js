'use strict';

const path = require('path');
const webpack = require('webpack');
const {optimize} = webpack;

const dir = './codemirror';

const {env} = process;
const isDev = env.NODE_ENV === 'development';

const dist = path.resolve(__dirname, 'dist');
const distDev = path.resolve(__dirname, 'dist-dev');
const devtool = isDev ? 'eval' : 'source-map';
const notEmpty = (a) => a;
const clean = (array) => array.filter(notEmpty);

const rules = clean([
    !isDev && {
        test: /\.js$/,
        loader: 'babel-loader',
}]);

module.exports = {
    devtool,
    entry: {
        CodeMirror: `${dir}/codemirror.js`,
    },
    output: {
        library: 'CodeMirror',
        filename: 'codemirror.js',
        path: isDev ? distDev : dist,
        pathinfo: isDev,
        libraryTarget: 'var',
        devtoolModuleFilenameTemplate,
    },
    module: {
        rules,
    },
};

function devtoolModuleFilenameTemplate(info) {
    const resource = info.absoluteResourcePath.replace(__dirname + path.sep, '');
    return `file://codemirror/${resource}`;
}

