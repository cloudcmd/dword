'use strict';

const readjson = require('readjson');

const Edit = require('../json/edit.json');
const HOME = require('os').homedir();

module.exports = (req, res, next) => {
    if (req.url !== '/edit.json')
        return next();
    
    readEdit((error, data) => {
        if (error)
            res.status(404)
                .send(error.message);
        else
            res .type('json')
                .send(data);
    });
}

function replace(from, to) {
    Object.keys(from).forEach(function(name) {
        to[name] = from[name];
    });
}

function copy(from) {
    return Object
        .keys(from)
        .reduce(function(value, name) {
            value[name] = from[name];
            return value;
        }, {});
}

function readEdit(callback) {
    const homePath = HOME + '/.dword.json';
    
    readjson(homePath, (error, edit) => {
        const data = copy(Edit);
        
        if (!error)
            replace(edit, data);
        else if (error.code !== 'ENOENT')
            error = Error(`dword --config ${homePath}: ${error.message}`);
        else
            error = null;
        
        callback(error, data);
    });
}

