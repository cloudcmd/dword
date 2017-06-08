'use strict';

/* global restafary */

module.exports = Story;

function Story() {
    if (!(this instanceof Story))
        return new Story();
}

Story.prototype.checkHash = function(name, callback) {
    this.loadHash(name, (error, loadHash) => {
        const nameHash = name + '-hash';
        const storeHash = localStorage.getItem(nameHash);
        const equal = loadHash === storeHash;
        
        callback(error, equal);
    });
    
    return this;
};

Story.prototype.loadHash = function(name, callback) {
    const query = '?hash';
    
    restafary.read(name + query, callback);
    
    return this;
};

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

