/* global CodeMirror, exec, load, io, join, daffy, restafary, Emitify, loadRemote */
/* global smalltalk */

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports  = new Dword();
    else
        global.dword    = new Dword();
    
    function Dword() {
        var Ace,
            Value,
            Config,
            Options,
            PREFIX,
            Element,
            FileName,
            ElementMsg,
            JSHintConfig,
            Ext,
            DIR             = '/modules/',
            story           = new Story(),
            Emitter,
            Separator       = '\n',
            MAX_FILE_SIZE   = 512000,
            
            TITLE           = 'DWORD',
            
            empty           = function() {},
            
            dword      = function(el, options, callback) {
                if (!callback)
                    callback = options;
                
                if (typeof el === 'string')
                    el = document.querySelector(el);
                
                MAX_FILE_SIZE   = options.maxSize || 512000;
                PREFIX          = options.prefix || '/dword';
                
                Element = el || document.body;
                
                Element.addEventListener('drop', onDrop);
                Element.addEventListener('dragover', onDragOver);
                
                loadScript(PREFIX + '/modules/execon/lib/exec.js', function() {
                    init(function() {
                        callback(el);
                    });
                });
                
                return dword;
            };
        
        function init(fn) {
            exec.series([
                loadFiles,
                function(callback) {
                    load.json(PREFIX + '/edit.json', function(error, config) {
                        if (error) {
                            smalltalk.alert(TITLE, 'Could not load edit.json!', {
                                cancel: false
                            });
                        } else {
                            Config  = config;
                            callback();
                        }
                    });
                },
                
                function(callback) {
                    var names,
                        name        = 'smalltalk',
                        is          = window.Promise,
                        js          = '.min.js',
                        jsName      = is ? js : '.poly' + js,
                        dir         = '/modules/' + name + '/dist/',
                        isFlex      = function() {
                            return document.body.style.flex !== 'undefined';
                        };
                    
                    if (!isFlex())
                        jsName = '.native' + jsName;
                    
                    names = [jsName, '.min.css'].map(function(ext) {
                        return PREFIX + dir + name + ext;
                    });
                    
                    load.parallel(names, callback);
                },
                
                function(callback) {
                    loadRemote('socket', {
                        name : 'io',
                        prefix: PREFIX,
                        noPrefix: true
                    }, initSocket);
                    
                    callback();
                },
                
                loadFilesAll,
                loadStyles,
                
                function() {
                    var options = Config.options,
                        all     = {
                            autofocus           : true,
                            lineNumbers         : true,
                            showTrailing        : true,
                            autoCloseBrackets   : true,
                            matchBrackets       : true,
                            matchTags           : true,
                            gutters             : ['CodeMirror-lint-markers'],
                            maxInvisibles       : 32,
                            searchbox           : true,
                            continueComments    : true,
                            
                            highlightSelectionMatches: true
                        };
                    
                    Emitter     = Emitify();
                    
                    Object.keys(options).forEach(function(name) {
                        if (name === 'tabSize')
                            all.indentUnit = options.tabSize;
                        else if (name === 'wrap')
                            all.lineWrapping = options.wrap;
                        else
                            all[name] = options[name];
                    });
                    
                    Ace   = CodeMirror(Element, all);
                    
                    Ace.on('change', function() {
                        Emitter.emit('change');
                    });
                    
                    addCommands();
                    
                    fn();
                    
                    dword.setOptions(options);
                },
            ]);
        }
        
        function addCommands() {
            var commands = {
                'Ctrl-G': function () {
                    dword.goToLine();
                },
                'Ctrl-S': function() {
                    dword.save();
                },
                'F2': function() {
                    dword.save();
                },
                'Ctrl-B' : function() {
                    dword.beautify();
                },
                'Ctrl-M' : function() {
                    dword.minify();
                },
                'Ctrl-E' : function() {
                    evaluate();
                },
                'Ctrl-/' : 'toggleComment'
            };
            
            Object.keys(commands).forEach(function(name) {
                var nameCmd = '';
                
                if (/^Ctrl/.test(name)) {
                    nameCmd = name.replace('Ctrl', 'Cmd');
                    commands[nameCmd] = commands[name];
                }
            });
            
            dword.addKeyMap(commands);
        }
        
        function evaluate() {
            var value,
                msg,
                isJS    = /\.js$/.test(FileName);
            
            if (!isJS) {
                msg = 'Evaluation supported for JavaScript only';
            } else {
                value = dword.getValue();
                msg = exec.try(Function(value));
            }
            
            msg && smalltalk.alert(TITLE, msg)
                .then(dword.focus)
                .catch(dword.focus);
        }
        
        function createMsg() {
            var msg,
                wrapper = document.createElement('div'),
                html    = '<div class="dword-msg">/div>';
            
            wrapper.innerHTML = html;
            msg = wrapper.firstChild;
            
            return msg;
        }
        
        dword.addKeyMap = function(keyMap) {
            Ace.addKeyMap(keyMap);
        };
        
        dword.goToLine         = function() {
            var myHeight, coords,
                msg     = 'Enter line number:',
                cursor  = dword.getCursor(),
                number  = cursor.row + 1;
            
            smalltalk.prompt(TITLE, msg, number).then(function(line) {
                cursor      = Ace.setCursor({
                    line : line - 1,
                    ch   : 0
                }),
                myHeight    = Ace.getScrollInfo().clientHeight,
                coords      = Ace.charCoords({line: line, ch: 0}, 'local');
                
                Ace.scrollTo(null, (coords.top + coords.bottom - myHeight) / 2);
            }).catch(empty).then(function() {
                dword.focus();
            });
            
            return dword;
        };
        
        dword.moveCursorTo     = function(row, column) {
            Ace.setCursor(row, column);
            return dword;
        };
        
        dword.focus            = function() {
            Ace.focus();
            return dword;
        };
        
        dword.remove           = function(direction) {
            var cmd;
            
            if (direction === 'right')
                cmd = 'delCharAfter';
            else
                cmd = 'delCharBefore';
                
            Ace.execCommand(cmd);
            
            return dword;
        };
        
        dword.getCursor        = function() {
            var plain   = Ace.getCursor(),
                cursor  = {
                    row     : plain.line,
                    column  : plain.ch
                };
            
            return cursor;
        };
        
        dword.getValue         = function() {
            return Ace.getValue();
        };
        
        dword.on               = function(event, fn) {
            Emitter.on(event, fn);
            return dword;
        };
        
        dword.once             = function(event, fn) {
            Emitter.once(event, fn);
            return dword;
        };
        
        dword.isChanged        = function() {
            var value   = Ace.getValue(Separator),
                isEqual = value === Value;
            
            return !isEqual;
        };
        
        dword.setValue         = function(value) {
            Ace.setValue(value);
            return dword;
        };
        
        dword.setValueFirst    = function(name, value) {
            Ace.setValue(value);
            
            /*
             * getCursor returns another
             * information so set
             * cursor manually
             */
            Ace.setCursor(1, 0);
            Ace.clearHistory();
            
            FileName    = name;
            Value       = value;
            
            setTimeout(function() {
                Separator       = getLineSeparator(value);
            }, 0);
            
            return dword;
        };
        
        /*
         * CodeMirror set default line separator to "\n"
         * what is great for Linux, but Windows use "\r\n"
         * and when trying to check that fact that file was changed
         * it's harder to do when you expect
         * to read saved file without change and
         * receive some changes insteed.
         */
        function getLineSeparator(value) {
            var ret;
            
            if (typeof value !== 'string')
                throw Error('value should be string!');
            
            if (~value.indexOf('\r\n'))
                ret = '\r\n';
            else
                ret = '\n';
            
            return ret;
        }
        
        function setFontSize(value) {
            Ace.display.wrapper.style.fontSize = value + 'px';
        }
        
        dword.setOption        = function(name, value) {
            switch(name) {
            default:
                Ace.setOption(name, value);
                break;
            case 'fontSize':
                setFontSize(value);
                break;
            }
              
            return dword;
        };
        
        dword.setOptions       = function(options) {
            Object.keys(options).forEach(function(name) {
                var value = options[name];
                
                dword.setOption(name, value);
            });
            
            return dword;
        };
        
        dword.setMode = function(mode, callback) {
            var is,
                isJSON = mode === 'json',
                
                fn  = function(mode) {
                    Ace.setOption('mode', mode);
                    
                    exec(callback);
                };
            
            if (isJSON)
                mode = 'javascript';
            else if (!mode)
                mode = null;
            
            is = CodeMirror.modes[mode];
            
            if (is || !mode) {
                fn(mode);
            } else {
                CodeMirror.requireMode(mode, function() {
                    fn(mode);
                });
            }
            
            return dword;
        };
        
        dword.setModeForPath   = function(path) {
            var modesByName = CodeMirror.findModeByFileName,
                name        = path.split('/').pop();
                
            addExt(name, function(name) {
                var htmlMode, jsMode, isHTML,
                    info    = modesByName(name) || {},
                    mode    = info.mode;
                
                htmlMode    = modesByName('.html').mode;
                jsMode      = modesByName('.js').mode;
                
                isHTML      = mode === htmlMode;
                
                if (isHTML)
                    setEmmet();
                
                dword.setMode(mode, function() {
                    var reg     = /^(json|javascript)$/,
                        isLint  = reg.test(mode),
                        isJS    = /.js$/.test(name);
                    
                    if (!isLint)
                        dword.setOption('lint', false);
                    else if (!isJS) {
                        dword.setOption('lint', true);
                    } else {
                        setJsHintConfig(function(jshint) {
                            dword.setOption('lint', jshint);
                        });
                    }
                });
            });
            
            return dword;
        };
        
        dword.selectAll    = function() {
            Ace.execCommand('selectAll');
            return dword;
        };
        
        dword.showMessage = function(text) {
            var HIDE_TIME   = 2000;
            
            if (!ElementMsg) {
                ElementMsg = createMsg();
                Element.appendChild(ElementMsg);
            }
            
            ElementMsg.textContent = text;
            ElementMsg.hidden = false;
            
            setTimeout(function() {
                ElementMsg.hidden = true;
            }, HIDE_TIME);
            
            return dword;
        };
        
        dword.sha          = function(callback) {
            var url = PREFIX + DIR + 'jsSHA/src/sha.js';
            
            load.js(url, function() {
                var shaObj, hash, error,
                    value   = dword.getValue();
                
                error = exec.try(function() {
                    shaObj  = new window.jsSHA('SHA-1', 'TEXT');
                    shaObj.update(value);
                    hash    = shaObj.getHash('HEX');
                });
                
                callback(error, hash);
            });
            
            return dword;
        };
        
        dword.beautify = function() {
           readWithFlag('beautify');
           return dword;
        };
        
        dword.minify = function() {
            readWithFlag('minify');
            return dword;
        };
        
        dword.save = function() {
            var value   = dword.getValue();
            
            loadOptions(function(error, config) {
                var isDiff      = config.diff,
                    isZip       = config.zip;
                
                exec.if(!isDiff, function(patch) {
                    var query           = '',
                        patchLength     = patch && patch.length || 0,
                        length          = Value.length,
                        isLessMaxLength = length < MAX_FILE_SIZE,
                        isLessLength    = isLessMaxLength && patchLength < length,
                        isStr           = typeof patch === 'string',
                        isPatch         = patch && isStr && isLessLength;
                    
                    Value               = value;
                    
                    exec.if(!isZip || isPatch, function(equal, data) {
                        var result  = data || Value;
                        
                        if (isPatch)
                            dword.save.patch(FileName, patch);
                        else
                            dword.save.write(FileName + query, result);
                    }, function(func) {
                        zip(value, function(error, data) {
                            if (error)
                                console.error(error);
                            
                            query = '?unzip';
                            func(null, data);
                        });
                    });
                    
                }, exec.with(doDiff, FileName));
            });
            
            return dword;
        };
        
        dword.save.patch = patchHttp;
        dword.save.write = writeHttp;
        
        function loadOptions(callback) {
            var url = PREFIX + '/options.json';
            
            if (Options)
                callback(null, Options);
            else
                load.json(url, function(error, data) {
                    Options = data;
                    callback(error, data);
                });
        }
        
        function patchHttp(path, patch) {
            restafary.patch(path, patch, onSave);
        }
        
        function writeHttp(path, result) {
            restafary.write(path, result, onSave);
        }
        
        function onSave(error, text) {
            var msg     = 'Try again?';
                
            if (error) {
                if (error.message)
                    msg = error.message + '\n' + msg;
                else
                    msg = 'Can\'t save.' + msg;
                
                smalltalk.confirm(TITLE, msg).then(function() {
                    restafary.write(FileName, Value, onSave);
                }).catch(empty).then(function(){
                    dword.focus();
                });
            } else {
                dword.showMessage(text);
                
                dword.sha(function(error, hash) {
                    if (error)
                        console.error(error);
                    
                    story.setData(FileName, Value)
                         .setHash(FileName, hash);
                });
                
                Emitter.emit('save', Value.length);
            }
        }
        
        function doDiff(path, callback) {
            var value = dword.getValue();
            
            diff(value, function(patch) {
                story.checkHash(path, function(error, equal) {
                    if (!equal)
                        patch = '';
                    
                    callback(patch);
                });
            });
        }
        
        function diff(newValue, callback) {
            loadDiff(function(error) {
                var patch;
                
                if (error) {
                    smalltalk.alert(TITLE, error, {
                        cancel: false
                    });
                } else {
                    Value   = story.getData(FileName);
                    patch   = daffy.createPatch(Value, newValue);
                    callback(patch);
                }
            });
        }
        
        function loadDiff(callback) {
             var url = PREFIX + join([
                    'google-diff-match-patch/diff_match_patch.js',
                    'daffy/lib/daffy.js'
                ].map(function(name) {
                    return DIR + name;
                }));
            
            load.js(url, callback);
        }
        
        function zip(value, callback) {
            exec.parallel([
                function(callback) {
                    var url = PREFIX + DIR + 'zipio/lib/zipio.js';
                    load.js(url, callback);
                },
                function(callback) {
                    loadRemote('pako', {prefix: PREFIX}, callback);
                }
            ], function(error) {
                if (!error)
                    global.zipio(value, callback);
                else
                    smalltalk.alert(TITLE, error, {
                        cancel: false
                    });
            });
        }
        
        function setEmmet() {
            var dir         = DIR + 'codemirror-emmet/dist/',
                extensions  = Config.extensions,
                isEmmet     = extensions.emmet;
            
            if (isEmmet)
                load.js(PREFIX + join([
                    dir + 'emmet.min.js'
                ]));
        }
        
        function setJsHintConfig(callback) {
            var JSHINT_PATH = PREFIX + '/jshint.json';
            
            if (JSHintConfig)
                callback(JSHintConfig);
            else
                load.json(JSHINT_PATH, function(error, json) {
                    if (!error)
                        JSHintConfig = json;
                    else
                        smalltalk.alert(TITLE, error, {
                            cancel: false
                        });
                    
                    callback(JSHintConfig);
                });
        }
        
        function addExt(name, fn) {
            if (!Ext)
                load.json(PREFIX + '/json/ext.json', function(error, data) {
                    Ext = data;
                    add(error, Ext);
                });
            else
                add(null, Ext);
            
            function add(error, exts) {
                if (error)
                    console.error(Error('Could not load ext.json!'));
                else
                    Object.keys(exts).some(function(ext) {
                        var arr = exts[ext],
                            is  = ~arr.indexOf(name);
                        
                        if (is)
                            name += '.' + ext;
                        
                        return is;
                    });
                
                fn(name);
            }
        }
        
        function getHost() {
            var l       = location,
                href    = l.origin || l.protocol + '//' + l.host;
            
            return href;
        }
        
        function initSocket(error) {
            var socket,
                href            = getHost(),
                FIVE_SECONDS    = 5000,
                patch    = function(name, data) {
                    socket.emit('patch', name, data);
                };
                
            if (error)
                return smalltalk.alert(TITLE, error);
            
            socket  = io.connect(href + PREFIX, {
                'max reconnection attempts' : Math.pow(2, 32),
                'reconnection limit'        : FIVE_SECONDS
            });
            
            socket.on('connect', function() {
                dword.save.patch = patch;
            });
            
            socket.on('message', function(msg) {
                onSave(null, msg);
            });
            
            socket.on('file', function(name, data) {
                dword.setModeForPath(name)
                    .setValueFirst(name, data)
                    .moveCursorTo(0, 0);
            });
            
            socket.on('patch', function(name, data, hash) {
                if (name !== FileName)
                    return;
                
                loadDiff(function(error) {
                    var cursor, value;
                    
                    if (error)
                        return console.error(error);
                    
                    if (hash !== story.getHash(name))
                        return;
                        
                    cursor  = dword.getCursor(),
                    value   = dword.getValue();
                    value   = daffy.applyPatch(value, data);
                    
                    dword.setValue(value);
                    
                    dword.sha(function(error, hash) {
                        story.setData(name, value)
                             .setHash(name, hash);
                        
                        dword.moveCursorTo(cursor.row, cursor.column);
                    });
                });
            });
            
            socket.on('disconnect', function() {
                dword.save.patch = patchHttp;
            });
            
            socket.on('err', function(error) {
                smalltalk.alert(TITLE, error, {
                    cancel: false
                });
            });
        }
        
        function readWithFlag(flag) {
            var path = FileName;
            
            restafary.read(path + '?' + flag, function(error, data) {
                if (error)
                    smalltalk.alert(TITLE, error, {
                        cancel: false
                    });
                else
                    dword
                        .setValue(data)
                        .moveCursorTo(0, 0);
            });
        }
        
        /**
         * In Mac OS Chrome dropEffect = 'none'
         * so drop do not firing up when try
         * to upload file from download bar
         */
        function onDragOver(event) {
            var dataTransfer    = event.dataTransfer,
                effectAllowed   = dataTransfer.effectAllowed;
            
            if (/move|linkMove/.test(effectAllowed))
                dataTransfer.dropEffect = 'move';
            else
                dataTransfer.dropEffect = 'copy';
            
            event.preventDefault();
        }
        
        function onDrop(event) {
            var reader, files,
                onLoad   =  function(event) {
                    var data    = event.target.result;
                    
                    dword.setValue(data);
                };
            
            event.preventDefault();
            
            files   = event.dataTransfer.files;
            
            [].forEach.call(files, function(file) {
                reader  = new FileReader();
                reader.addEventListener('load', onLoad);
                reader.readAsBinaryString(file);
            });
        }
        
         function getModulePath(name, lib) {
            var path    = '',
                libdir  = '/',
                dir     = '/modules/';
                
            if (lib)
                libdir  = '/' + lib + '/';
            
            path    = dir + name + libdir + name + '.js';
            
            return path;
        }
        
        function loadStyles(callback) {
            var urlCSS  = '',
                dir     = DIR + 'codemirror/',
                addon   = dir + 'addon/',
                lint    = addon + 'lint/',
                theme   = Config.options.theme,
                urls    =[
                    addon   + 'dialog/dialog',
                    addon   + 'search/matchesonscrollbar',
                    lint    + 'lint',
                    '/css/dword',
                ];
            
            if (theme && theme !== 'default')
                urls.unshift(dir + 'theme/' + theme);
            
            urlCSS = PREFIX + join(urls
                .map(function(name) {
                    return name + '.css';
                }));
            
            load(urlCSS, callback);
        }
        
        function loadFiles(callback) {
            var obj     = {
                    loadRemote  : getModulePath('loadremote', 'lib'),
                    load        : getModulePath('load'),
                    Emitify     : getModulePath('emitify', 'lib'),
                    join        : '/join/join.js'
                },
                
                scripts = Object.keys(obj)
                    .filter(function(name) {
                        return !window[name];
                    })
                    .map(function(name) {
                        return PREFIX + obj[name];
                    });
            
            exec.if(!scripts.length, callback, function() {
                loadScript(scripts, callback);
            });
        }
         
        function loadFilesAll(callback) {
            exec.series([
                function(callback) {
                    var options = {
                        prefix: PREFIX
                    };
                    
                    loadRemote('codemirror', options, callback);
                },
                
                function(callback) {
                    CodeMirror.modeURL = PREFIX + DIR + 'codemirror/mode/%N/%N.js';
                    callback();
                },
                 
                function(callback) {
                    var js      = PREFIX + '/restafary.js',
                        
                        dir     = DIR + 'codemirror/',
                        lib     = 'lib/client/',
                        addon   = dir + 'addon/',
                        lint    = addon + 'lint/',
                        
                        urlJS   = PREFIX + join([
                            dir     + 'mode/meta',
                            
                            lint    + 'lint',
                            lint    + 'javascript-lint',
                            lint    + 'json-lint',
                            
                            lib     + 'show-trailing',
                            lib     + 'use-soft-tabs',
                            
                            DIR     + 'jshint/dist/jshint',
                            DIR     + 'cm-searchbox/lib/searchbox',
                            DIR     + 'cm-show-invisibles/lib/show-invisibles',
                            getKeyMapPath(dir, Config)
                        ].filter(function(name) {
                            return name;
                        }).concat([
                            'comment/comment',
                            'comment/continuecomment',
                            
                            'mode/loadmode',
                            'mode/overlay',
                            
                            'search/searchcursor',
                            'search/match-highlighter',
                            'search/matchesonscrollbar',
                            
                            'dialog/dialog',
                            'scroll/annotatescrollbar',
                            'fold/xml-fold',
                            
                            'edit/closebrackets',
                            'edit/matchbrackets',
                            'edit/matchtags'
                        ].map(function(name) {
                            return addon + name;
                        })
                        ).map(function(name) {
                            return name + '.js';
                        }));
                     
                    load.parallel([urlJS, js], callback);
                },
                
                function() {
                    restafary.prefix(PREFIX + '/api/v1/fs');
                    callback();
                }
            ]);
        }
         
        function getKeyMapPath(dir, config) {
            var path    = '',
                keyMap  = config && config.options && config.options.keyMap;
            
            if (keyMap && keyMap !== 'default')
                path = dir + 'keymap/' + keyMap;
            
            return path;
        }
        
        function loadScript(srcs, callback) {
            var i,
                func    = function() {
                    --i;
                    
                    if (!i)
                        callback();
                };
            
            if (typeof srcs === 'string')
                srcs = [srcs];
            
            i = srcs.length;
            
            srcs.forEach(function(src) {
                var element = document.createElement('script');
            
                element.src = src;
                element.addEventListener('load', function load() {
                    func();
                    element.removeEventListener('load', load);
                });
            
                document.body.appendChild(element);
            });
        }
        
        function Story() {
            var story = this;
            
            this.checkHash              = function(name, callback) {
                story.loadHash(name, function(error, loadHash) {
                    var nameHash    = name + '-hash',
                        storeHash   = localStorage.getItem(nameHash),
                        equal       = loadHash === storeHash;
                    
                    callback(error, equal);
                });
                
                return story;
            };
            
            this.loadHash               = function(name, callback) {
                var query       = '?hash';
                
                restafary.read(name + query, callback);
                
                return story;
            };
            
            this.setData                = function(name, data) {
                var nameData    = name + '-data';
                
                localStorage.setItem(nameData, data);
                
                return story;
            };
            
            this.setHash                = function(name, hash) {
                var nameHash    = name + '-hash';
                
                localStorage.setItem(nameHash, hash);
                
                return story;
            };
            
            this.getData                = function(name) {
                var nameData    = name + '-data',
                    data        = localStorage.getItem(nameData);
                
                return data || '';
            };
            
            this.getHash                = function(name) {
                var item    = name + '-hash',
                    data    = localStorage.getItem(item);
                
                return data || '';
            };
        }
        
        return dword;
    }
    
})(this);
