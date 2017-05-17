/* global CodeMirror, exec, load, io, join, daffy, restafary, Emitify, loadRemote */
/* global smalltalk */

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports  = init;
    else
        global.dword    = init;
    
    function init(el, options, callback) {
        Dword(el, options, callback);
    }
    
    function Dword(el, options, callback) {
        var onDrop, onDragOver;
        var self = this;
        
        if (!(this instanceof Dword))
            return new Dword(el, options, callback);
        
        this._Ace;
        this._Value;
        this._Config;
        this._Options;
        this._FileName;
        this._ElementMsg;
        this._JSHintConfig;
        this._Ext;
        this._DIR = '/modules/';
        this._TITLE = 'Dword';
        this._story = Story();
        this._Emitter;
        this._Separator = '\n';
        this._isKey = true;
        
        if (!callback)
            callback = options;
        
        if (typeof el === 'string')
            el = document.querySelector(el);
        
        this._MAX_FILE_SIZE   = options.maxSize || 512000;
        this._PREFIX          = options.prefix || '/dword';
        this._SOCKET_PATH     = options.socketPath || '';
        
        this._Element = el || document.body;
        
        onDrop = this._onDrop.bind(this);
        onDragOver = this._onDragOver.bind(this);
        
        this._Element.addEventListener('drop', onDrop);
        this._Element.addEventListener('dragover', onDragOver);
        
        loadScript(this._PREFIX + '/modules/execon/lib/exec.js', function() {
            self._init(function() {
                callback(self);
            });
        });
        
        this._patch = function(path, patch) {
            this._patchHttp(path, patch);
        };
    
        this._write = function(path, result) {
            this._writeHttp(path, result);
        };
    }
    
    Dword.prototype.isKey = function() {
        return this._isKey;
    };
    
    Dword.prototype.enableKey = function() {
        this._isKey = true;
        return this;
    };
    
    Dword.prototype.disableKey = function() {
        this._isKey = false;
        return this;
    };
    
    Dword.prototype._showMessageOnce = function(msg) {
        if (!this._showedOnce) {
            this.showMessage(msg);
            this._showedOnce = true;
        }
    };
    
    function empty() {}
    
    Dword.prototype._init = function(fn) {
        var self = this;
        var loadFiles = self._loadFiles.bind(self);
        var loadFilesAll = self._loadFilesAll.bind(self);
        var loadStyles = self._loadStyles.bind(self);
        
        exec.series([
            loadFiles,
            function(callback) {
                load.json(self._PREFIX + '/edit.json', function(error, config) {
                    if (error)
                        return smalltalk.alert(self._TITLE, 'Could not load edit.json!');
                    
                    self._Config  = config;
                    callback();
                });
            },
            
            function(callback) {
                var name = 'smalltalk';
                var is = window.Promise;
                var js = '.min.js';
                var jsName = is ? js : '.poly' + js;
                var dir = '/modules/' + name + '/dist/';
                var isFlex = function() {
                    return document.body.style.flex !== 'undefined';
                };
                
                if (!isFlex())
                    jsName = '.native' + jsName;
                
                var names = [jsName, '.min.css'].map(function(ext) {
                    return self._PREFIX + dir + name + ext;
                });
                
                load.parallel(names, callback);
            },
            
            loadFilesAll,
            loadStyles,
            
            function() {
                var options = self._Config.options;
                var Value = self._Value;
                var all = {
                    autofocus           : true,
                    autoRefresh         : true,
                    lineNumbers         : true,
                    showTrailing        : true,
                    autoCloseBrackets   : true,
                    matchBrackets       : true,
                    matchTags           : false,
                    gutters             : ['CodeMirror-lint-markers'],
                    maxInvisibles       : 32,
                    searchbox           : true,
                    continueComments    : true,
                    
                    highlightSelectionMatches: true
                };
                
                self._Emitter = Emitify();
                 
                self._Emitter.on('auth', function(username, password) {
                    self._socket.emit('auth', username, password);
                });
                
                Object.keys(options).forEach(function(name) {
                    if (name === 'tabSize')
                        all.indentUnit = options.tabSize;
                    else if (name === 'wrap')
                        all.lineWrapping = options.wrap;
                    else
                        all[name] = options[name];
                });
                
                self._Ace = CodeMirror(self._Element, all);
                
                if (Value)
                    self._initValue(self._FileName, Value);
                
                self._Ace.on('change', function() {
                    self._Emitter.emit('change');
                });
                
                addCommands(self);
                
                fn();
                
                self.setOptions(options);
            },
        ]);
    };
    
    function addCommands(dword) {
        var self = this;
        var run = function(fn) {
            return function() {
                dword.isKey() && fn();
            }
        };
        
        var commands = {
            'Ctrl-G': function () {
                dword.goToLine();
            },
            'Ctrl-S': run(function() {
                dword.save();
            }),
            'F2': run(function() {
                dword.save();
            }),
            'Ctrl-B' : run(function() {
                dword.beautify();
            }),
            'Ctrl-M' : run(function() {
                dword.minify();
            }),
            'Ctrl-E' : run(function() {
                dword.evaluate();
            }),
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
    
    Dword.prototype.evaluate = function() {
        var dword = this;
        var focus = dword.focus.bind(this);
        var FileName = this._FileName;
        var value;
        var msg;
        var isJS = /\.js$/.test(FileName);
        
        if (!isJS) {
            msg = 'Evaluation supported for JavaScript only';
        } else {
            value = dword.getValue();
            msg = exec.try(Function(value));
        }
        
        msg && smalltalk.alert(this._TITLE, msg)
            .then(focus);
        
        return this;
    };
    
    function createMsg() {
        var msg,
            wrapper = document.createElement('div'),
            html    = '<div class="dword-msg">/div>';
        
        wrapper.innerHTML = html;
        msg = wrapper.firstChild;
        
        return msg;
    }
    
    Dword.prototype.addKeyMap = function(keyMap) {
        this._Ace.addKeyMap(keyMap);
        return this;
    };
    
    Dword.prototype.goToLine         = function() {
        var myHeight coords;
        var dword = this;
        var Ace = this._Ace;
        var msg = 'Enter line number:';
        var cursor = dword.getCursor();
        var number = cursor.row + 1;
        
        smalltalk.prompt(this._TITLE, msg, number).then(function(line) {
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
        
        return this;
    };
    
    Dword.prototype.moveCursorTo     = function(row, column) {
        this._Ace.setCursor(row, column);
        return this;
    };
    
    Dword.prototype.refresh           = function() {
        this._Ace.refresh();
        return this;
    };
    
    Dword.prototype.focus            = function() {
        this._Ace.focus();
        return this;
    };
    
    Dword.prototype.remove           = function(direction) {
        var cmd;
        
        if (direction === 'right')
            cmd = 'delCharAfter';
        else
            cmd = 'delCharBefore';
            
        this._Ace.execCommand(cmd);
        
        return this;
    };
    
    Dword.prototype.getCursor        = function() {
        var plain   = this._Ace.getCursor(),
            cursor  = {
                row     : plain.line,
                column  : plain.ch
            };
        
        return cursor;
    };
    
    Dword.prototype.getValue         = function() {
        return this._Ace.getValue();
    };
    
    Dword.prototype.on               = function(event, fn) {
        this._Emitter.on(event, fn);
        return this;
    };
    
    Dword.prototype.once             = function(event, fn) {
        this._Emitter.once(event, fn);
        return this;
    };
    
    Dword.prototype.emit             = function(event) {
        this._Emitter.emit.apply(this._Emitter, arguments);
        return this;
    };
    
    Dword.prototype.isChanged        = function() {
        var value   = this._Ace.getValue(this._Separator),
            isEqual = value === this._Value;
        
        return !isEqual;
    };
    
    Dword.prototype.setValue         = function(value) {
        this._Ace.setValue(value);
        return this;
    };
    
    Dword.prototype.setValueFirst    = function(name, value) {
        var Ace     = this._Ace,
            dword   = this,
            self    = this;
        
        dword.setValue(value)
        
        // fix of linenumbers overlap
        dword.refresh();
        
        /*
         * getCursor returns another
         * information so set
         * cursor manually
         */
        Ace.setCursor(1, 0);
        Ace.clearHistory();
        
        this._FileName    = name;
        this._Value       = value;
        
        setTimeout(function() {
            self._Separator = getLineSeparator(value);
        }, 0);
        
        return this;
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
    
    Dword.prototype.setOption = function(name, value) {
        var Ace = this._Ace;
        switch(name) {
        default:
            Ace.setOption(name, value);
            break;
        case 'fontSize':
            Ace.display.wrapper.style.fontSize = value + 'px';
            break;
        }
        
        return this;
    };
    
    Dword.prototype.setOptions = function(options) {
        var dword = this;
        
        Object.keys(options).forEach(function(name) {
            var value = options[name];
            
            dword.setOption(name, value);
        });
        
        return this;
    };
    
    Dword.prototype.setMode = function(mode, callback) {
        var is,
            self   = this,
            isJSON  = mode === 'json',
            
            fn  = function(mode) {
                self._Ace.setOption('mode', mode);
                
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
        
        return this;
    };
    
    Dword.prototype.setModeForPath   = function(path) {
        var dword       = this,
            self        = this,
            modesByName = CodeMirror.findModeByFileName,
            name        = path.split('/').pop();
            
        self._addExt(name, function(name) {
            var htmlMode, isHTML,
                info    = modesByName(name) || {},
                mode    = info.mode;
            
            htmlMode    = modesByName('.html').mode;
            
            isHTML      = mode === htmlMode;
            
            dword.setOption('matchTags', isHTML);
            
            if (isHTML)
                self._setEmmet();
            
            dword.setMode(mode, function() {
                var reg     = /^(json|javascript)$/,
                    isLint  = reg.test(mode),
                    isJS    = /.js$/.test(name);
                
                if (!isLint)
                    dword.setOption('lint', false);
                else if (!isJS)
                    dword.setOption('lint', true);
                else
                    self._setJsHintConfig(function(jshint) {
                        dword.setOption('lint', jshint);
                    });
            });
        });
        
        return this;
    };
    
    Dword.prototype.selectAll    = function() {
        this._Ace.execCommand('selectAll');
        return this;
    };
    
    Dword.prototype.copyToClipboard = function() {
        var msg = 'Could not copy, use &ltCtrl&gt + &ltС&gt insted!';
        
        if (!this._clipboard('copy'))
            smalltalk.alert(this._TITLE, msg);
    };
    
    Dword.prototype.cutToClipboard = function() {
        var msg = 'Could not cut, use &ltCtrl&gt + &ltX&gt insted!';
        
        if (!this._clipboard('cut'))
            smalltalk.alert(this._TITLE, msg);
        else
            this.remove('right');
    };
    
    Dword.prototype.pasteFromClipboard = function() {
        var msg = 'Could not paste, use &ltCtrl&gt + &ltV&gt insted!';
        
        if (!this._clipboard('paste'))
            smalltalk.alert(this._TITLE, msg);
    };
    
    Dword.prototype._clipboard = function(cmd) {
        var result,
            Ace         = this._Ace,
            story       = this._story,
            value,
            NAME        = 'editor-clipboard',
            body        = document.body,
            textarea    = document.createElement('textarea');
        
        if (!/^cut|copy|paste$/.test(cmd))
            throw Error('cmd could be "cut" or "copy" only!');
        
        body.appendChild(textarea);
        
        if (cmd === 'paste') {
            textarea.focus();
            result = document.execCommand(cmd);
            value = textarea.value;
            
            if (!result) {
                this._showMessageOnce('Could not paste from clipboard. Inner buffer used.');
                result  = true;
                value   = story.getData(NAME);
            }
            
            if (value)
                Ace.getDoc().replaceSelection(value);
        } else {
            textarea.value = Ace.getSelection('\n');
            story.setData(NAME, textarea.value);
            textarea.select();
            result = document.execCommand(cmd);
        }
        
        body.removeChild(textarea);
        
        return result;
    };
    
    Dword.prototype.showMessage = function(text) {
        var self        = this,
            HIDE_TIME   = 2000;
        
        if (!this._ElementMsg) {
            this._ElementMsg = createMsg();
            this._Element.appendChild(this._ElementMsg);
        }
        
        this._ElementMsg.textContent = text;
        this._ElementMsg.hidden = false;
        
        setTimeout(function() {
            self._ElementMsg.hidden = true;
        }, HIDE_TIME);
        
        return this;
    };
    
    Dword.prototype.sha          = function(callback) {
        var dword   = this,
            url     = this._PREFIX + this._DIR + 'jsSHA/src/sha.js';
        
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
    
    Dword.prototype.beautify = function() {
       this._readWithFlag('beautify');
       return this;
    };
    
    Dword.prototype.minify = function() {
        this._readWithFlag('minify');
        return this;
    };
    
    Dword.prototype.save = function() {
        var self    = this,
            dword   = this,
            value   = dword.getValue();
        
        this._loadOptions(function(error, config) {
            var isDiff      = config.diff,
                isZip       = config.zip,
                doDiff      = self._doDiff.bind(self);
            
            exec.if(!isDiff, function(patch) {
                var query           = '',
                    patchLength     = patch && patch.length || 0,
                    length          = self._Value.length,
                    isLessMaxLength = length < self._MAX_FILE_SIZE,
                    isLessLength    = isLessMaxLength && patchLength < length,
                    isStr           = typeof patch === 'string',
                    isPatch         = patch && isStr && isLessLength;
                
                self._Value         = value;
                
                exec.if(!isZip || isPatch, function(equal, data) {
                    var result  = data || self._Value;
                    
                    if (isPatch)
                        dword._patch(self._FileName, patch);
                    else
                        dword._write(self._FileName + query, result);
                }, function(func) {
                    self._zip(value, function(error, data) {
                        if (error)
                            console.error(error);
                        
                        query = '?unzip';
                        func(null, data);
                    });
                });
                
            }, exec.with(doDiff, self._FileName));
        });
        
        return dword;
    };
    
    Dword.prototype._loadOptions = function(callback) {
        var self    = this,
            url     = this._PREFIX + '/options.json';
        
        if (self._Options)
            callback(null, self._Options);
        else
            load.json(url, function(error, data) {
                self._Options = data;
                callback(error, data);
            });
    };
        
    Dword.prototype._patchHttp = function(path, patch) {
        var onSave = this._onSave.bind(this);
        restafary.patch(path, patch, onSave);
    };
    
    Dword.prototype._writeHttp = function(path, result) {
        var onSave = this._onSave.bind(this);
        restafary.write(path, result, onSave);
    };
    
    Dword.prototype._onSave = function(error, text) {
        var self        = this,
            dword       = this,
            Value       = self._Value,
            FileName    = self._FileName,
            msg         = 'Try again?';
            
        if (error) {
            if (error.message)
                msg = error.message + '\n' + msg;
            else
                msg = 'Can\'t save.' + msg;
            
            smalltalk.confirm(this._TITLE, msg).then(function() {
                var onSave = self._onSave.bind(self);
                restafary.write(self._FileName, self._Value, onSave);
            }).catch(empty).then(function(){
                dword.focus();
            });
        } else {
            dword.showMessage(text);
            
            dword.sha(function(error, hash) {
                if (error)
                    console.error(error);
                
                self._story.setData(FileName, Value)
                     .setHash(FileName, hash);
            });
            
            self._Emitter.emit('save', Value.length);
        }
    };
    
    Dword.prototype._doDiff = function(path, callback) {
        var self    = this,
            value   = this.getValue();
        
        this._diff(value, function(patch) {
            self._story.checkHash(path, function(error, equal) {
                if (!equal)
                    patch = '';
                
                callback(patch);
            });
        });
    };
    
    Dword.prototype._diff = function(newValue, callback) {
        var self = this;
        
        self._loadDiff(function(error) {
            var patch;
            
            if (error) {
                smalltalk.alert(this._TITLE, error);
            } else {
                self._Value = self._story.getData(self._FileName);
                patch       = daffy.createPatch(self._Value, newValue);
                callback(patch);
            }
        });
    };
    
    Dword.prototype._loadDiff = function(callback) {
        var self    = this,
            url     = this._PREFIX + join([
                'google-diff-match-patch/diff_match_patch.js',
                'daffy/lib/daffy.js'
            ].map(function(name) {
                return self._DIR + name;
            }));
        
        load.js(url, callback);
    };
    
    Dword.prototype._zip = function(value, callback) {
        var self    = this,
            prefix  = this._PREFIX;
        
        exec.parallel([
            function(callback) {
                var url = prefix + self._DIR + 'zipio/lib/zipio.js';
                
                load.js(url, callback);
            },
            function(callback) {
                loadRemote('pako', {prefix: prefix}, callback);
            }
        ], function(error) {
            if (!error)
                global.zipio(value, callback);
            else
                smalltalk.alert(this._TITLE, error);
        });
    };
    
    Dword.prototype._setEmmet = function() {
        var dir         = this._DIR + 'codemirror-emmet/dist/',
            extensions  = this._Config.extensions,
            isEmmet     = extensions.emmet;
        
        if (isEmmet)
            load.js(this._PREFIX + join([
                dir + 'emmet.min.js'
            ]));
    };
    
    Dword.prototype._setJsHintConfig = function(callback) {
        var self        = this,
            JSHINT_PATH = this._PREFIX + '/jshint.json';
        
        if (this._JSHintConfig)
            callback(this._JSHintConfig);
        else
            load.json(JSHINT_PATH, function(error, json) {
                if (!error)
                    self._JSHintConfig = json;
                else
                    smalltalk.alert(this._TITLE, error);
                
                callback(self._JSHintConfig);
            });
    };
    
    Dword.prototype._addExt = function(name, fn) {
        var self = this;
        
        if (self._Ext)
            add(null, self._Ext);
        else
            load.json(self._PREFIX + '/json/ext.json', function(error, data) {
                self._Ext = data;
                add(error, self._Ext);
            });
        
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
    };
    
    function getHost() {
        var l       = location,
            href    = l.origin || l.protocol + '//' + l.host;
        
        return href;
    }
    
    Dword.prototype._initSocket = function(error) {
        var socket,
            self            = this,
            dword           = this,
            href            = getHost(),
            FIVE_SECONDS    = 5000,
            patch    = function(name, data) {
                socket.emit('patch', name, data);
            };
            
        if (error)
            return smalltalk.alert(this._TITLE, error);
        
        socket  = io.connect(href + this._PREFIX, {
            'max reconnection attempts' : Math.pow(2, 32),
            'reconnection limit'        : FIVE_SECONDS,
            path                        : this._SOCKET_PATH + '/socket.io'
        });
        
        socket.on('reject', function() {
            self.emit('reject');
        });
        
        self._socket = socket;
        
        socket.on('connect', function() {
            dword._patch = patch;
        });
        
        socket.on('message', function(msg) {
            self._onSave(null, msg);
        });
        
        socket.on('file', function(name, data) {
            if (self._Ace) {
                self._initValue(name, data);
            } else {
                self._FileName    = name;
                self._Value       = data;
            }
        });
        
        socket.on('patch', function(name, data, hash) {
            if (name !== self._FileName)
                return;
            
            self._loadDiff(function(error) {
                var cursor, value;
                
                if (error)
                    return console.error(error);
                
                if (hash !== self._story.getHash(name))
                    return;
                    
                cursor  = dword.getCursor(),
                value   = dword.getValue();
                value   = daffy.applyPatch(value, data);
                
                dword.setValue(value);
                
                dword.sha(function(error, hash) {
                    self._story.setData(name, value)
                         .setHash(name, hash);
                    
                    dword.moveCursorTo(cursor.row, cursor.column);
                });
            });
        });
        
        socket.on('disconnect', function() {
            dword._patch = self._patchHttp;
        });
        
        socket.on('err', function(error) {
            smalltalk.alert(this._TITLE, error);
        });
    };
    
    Dword.prototype._initValue = function(name, data) {
        return this.setModeForPath(name)
            .setValueFirst(name, data)
            .moveCursorTo(0, 0);
    };
    
    Dword.prototype._readWithFlag = function(flag) {
        var dword   = this,
            path    = this._FileName + '?' + flag;
        
        restafary.read(path, function(error, data) {
            if (error)
                smalltalk.alert(dword._TITLE, error);
            else
                dword
                    .setValue(data)
                    .moveCursorTo(0, 0);
        });
    };
    
    /**
     * In Mac OS Chrome dropEffect = 'none'
     * so drop do not firing up when try
     * to upload file from download bar
     */
    Dword.prototype._onDragOver = function(event) {
        var dataTransfer    = event.dataTransfer,
            effectAllowed   = dataTransfer.effectAllowed;
        
        if (/move|linkMove/.test(effectAllowed))
            dataTransfer.dropEffect = 'move';
        else
            dataTransfer.dropEffect = 'copy';
        
        event.preventDefault();
    };
    
    Dword.prototype._onDrop = function(event) {
        var dword   = this,
            reader, files,
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
    };
    
    function getModulePath(name, lib, ext) {
        ext = ext || '.js';
        
        var path = '';
        var libdir = '/';
        var dir = '/modules/';
        
        if (lib)
            libdir  = '/' + lib + '/';
        
        path    = dir + name + libdir + name + ext;
        
        return path;
    }
    
    Dword.prototype._loadStyles = function(callback) {
        var urlCSS  = '',
            dir     = this._DIR + 'codemirror/',
            addon   = dir + 'addon/',
            lint    = addon + 'lint/',
            theme   = this._Config.options.theme,
            urls    =[
                addon   + 'dialog/dialog',
                addon   + 'search/matchesonscrollbar',
                lint    + 'lint',
                '/css/dword',
            ];
        
        if (theme && theme !== 'default')
            urls.unshift(dir + 'theme/' + theme);
        
        urlCSS = this._PREFIX + join(urls
            .map(function(name) {
                return name + '.css';
            }));
        
        load(urlCSS, callback);
    };
    
    Dword.prototype._loadFiles = function(callback) {
        var self = this;
        var obj = {
            loadRemote  : getModulePath('loadremote', 'lib'),
            load        : getModulePath('load'),
            Emitify     : getModulePath('emitify', 'dist', '.min.js'),
            join        : '/join/join.js'
        };
            
        var scripts = Object.keys(obj)
            .filter(function(name) {
                return !window[name];
            })
            .map(function(name) {
                return self._PREFIX + obj[name];
            });
        
        exec.if(!scripts.length, callback, function() {
            loadScript(scripts, callback);
        });
    };
     
    Dword.prototype._loadFilesAll = function(callback) {
        var self        = this,
            DIR         = this._DIR,
            PREFIX      = this._PREFIX,
            initSocket  = this._initSocket.bind(this);
        
        exec.series([
            function(callback) {
                var options = {
                    prefix: PREFIX
                };
                
                loadRemote('codemirror', options, callback);
            },
            
            function(callback) {
                loadRemote('socket', {
                    name : 'io',
                    prefix: self._SOCKET_PATH
                }, initSocket);
                
                callback();
            },
            
            function(callback) {
                CodeMirror.modeURL = PREFIX + DIR + 'codemirror/mode/%N/%N.js';
                callback();
            },
             
            function(callback) {
                var js = PREFIX + '/restafary.js';
                var dir = DIR + 'codemirror/';
                var client = 'client/';
                var addon = dir + 'addon/';
                var lint = addon + 'lint/';
                
                var urlJS = PREFIX + join([
                    dir     + 'keymap/vim',
                    dir     + 'mode/meta',
                    
                    lint    + 'lint',
                    lint    + 'javascript-lint',
                    lint    + 'json-lint',
                    
                    client  + 'show-trailing',
                    client  + 'use-soft-tabs',
                    
                    DIR     + 'jshint/dist/jshint',
                    DIR     + 'cm-searchbox/lib/searchbox',
                    DIR     + 'cm-show-invisibles/lib/show-invisibles',
                    getKeyMapPath(dir, self._Config)
                ].filter(function(name) {
                    return name;
                }).concat([
                    'display/autorefresh',
                    
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
    };
     
    function getKeyMapPath(dir, config) {
        var path = '';
        var keyMap  = config && config.options && config.options.keyMap;
        
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
        if (!(this instanceof Story))
            return new Story();
    }
    
    Story.prototype.checkHash              = function(name, callback) {
        this.loadHash(name, function(error, loadHash) {
            var nameHash    = name + '-hash',
                storeHash   = localStorage.getItem(nameHash),
                equal       = loadHash === storeHash;
            
            callback(error, equal);
        });
        
        return this;
    };
    
    Story.prototype.loadHash               = function(name, callback) {
        var query       = '?hash';
        
        restafary.read(name + query, callback);
        
        return this;
    };
    
    Story.prototype.setData                = function(name, data) {
        var nameData    = name + '-data';
        
        localStorage.setItem(nameData, data);
        
        return this;
    };
    
    Story.prototype.setHash                = function(name, hash) {
        var nameHash    = name + '-hash';
        
        localStorage.setItem(nameHash, hash);
        
        return this;
    };
    
    Story.prototype.getData                = function(name) {
        var nameData    = name + '-data',
            data        = localStorage.getItem(nameData);
        
        return data || '';
    };
    
    Story.prototype.getHash                = function(name) {
        var item    = name + '-hash',
            data    = localStorage.getItem(item);
        
        return data || '';
    };
    
})(this);
