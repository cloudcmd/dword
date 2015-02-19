(function() {
    'use strict';
    
    var fs          = require('fs'),
        path        = require('path'),
    
        Emitter     = require('events').EventEmitter,
        patch       = require('patchfile'),
        ashify      = require('ashify'),
        
        mellow      = require('mellow');
    
    module.exports          = function(sock, options) {
        var emitter = new Emitter();
        
        if (!options)
            options = {
                size: 512000
            };
        
        process.nextTick(function() {
            listen(sock, options, emitter);
        });
        
        return emitter;
    };
    
    function listen(sock, options, emitter) {
        sock.of('/dword')
            .on('connection', function(socket) {
                var onError = function(error) {
                        socket.emit('err', error);
                    },
                    onFile  = function(name, data) {
                        var filename = mellow.pathFromWin(name);
                        
                        socket.emit('file', filename, data);
                    };
                
                emitter.on('error', onError);
                
                emitter.on('file', onFile);
                
                socket.on('patch', function(name, data) {
                    name = mellow.pathToWin(name);
                    
                    getHash(name, function(error, hash) {
                        if (error)
                            socket.emit('err', error.message);
                        else
                            patch(name, data, options, function(error) {
                                var msg, baseName;
                                
                                if (error) {
                                    socket.emit('err', error.message);
                                } else {
                                    baseName    = path.basename(name),
                                    msg         = 'patch: ok("' + baseName + '")';
                                    
                                    socket.emit('message', msg);
                                    socket.broadcast.emit('patch', name, data, hash);
                                }
                            });
                    });
                });
                
                emitter.emit('connection');
                
                socket.on('disconnect', function() {
                    emitter.removeListener('error', onError);
                    emitter.removeListener('file', onFile);
                });
            });
    }
    
    function getHash(name, callback) {
        var stream  = fs.createReadStream(name),
            options = {
                algorithm: 'sha1',
                encoding: 'hex'
            };
        
        ashify(stream, options, callback);
    }
})();
