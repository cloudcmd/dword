'use strict';

const {promisify} = require('es6-promisify');
const restafary = require('restafary/legacy/client');

module.exports = Story;

function Story() {
    if (!(this instanceof Story))
        return new Story();
}

Story.prototype.checkHash = async function(name) {
    const loadHash = await this.loadHash(name);
    const nameHash = name + '-hash';
    const storeHash = localStorage.getItem(nameHash);
    
    return loadHash === storeHash;
};

Story.prototype.loadHash = promisify(function(name, callback) {
    const query = '?hash';
    
    restafary.read(name + query, callback);
    
    return this;
});

Story.prototype.setData = function(name, data) {
    const nameData = name + '-data';
    
    localStorage.setItem(nameData, data);
    
    return this;
};

Story.prototype.setHash = function(name, hash) {
    const nameHash = name + '-hash';
    
    localStorage.setItem(nameHash, hash);
    
    return this;
};

Story.prototype.getData = function(name) {
    const nameData = name + '-data';
    const data = localStorage.getItem(nameData);
    
    return data || '';
};

Story.prototype.getHash = function(name) {
    const item = name + '-hash';
    const data = localStorage.getItem(item);
    
    return data || '';
};

