'use strict';

const {confirm} = require('smalltalk');
const {write} = require('restafary/legacy/client');

function empty() {}

module.exports = function onSave(error, text) {
    const Value = this._Value;
    const FileName = this._FileName;
    let msg = 'Try again?';
    
    if (error) {
        if (error.message)
            msg = error.message + '\n' + msg;
        else
            msg = 'Can\'t save.' + msg;
        
        const onSave = this._onSave.bind(this);
        
        return confirm(this._TITLE, msg).then(() => {
            write(this._FileName, this._Value, onSave);
        }).catch(empty).then(() => {
            this.focus();
        });
    }
    
    this.showMessage(text);
    
    const hash = this.sha();
    this._story.setData(FileName, Value)
        .setHash(FileName, hash);
    
    this._Emitter.emit('save', Value.length);
};
