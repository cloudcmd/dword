'use strict';

const DIR_ROOT = __dirname + '/..';
const path = require('path');

const restafary = require('restafary');
const socketFile = require('socket-file');
const express = require('express');
const currify = require('currify/legacy');
const mollify = require('mollify');
const join = require('join-io');

const storage = require('./storage');
const editFn = require('./edit');

const Router = express.Router;

const rootStorage = storage();
const optionsStorage = storage();

const optionsFn = currify(configFn);
const restafaryFn = currify(_restafaryFn);
const joinFn = currify(_joinFn);

const readjson = require('readjson');
const HOME = require('os-homedir')();

const readJSHINT = () => {
    const home = path.join(HOME, '.jshintrc');
    const root = path.join(DIR_ROOT,'.jshintrc')
    
    return readjson.sync.try(home) || readjson.sync(root);
}

const jshint = readJSHINT();

const minifyFunc = mollify({
    dir : DIR_ROOT
});

module.exports = (options = {}) => {
    optionsStorage(options);
    
    const router = Router();
    const prefix = options.prefix || '/dword';
    
    router.route(prefix + '/*')
        .get(dword(options))
        .get(optionsFn(options))
        .get(editFn)
        .get(modulesFn)
        .get(jshintFn)
        .get(restafaryFn(''))
        .get(joinFn(options))
        .get(minifyFn)
        .get(staticFn)
        .put(restafaryFn(prefix));
    
    return router;
};

module.exports.listen = (socket, options = {}) => {
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

function dword(options) {
    return serve.bind(null, options);
}

function serve(options, req, res, next) {
    const o = options || {};
    const prefix = o.prefix || '/dword';
    const url = req.url
    
    if (url.indexOf(prefix))
        return next();
    
    req.url = req.url.replace(prefix, '');
    
    if (req.url === '/dword.js')
        req.url = '/client' + req.url;
    
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
    const minify = checkOption(o.minify);
    
    if (req.url.indexOf('/join'))
        return next ();
        
    const joinFunc = join({
        minify,
        dir: DIR_ROOT
    });
    
    joinFunc(req, res, next);
}

function _restafaryFn(prefix, req, res, next) {
    const {url} = req;
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

function minifyFn(o, req, res, next) {
    const url = req.url;
    const minify = checkOption(o.minify);
    
    if (!minify)
        return next();
    
    const sendFile = (url) => () => {
        const file = path.normalize(DIR_ROOT + url);
        res.sendFile(file);
    };
    
    minifyFunc(req, res, sendFile(url));
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

