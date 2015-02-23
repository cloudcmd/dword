#!/usr/bin/env node

(function() {
    'use strict';
    
    var fs              = require('fs'),
        path            = require('path'),
        rendy           = require('rendy'),
        args            = process.argv.slice(2),
        arg             = args[0];
        
    if (!arg)
        usage();
    else if (/^(-v|--v)$/.test(arg))
        version();
    else if (/^(-h|--help)$/.test(arg))
        help();
    else
        checkFile(arg, function(error) {
           if (!error)
                main(arg);
            else
                console.error(error.message);
       });
    
    function getPath(name) {
        var reg = /^(~|\/)/;
        
        if (!reg.test(name))
            name = process.cwd() + '/';
        
        return name;
    }
    
    function main(name) {
        var socket,
            edSocket,
            cwd         = getPath(name),
            filename    = path.normalize(cwd + name),
            DIR         = __dirname + '/../assets/',
            dword      = require('../'),
            http        = require('http'),
            express     = require('express'),
            io          = require('socket.io'),
            restafary   = require('restafary'),
            
            app         = express(),
            server      = http.createServer(app),
            
            env         = process.env,
            
            port        =   env.PORT            ||  /* c9           */
                            env.app_port        ||  /* nodester     */
                            env.VCAP_APP_PORT   ||  /* cloudfoundry */
                            1337,
            ip          =   env.IP              ||  /* c9           */
                            '0.0.0.0';
        
        app .use(restafary({
                prefix: '/api/v1/fs'
            }))
            .use(express.static(DIR))
            .use(dword({
                minify: false,
                online: false
            }));
        
        server.listen(port, ip);
        
        socket      = io.listen(server),
        edSocket    = dword.listen(socket);
        
        edSocket.on('connection', function() {
            fs.readFile(name, 'utf8', function(error, data) {
                if (error)
                    console.error(error.message);
                else
                    edSocket.emit('file', filename, data);
                });
        });
        
        console.log('url: http://' + ip + ':' + port);
    }
    
    function checkFile(name, callback) {
        var ERROR_ENOENT    = 'Error: no such file or directory: \'{{ name }}\'',
            ERROR_ISDIR     = 'Error: \'{{ name }}\' is directory';
        
        fs.stat(name, function(error, stat) {
            var msg;
            
            if (error && error.code === 'ENOENT')
                msg = ERROR_ENOENT;
            else if (stat.isDirectory())
                msg = ERROR_ISDIR;
                
            if (msg)
                error = {
                    message: rendy(msg, {
                        name: arg
                    })
                };
            
            callback(error);
        });
    }
    
    function version() {
        console.log('v' + info().version);
    }
    
    function info() {
        return require('../package');
    }
    
    function usage() {
        var msg = 'Usage: ' + info().name + ' [filename]';
        console.log(msg);
    }
    
    function help() {
        var bin         = require('../json/bin');
            
        usage();
        console.log('Options:');
        
        Object.keys(bin).forEach(function(name) {
            var line = '  ' + name + ' ' + bin[name];
            console.log(line);
        });
    }
})();
