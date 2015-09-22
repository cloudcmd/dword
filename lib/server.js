(function() {
    'use strict';
    
    var DIR_ROOT    = __dirname + '/..',
        
        path        = require('path'),
        
        join        = require('join-io'),
        mollify     = require('mollify'),
        restafary   = require('restafary'),
        socketFile  = require('socket-file'),
        readjson    = require('readjson'),
        HOME        = require('os-homedir')(),
        Edit        = require('../json/edit.json'),
        jshint      = readjson.sync.try(path.join(HOME, '.jshintrc')),
        Root,
        minifyFunc          = mollify({
            dir     : DIR_ROOT
        });
    
    if (!jshint)
        jshint = readjson.sync(path.join(DIR_ROOT,'.jshintrc'));
    
    module.exports          = function(options) {
        return serve.bind(null, options);
    };
    
    module.exports.listen   = function(socket, options) {
        var ret;
        
        if (!options)
            options = {};
        
        if (!options.prefix)
            options.prefix = '/dword';
        
        if (!options.root)
            options.root = '/';
        
        Root = options.root;
        ret = socketFile(socket, options);
        
        return ret;
    };
    
    function checkOption(isOption) {
        var is,
            type    = typeof isOption;
        
        switch(type) {
        case 'function':
            is = isOption();
            break;
        
        case 'undefined':
            is = true;
            break;
        
        default:
            is = isOption;
        }
        
        return is;
    }
    
    function copy(from, to) {
        Object.keys(from).forEach(function(name) {
            to[name] = from[name];
        });
    }
    
    function readEdit(callback) {
        var homePath = HOME + '/.dword.json';
        
        readjson(homePath, function(error, edit) {
            var data = {};
            
            copy(Edit, data);
            
            if (!error)
                copy(edit, data);
            else if (error.code !== 'ENOENT')
                error = Error('dword --config ' + homePath + ': ' + error.message);
            else
                error = null;
            
            callback(error, data);
        });
    }
    
    function serve(options, req, res, next) {
        var joinFunc, restafaryFunc, isJoin, isConfig, isEdit, isRestafary,
            isJsHint,
            o           = options || {},
            isMin       = checkOption(o.minify),
            isOnline    = checkOption(o.online),
            isDiff      = checkOption(o.diff),
            isZip       = checkOption(o.pack),
            
            url         = req.url,
            prefix      = o.prefix || '/dword',
            
            isEdward    = !url.indexOf(prefix),
            
            URL         = '/dword.js',
            CONFIG      = '/options.json',
            MODULES     = '/modules.json',
            PATH        = '/lib/client.js',
            EDIT        = '/edit.json',
            JSHINT      = '/jshint.json',
            sendFile    = function() {
                url = path.normalize(DIR_ROOT + url);
                res.sendFile(url);
            };
        
        if (!isEdward) {
            next();
        } else {
            url         = url.replace(prefix, '');
            
            isJoin      = !url.indexOf('/join');
            isConfig    = url === CONFIG;
            isEdit      = url === EDIT;
            isJsHint    = url === JSHINT;
            isRestafary = [
                '/api/v1/fs',
                '/restafary.js'].some(function(item) {
                    return !url.indexOf(item);
                });
            
            switch(url) {
            case URL:
                url = PATH;
                break;
            
            case MODULES:
                url = '/json' + url;
                break;
            }
            
            req.url = url;
            
            if (isEdit) {
                readEdit(function(error, data) {
                    if (error)
                        res.status(404)
                            .send(error.message);
                    else
                        res .type('json')
                            .send(data);
                });
            } else if (isConfig) {
                res .type('json')
                    .send({
                        diff: isDiff,
                        zip: isZip,
                        online: isOnline
                    });
            } else if (isJoin) {
                joinFunc = join({
                    dir     : DIR_ROOT,
                    minify  : isMin
                });
                
                joinFunc(req, res, next);
            } else if (isMin) {
                minifyFunc(req, res, sendFile);
            } else if (isRestafary) {
                restafaryFunc = restafary({
                    prefix: '/api/v1/fs',
                    root: Root
                });
                
                restafaryFunc(req, res, next);
            } else if (isJsHint) {
                res .type('json')
                    .send(jshint);
            } else {
                sendFile();
            }
        }
    }
})();
