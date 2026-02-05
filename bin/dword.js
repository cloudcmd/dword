#!/usr/bin/env node

import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import process from 'node:process';
import http from 'node:http';
import express from 'express';
import {Server} from 'socket.io';
import info from '../package.json' with {
    type: 'json',
};
import {dword} from '../server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const [arg] = process.argv.slice(2);

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
    const reg = /^[~/]/;
    
    if (!reg.test(name))
        name = process.cwd() + '/' + name;
    
    return name;
}

function main(name) {
    const filename = getPath(name);
    const DIR = `${__dirname}/../assets/`;
    
    const app = express();
    const server = http.createServer(app);
    
    const {env} = process;
    
    const port = env.PORT || 1337;
    const ip = env.IP || '0.0.0.0';
    
    app
        .use(express.static(DIR))
        .use(dword({
        online: false,
        diff: true,
        zip: true,
    }));
    
    server.listen(port, ip);
    
    const socket = new Server(server);
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
    console.log(`v${info.version}`);
}

function usage() {
    console.log(`Usage: ${info.name} [filename]`);
}

async function help() {
    const bin = await import('../json/bin');
    
    usage();
    console.log('Options:');
    
    for (const name of Object.keys(bin)) {
        console.log(`  ${name} ${bin[name]}`);
    }
}
