'use strict';

/* global io */

const {applyPatch} = require('daffy');
const {alert} = require('smalltalk');

const getHost = () => {
    const l = location;
    const href = l.origin || l.protocol + '//' + l.host;
    
    return href;
};

module.exports = function() {
    const dword = this;
    const href = getHost();
    const FIVE_SECONDS = 5000;
    const patch = (name, data) => {
        socket.emit('patch', name, data);
    };
    
    const {_prefixSocket} = this;
    const socket = io.connect(href + _prefixSocket, {
        'max reconnection attempts' : 2 ** 32,
        'reconnection limit'        : FIVE_SECONDS,
        path                        : this._socketPath + '/socket.io',
    });
    
    this._socket = socket;
    
    socket.on('reject', () => {
        this.emit('reject');
    });
    
    socket.on('connect', () => {
        dword._patch = patch;
    });
    
    socket.on('message', (msg) => {
        this._onSave(null, msg);
    });
    
    socket.on('file', (name, data) => {
        dword.setModeForPath(name)
            .setValueFirst(name, data)
            .moveCursorTo(0, 0);
    });
    
    socket.on('patch', (name, data, hash) => {
        if (name !== this._FileName)
            return;
        
        if (hash !== this._story.getHash(name))
            return;
        
        const cursor = dword.getCursor();
        const value = dword.getValue();
        const result = applyPatch(value, data);
        
        this.setValue(result);
        
        this._story
            .setData(name, value)
            .setHash(name, this.sha());
        
        dword.moveCursorTo(cursor.row, cursor.column);
    });
    
    socket.on('disconnect', () => {
        dword.save.patch = self._patchHttp;
    });
    
    socket.on('err', (error) => {
        alert(this._TITLE, error);
    });
};

