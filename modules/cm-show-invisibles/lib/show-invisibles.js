/* global CodeMirror */
/* global define */

(function(mod) {
    'use strict';
    
    if (typeof exports === 'object' && typeof module === 'object') // CommonJS
        mod(require('../../lib/codemirror'));
    else if (typeof define === 'function' && define.amd) // AMD
        define(['../../lib/codemirror'], mod);
    else
        mod(CodeMirror);
})(function(CodeMirror) {
    'use strict';
    
    CodeMirror.defineOption('showInvisibles', false, function(cm, val, prev) {
        var Count   = 0,
            Maximum = cm.getOption('maxInvisibles') || 16;
        
        if (prev === CodeMirror.Init)
            prev = false;
        
        if (prev && !val) {
            cm.removeOverlay('invisibles');
            rm();
        } else if (!prev && val) {
            add(Maximum);
            
            cm.addOverlay({
                name: 'invisibles',
                token:  function nextToken(stream) {
                    var ret,
                        spaces  = 0,
                        peek    = stream.peek() === ' ';
                    
                    if (peek) {
                        while (peek && spaces < Maximum) {
                            ++spaces;
                            
                            stream.next();
                            peek = stream.peek() === ' ';
                        }
                        
                        ret = 'whitespace whitespace-' + spaces;
                        
                        /*
                         * styles should be different
                         * could not be two same styles
                         * beside because of this check in runmode
                         * function in `codemirror.js`:
                         *
                         * 6624: if (!flattenSpans || curStyle != style) {}
                         */
                        if (spaces === Maximum)
                            ret += ' whitespace-rand-' + Count++;
                        
                    } else {
                        while (!stream.eol() && !peek) {
                            stream.next();
                            
                            peek = stream.peek() === ' ';
                        }
                        
                        ret = 'cm-eol';
                    }
                    
                    return ret;
                }
            });
        }
    });
    
    function add(max) {
        var i, rule,
            classBase   = '.CodeMirror .cm-whitespace-',
            spaceChars  = '',
            rules       = '',
            spaceChar   = '·',
            style       = document.createElement('style');
        
        style.setAttribute('data-name', 'js-show-invisibles');
        
        for (i = 1; i <= max; ++i) {
            spaceChars += spaceChar;
            
            rule    = classBase + i + '::before { content: "' + spaceChars + '";}\n';
            rules   += rule;
        }
        
        style.textContent = getStyle() + '\n' + getEOL() + '\n' + rules;
        
        document.head.appendChild(style);
    }
    
    function rm() {
        var style = document.querySelector('[data-name="js-show-invisibles"]');
        
        document.head.removeChild(style);
    }
    
    function getStyle() {
        var style = [
            '.cm-whitespace::before {',
                'position: absolute;',
                'pointer-events: none;',
                'color: #404F7D;',
            '}'
        ].join('');
        
        return style;
    }
    
    function getEOL() {
         var style = [
            '.CodeMirror-code > div > pre > span::after {',
                'pointer-events: none;',
                'color: #404F7D;',
                'content: "¬"',
            '}',
             
        ].join('');
        
        return style;
    }
});
