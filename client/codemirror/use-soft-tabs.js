'use strict';

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
})((CodeMirror) => {
    'use strict';
    
    CodeMirror.defineOption('useSoftTabs', false, (cm) => {
        cm.addKeyMap({
            'Tab' (cm) {
                let line;
                const sel = cm.getSelection('\n');
                const coupleLines = sel.length > 0;
                const isSelected = cm.somethingSelected();
                
                if (isSelected) {
                    line = cm.getLine(cm.getCursor().line);
                    // Indent only if there are multiple lines selected, or if the selection spans a full line
                    
                    if (coupleLines && (~sel.indexOf('\n') || sel.length === line.length)) {
                        cm.indentSelection('add');
                    }
                } else {
                    cm.execCommand('insertSoftTab');
                }
            },
            'Shift-Tab' (cm) {
                cm.indentSelection('subtract');
            },
        });
    });
});
