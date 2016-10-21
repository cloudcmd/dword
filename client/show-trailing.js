/* global CodeMirror */
/* global define */

(function(mod) {
    'use strict';
    
    if (typeof exports === 'object' && typeof module === 'object') // CommonJS
        mod(require('../../lib/codemirror'));
    else if (typeof define === 'function' && define.amd) // AMD
        define(['../../lib/codemirror'], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    'use strict';
    
    add();
    
    CodeMirror.defineOption('showTrailing', false, function(cm, val, prev) {
        if (prev === CodeMirror.Init)
            prev = false;
        
        if (prev && !val)
            cm.removeOverlay('trailingspace');
        else if (!prev && val)
            cm.addOverlay({
                token: function(stream) {
                    var ret     = null,
                        match   = stream.match(/\s+$/);
                    
                    if (match && match[0] !== stream.string)
                        ret =  'trailing-whitespace';
                    
                    stream.match(/^\s*\S/);
                    
                    return ret;
                },
                name: 'trailingspace'
            });
    });
    
    function add() {
        var style = document.createElement('style');
        
        style.setAttribute('data-name', 'js-showTrailing');
        
        style.textContent = [
            '.cm-trailing-whitespace {',
            'color: #f80;',
            'text-decoration: underline;',
        '}'].join('');
        
        document.head.appendChild(style);
    }
});
