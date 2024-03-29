'use strict';

/* global CodeMirror */
/* global define */

(function(mod) {
    const isFn = (a) => typeof a === 'function';
    
    if (typeof exports === 'object' && typeof module === 'object') // CommonJS
        mod(require('../../lib/codemirror'));
    else if (isFn(define) && define.amd) // AMD
        define(['../../lib/codemirror'], mod);
    else // Plain browser env
        mod(CodeMirror);
})((CodeMirror) => {
    add();
    
    CodeMirror.defineOption('showTrailing', false, (cm, val, prev) => {
        if (prev === CodeMirror.Init)
            prev = false;
        
        if (prev && !val)
            cm.removeOverlay('trailingspace');
        else if (!prev && val)
            cm.addOverlay({
                token(stream) {
                    let ret = null;
                    const match = stream.match(/\s+$/);
                    
                    if (match && match[0] !== stream.string)
                        ret = 'trailing-whitespace';
                    
                    stream.match(/^\s*\S/);
                    
                    return ret;
                },
                name: 'trailingspace',
            });
    });
    
    function add() {
        const style = document.createElement('style');
        
        style.setAttribute('data-name', 'js-showTrailing');
        
        style.textContent = [
            '.cm-trailing-whitespace {',
            'color: #f80;',
            'text-decoration: underline;',
            '}'].join('');
        
        document.head.appendChild(style);
    }
});
