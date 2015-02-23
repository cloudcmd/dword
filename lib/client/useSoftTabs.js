/* global CodeMirror */
/* global define */

(function(mod) {
    if (typeof exports === 'object' && typeof module === 'object') // CommonJS
        mod(require('../../lib/codemirror'));
    else if (typeof define === 'function' && define.amd) // AMD
        define(['../../lib/codemirror'], mod);
    else // Plain browser env
        mod(CodeMirror);
})(function(CodeMirror) {
    'use strict';
    
    CodeMirror.defineOption('useSoftTabs', false, function(cm) {
        cm.addKeyMap({
            'Tab': function (cm) {
                var ret,
                    spacesPerTab    = cm.getOption('tabSize'),
                    spacesToInsert  = spacesPerTab - (cm.doc.getCursor('start').ch % spacesPerTab),
                    spaces          = Array(spacesToInsert + 1).join(' ');
                
                if (cm.doc.somethingSelected())
                    ret = CodeMirror.Pass;
                else 
                    cm.replaceSelection(spaces, 'end', '+input');
                
                return ret;
            }
        });
    });
});
