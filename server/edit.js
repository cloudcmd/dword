'use strict';

const readjson = require('readjson');

const Edit = require('../json/edit.json');
const HOME = require('os').homedir();

module.exports = (req, res, next) => {
    if (req.url !== '/edit.json')
        return next();
    
    readEdit((error, data) => {
        if (error)
            return res.status(404)
                .send(error.message);
        
        res.type('json')
            .send(data);
    });
};

function replace(from, to) {
    Object.keys(from).forEach((name) => {
        to[name] = from[name];
    });
}

function copy(from) {
    return Object
        .keys(from)
        .reduce((value, name) => {
            value[name] = from[name];
            return value;
        }, {});
}

function readEdit(callback) {
    const homePath = HOME + '/.dword.json';
    
    readjson(homePath, (error, edit) => {
        const data = copy(Edit);
        
        if (error && error.code !== 'ENOENT')
            return callback(Error(`dword --config ${homePath}: ${error.message}`));
        
        if (!edit)
            return callback(null, data);
        
        replace(edit, data);
        callback(null, data);
    });
}

