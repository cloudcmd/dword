'use strict';

const DIR_ROOT = __dirname + '/..';
const path = require('path');

const restafary = require('restafary');
const restbox = require('restbox');
const socketFile = require('socket-file');
const {Router} = require('express');
const currify = require('currify');
const storage = require('fullstore');
const join = require('join-io');

const editFn = require('./edit');

const rootStorage = storage();
const optionsStorage = storage();

const optionsFn = currify(configFn);
const dword = currify(_dword);
const restboxFn = currify(_restboxFn);
const joinFn = currify(_joinFn);

const readjson = require('readjson');
const HOME = require('os').homedir();

const isDev = process.env.NODE_ENV === 'development';

const readJSHINT = () => {
    const home = path.join(HOME, '.jshintrc');
    const root = path.join(DIR_ROOT,'.jshintrc');
    
    return readjson.sync.try(home) || readjson.sync(root);
};

const jshint = readJSHINT();

const cut = currify((prefix, req, res, next) => {
    req.url = req.url.replace(prefix, '');
    next();
});

module.exports = (options) => {
    options = options || {};
    optionsStorage(options);
    
    const router = Router();
    const prefix = options.prefix || '/dword';
    
    const {
        dropbox,
        dropboxToken,
    } = options;
    
    router.route(prefix + '/*')
        .all(cut(prefix))
        .get(dword(prefix))
        .get(optionsFn(options))
        .get(editFn)
        .get(modulesFn)
        .get(jshintFn)
        .get(restboxFn({prefix, dropbox, dropboxToken}))
        .get(restafaryFn)
        .get(joinFn(options))
        .get(staticFn)
        .put(restboxFn({prefix, dropbox, dropboxToken}))
        .put(restafaryFn);
    
    return router;
};

module.exports.listen = (socket, options) => {
    options = options || {};
    
    const {
        root = '/',
        auth,
        prefixSocket = '/dword',
    } = options;
    
    rootStorage(root);
    
    return socketFile(socket, {
        root,
        auth,
        prefix: prefixSocket,
    });
};

function checkOption(isOption) {
    if (typeof isOption === 'function')
        return isOption();
    
    if (typeof isOption === 'undefined')
        return true;
    
    return isOption;
}

function _dword(prefix, req, res, next) {
    if (/^\/dword\.js(\.map)?$/.test(req.url))
        req.url = `/dist${req.url}`;
    
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
        dir: DIR_ROOT,
    });
    
    joinFunc(req, res, next);
}

function _restboxFn({dropbox, dropboxToken}, req, res, next) {
    if (!dropbox)
        return next();
    
    const {url} = req;
    const api = '/api/v1';
    const indexOf = url.indexOf.bind(url);
    const not = (fn) => (a) => !fn(a);
    const is = [
        `/api/v1`,
    ].some(not(indexOf));
    
    if (!is)
        return next();
    
    const middle = restbox({
        prefix: api,
        token: dropboxToken,
        root: rootStorage(),
    });
    
    middle(req, res, next);
}

function restafaryFn(req, res, next) {
    const {url} = req;
    const api = '/api/v1/fs';
    const indexOf = url.indexOf.bind(url);
    const not = (fn) => (a) => !fn(a);
    const isRestafary = [
        `/api/v1`,
        '/restafary.js',
    ].some(not(indexOf));
    
    if (!isRestafary)
        return next();
    
    const restafaryFunc = restafary({
        prefix: api,
        root: rootStorage(),
    });
    
    restafaryFunc(req, res, next);
}

function staticFn(req, res) {
    const file = path.normalize(DIR_ROOT + req.url);
    res.sendFile(file);
}

