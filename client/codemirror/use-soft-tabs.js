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
    
    CodeMirror.defineOption('useSoftTabs', false, function(cm) {
        cm.addKeyMap({
            'Tab': function (cm) {
                var line,
                    sel     = cm.getSelection('\n'),
                    coupleLines = sel.length > 0,
                    isSelected  = cm.somethingSelected();
                
                if (isSelected) {
                    line    = cm.getLine(cm.getCursor().line);
                    // Indent only if there are multiple lines selected, or if the selection spans a full line
                    
                    if (coupleLines && (~sel.indexOf('\n') || sel.length === line.length)) {
                        cm.indentSelection('add');
                    }
                } else {
                    cm.execCommand('insertSoftTab');
                }
            },
            'Shift-Tab': function (cm) {
                cm.indentSelection('subtract');
            }
        });
    });
});
