'use strict';

const DIR_ROOT = __dirname + '/..';
const path = require('path');

const restafary = require('restafary');
const socketFile = require('socket-file');
const express = require('express');
const currify = require('currify/legacy');
const storage = require('fullstore/legacy');
const join = require('join-io');

const editFn = require('./edit');

const Router = express.Router;

const rootStorage = storage();
const optionsStorage = storage();

const optionsFn = currify(configFn);
const dword = currify(_dword);
const restafaryFn = currify(_restafaryFn);
const joinFn = currify(_joinFn);

const readjson = require('readjson');
const HOME = require('os-homedir')();

const isDev = process.env.NODE_ENV === 'development';

const readJSHINT = () => {
    const home = path.join(HOME, '.jshintrc');
    const root = path.join(DIR_ROOT,'.jshintrc')
    
    return readjson.sync.try(home) || readjson.sync(root);
}

const jshint = readJSHINT();

module.exports = (options) => {
    options = options || {};
    optionsStorage(options);
    
    const router = Router();
    const prefix = options.prefix || '/dword';
    
    router.route(prefix + '/*')
        .get(dword(prefix))
        .get(optionsFn(options))
        .get(editFn)
        .get(modulesFn)
        .get(jshintFn)
        .get(restafaryFn(''))
        .get(joinFn(options))
        .get(staticFn)
        .put(restafaryFn(prefix));
    
    return router;
};

module.exports.listen = (socket, options) => {
    options = options || {};
    
    if (!options.prefix)
        options.prefix = '/dword';
    
    if (!options.root)
        options.root = '/';
    
    rootStorage(options.root);
    
    return socketFile(socket, options);
};

function checkOption(isOption) {
    if (typeof isOption === 'function')
        return isOption();
    
    if (typeof isOption === 'undefined')
        return true;
    
    return isOption;
}

function _dword(prefix, req, res, next) {
    const url = req.url
    
    if (url.indexOf(prefix))
        return next();
    
    req.url = req.url.replace(prefix, '');
    
    if (/^\/dword\.js(\.map)?$/.test(req.url))
        req.url = `/dist${req.url}`;
    
    if (/^\/dist\/codemirror.js(\.map)?$/.test(req.url))
        return next();
    
    if (isDev)
        req.url = req.url.replace(/^\/dist\//, '/dist-dev/');
    
    next();
}

function configFn(o, req, res, next) {
    const online = checkOption(o.online);
    const diff = checkOption(o.diff);
    const zip = checkOption(o.zip);
    
    if (req.url.indexOf('/options.json'))
        return next();
    
    res .type('json')
        .send({
            diff,
            zip,
            online,
        });
}

function jshintFn(req, res, next) {
    if (req.url.indexOf('/jshint.json'))
        return next();
    
    res .type('json')
        .send(jshint);
}

function modulesFn(req, res, next) {
    if (req.url.indexOf('/modules.json'))
        return next();
    
    req.url = '/json/' + req.url;
    
    next();
}

function _joinFn(o, req, res, next) {
    if (req.url.indexOf('/join'))
        return next ();
    
    const joinFunc = join({
        dir: DIR_ROOT
    });
    
    joinFunc(req, res, next);
}

function _restafaryFn(prefix, req, res, next) {
    const url = req.url
    const api = '/api/v1/fs';
    const indexOf = url.indexOf.bind(url);
    const not = (fn) => (a) => !fn(a);
    const isRestafary = [
        `${prefix}/api/v1/fs`,
        '/restafary.js'
    ].some(not(indexOf));
    
    if (!isRestafary)
        return next();
    
    req.url = url.replace(prefix, '');
    
    const restafaryFunc = restafary({
        prefix: api,
        root: rootStorage()
    });
    
    restafaryFunc(req, res, next);
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

