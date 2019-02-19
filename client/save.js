'use strict';

const wraptile = require('wraptile/legacy');
const {promisify} = require('es6-promisify');
const zipio = promisify(require('zipio'));

const setValue = wraptile(_setValue);

module.exports = function() {
    save.call(this)
        .then(setValue(this))
        .catch(this._onSave.bind(this));
    
    return this;
};

async function save() {
    const value = this.getValue();
    const {length} = value;
    const {
        _FileName: _filename,
        _maxSize,
    } = this;
    
    const {diff, zip} = await this._loadOptions();
    
    if (diff) {
        const patch = await this._doDiff(_filename);
        const isPatch = checkPatch(length, _maxSize, patch);
        
        if (isPatch)
            return this._patch(_filename, patch);
    }
    
    if (!zip)
        return this._write(_filename, value);
    
    const zipedValue = await zipio(value);
    return this._write(`${_filename}?unzip`, zipedValue);
}

function _setValue(ctx) {
    ctx._Value = ctx.getValue();
}

function checkPatch(length, maxSize, patch) {
    const patchLength = patch && patch.length || 0;
    const isLessMaxLength = length < maxSize;
    const isLessLength = isLessMaxLength && patchLength < length;
    const isStr = typeof patch === 'string';
    
    return patch && isStr && isLessLength;
}
