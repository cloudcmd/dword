#!/usr/bin/env node

'use strict';

const fs = require('fs');
const args = process.argv.slice(2);
const [arg] = args;

if (!arg)
    usage();
else if (/^(-v|--v)$/.test(arg))
    version();
else if (/^(-h|--help)$/.test(arg))
    help();
else
    checkFile(arg, (error) => {
        if (!error)
            return main(arg);
        
        console.error(error.message);
    });

function getPath(name) {
    const reg = /^(~|\/)/;
    
    if (!reg.test(name))
        name = process.cwd() + '/' + name;
    
    return name;
}

function main(name) {
    const filename = getPath(name);
    const DIR = __dirname + '/../assets/';
    const dword = require('..');
    const http = require('http');
    const express = require('express');
    const io = require('socket.io');
    
    const app = express();
    const server = http.createServer(app);
    
    const {env} = process;
    
    const port = env.PORT || /* c9           */
                    env.VCAP_APP_PORT || /* cloudfoundry */
                    1337;
    
    const ip = env.IP || /* c9           */
                '0.0.0.0';
    
    app .use(express.static(DIR))
        .use(dword({
            online: false,
            diff: true,
            zip: true,
        }));
    
    server.listen(port, ip);
    
    const socket = io.listen(server);
    const edSocket = dword.listen(socket);
    
    edSocket.on('connection', () => {
        fs.readFile(name, 'utf8', (error, data) => {
            if (error)
                return console.error(error.message);
            
            edSocket.emit('file', filename, data);
        });
    });
    
    console.log('url: http://' + ip + ':' + port);
}

function checkFile(name, callback) {
    fs.stat(name, (error, stat) => {
        let msg;
        
        if (error && error.code === 'ENOENT')
            msg = Error(`no such file or directory: '${name}'`);
        else if (stat.isDirectory())
            msg = Error(`'${name}' is directory`);
        
        callback(msg);
    });
}

function version() {
    console.log(`v${info().version}`);
}

function info() {
    return require('../package');
}

function usage() {
    console.log(`Usage: ${info().name} [filename]`);
}

function help() {
    const bin = require('../json/bin');
    
    usage();
    console.log('Options:');
    
    Object.keys(bin).forEach((name) => {
        console.log(`  ${name} ${bin[name]}`);
    });
}

