'use strict';

const readjson = require('readjson');
const tryToCatch = require('try-to-catch');

const Edit = require('../json/edit.json');
const HOME = require('os').homedir();

module.exports = async (req, res, next) => {
    if (req.url !== '/edit.json')
        return next();
    
    const [error, data] = await tryToCatch(readEdit);
    
    if (error)
        return res.status(404)
            .send(error.message);
    
    res.json(data);
};

function replace(from, to) {
    for (const name of Object.keys(from)) {
        to[name] = from[name];
    }
}

function copy(from) {
    return Object
        .keys(from)
        .reduce((value, name) => {
            value[name] = from[name];
            return value;
        }, {});
}

async function readEdit() {
    const homePath = HOME + '/.dword.json';
    const data = copy(Edit);
    
    const [error, edit] = await tryToCatch(readjson, homePath);
    
    if (error && error.code !== 'ENOENT')
        throw Error(`dword --config ${homePath}: ${error.message}`);
    
    if (!edit)
        return data;
    
    replace(edit, data);
    
    return data;
}

