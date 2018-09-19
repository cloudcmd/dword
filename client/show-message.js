'use strict';

const createElement = require('@cloudcmd/create-element');

function createMsg() {
    const innerHTML = '<div class="dword-msg">/div>';
    const wrapper = createElement('div', {
        innerHTML,
    });
    
    const msg = wrapper.firstChild;
    
    return msg;
}

module.exports = showMessage;

function showMessage(text) {
    const HIDE_TIME = 2000;
    
    if (!this._ElementMsg) {
        this._ElementMsg = createMsg();
        this._Element.appendChild(this._ElementMsg);
    }
    
    this._ElementMsg.textContent = text;
    this._ElementMsg.hidden = false;
    
    setTimeout(() => {
        this._ElementMsg.hidden = true;
    }, HIDE_TIME);
    
    return this;
}

