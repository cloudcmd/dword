/* global CodeMirror, exec, io, join, restafary, Emitify, loadRemote */

'use strict';

require('../css/dword.css');

const wraptile = require('wraptile/legacy');
const currify = require('currify/legacy');
const daffy = require('daffy');
const zipio = require('zipio');
const smalltalk = require('smalltalk');

const Story = require('./story');
const setKeyMap = require('./set-key-map');
const showMessage = require('./show-message');

window.exec = window.exec || require('execon');
window.load = window.load || require('load.js');

const {load} = window;

const _clipboard = require('./_clipboard');

const loadParallel = currify(load.parallel);
const notGlobal = (name) => !window[name];
const addPrefix = currify((obj, prefix, name) => prefix + obj[name]);

module.exports = (el, options, callback) => {
    Dword(el, options, callback);
};

function Dword(el, options, callback) {
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
    
    const onDrop = this._onDrop.bind(this);
    const onDragOver = this._onDragOver.bind(this);
    
    this._Element.addEventListener('drop', onDrop);
    this._Element.addEventListener('dragover', onDragOver);
    
    this._init(() => {
        callback(this);
    });
    
    this._patch = (path, patch) => {
        this._patchHttp(path, patch);
    };
    
    this._write = (path, result) => {
        this._writeHttp(path, result);
    };
}

Dword.prototype.showMessage = showMessage;

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

function empty() {}

Dword.prototype._init = function(fn) {
    const loadFiles = this._loadFiles.bind(this);
    const loadFilesAll = this._loadFilesAll.bind(this);
    const loadStyles = this._loadStyles.bind(this);
    
    exec.series([
        loadFiles,
        (callback) => {
            load.json(this._PREFIX + '/edit.json', (error, config) => {
                if (error)
                    return smalltalk.alert(this._TITLE, 'Could not load edit.json!');
                
                this._Config = config;
                callback();
            });
        },
        
        loadFilesAll,
        loadStyles,
        
        () => {
            const options = this._Config.options;
            const Value = this._Value;
            const all = {
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
            
            this._Emitter = Emitify();
            this._Emitter.on('auth', (username, password) => {
                this._socket.emit('auth', username, password);
            });
            
            Object.keys(options).forEach((name) => {
                if (name === 'tabSize')
                    return all.indentUnit = options.tabSize;
                
                if (name === 'wrap')
                    return all.lineWrapping = options.wrap;
                
                all[name] = options[name];
            });
            
            this._Ace = CodeMirror(this._Element, all);
            CodeMirror.commands.save = this.save.bind(this);
            
            if (Value)
                this._initValue(this._FileName, Value);
            
            this._Ace.on('change', () => {
                this._Emitter.emit('change');
            });
            
            addCommands(this);
            
            fn();
            
            this.setOptions(options);
        },
    ]);
};

function addCommands(dword) {
    const call = (fn) => fn.call(dword);
    const wrapCall = wraptile(call);
    
    const callIfKey = wraptile((fn) => {
        dword.isKey() && call(fn);
    });
    
    const commands = {
        'Ctrl-G': wrapCall(dword.goToLine),
        'Ctrl-S': callIfKey(dword.save),
        'F2'    : callIfKey(dword.save),
        'Ctrl-B': callIfKey(dword.beautify),
        'Ctrl-M': callIfKey(dword.minify),
        'Ctrl-E': callIfKey(dword.evaluate),
        'Ctrl-/': 'toggleComment'
    };
    
    Object.keys(commands).forEach((name) => {
        if (/^Ctrl/.test(name)) {
            const nameCmd = name.replace('Ctrl', 'Cmd');
            commands[nameCmd] = commands[name];
        }
    });
    
    dword.addKeyMap(commands);
}

Dword.prototype.evaluate = function() {
    const focus = this.focus.bind(this);
    const {
        _FileName,
        _TITLE,
    } = this;
    
    const isJS = /\.js$/.test(_FileName);
    
    let msg;
    
    if (!isJS) {
        msg = 'Evaluation supported for JavaScript only';
    } else {
        const value = this.getValue();
        msg = exec.try(Function(value));
    }
    
    msg && smalltalk.alert(_TITLE, msg)
        .then(focus);
    
    return this;
};

Dword.prototype.addKeyMap = function(keyMap) {
    this._Ace.addKeyMap(keyMap);
    return this;
};

Dword.prototype.goToLine = function() {
    const dword = this;
    const Ace = this._Ace;
    const msg = 'Enter line number:';
    const cursor = dword.getCursor();
    const number = cursor.row + 1;
    
    smalltalk.prompt(this._TITLE, msg, number).then((line) => {
        const ch = 0;
        
        Ace.setCursor({
            line: line - 1,
            ch,
        });
        
        const myHeight = Ace.getScrollInfo().clientHeight;
        const coords = Ace.charCoords({line, ch}, 'local');
        
        Ace.scrollTo(null, (coords.top + coords.bottom - myHeight) / 2);
    }).catch(empty).then(() => {
        dword.focus();
    });
    
    return this;
};

Dword.prototype.moveCursorTo = function(row, column) {
    this._Ace.setCursor(row, column);
    return this;
};

Dword.prototype.refresh = function() {
    this._Ace.refresh();
    return this;
};

Dword.prototype.focus = function() {
    this._Ace.focus();
    return this;
};

Dword.prototype.remove = function(direction) {
    const cmd = (direction) => {
        if (direction === 'right')
            return 'delCharAfter';
        
        return 'delCharBefore';
    };
    
    this._Ace.execCommand(cmd(direction));
    
    return this;
};

Dword.prototype.getCursor = function() {
    const {line, ch} = this._Ace.getCursor();
    const cursor = {
        row: line,
        column: ch
    };
    
    return cursor;
};

Dword.prototype.getValue = function() {
    return this._Ace.getValue();
};

Dword.prototype.on = function(event, fn) {
    this._Emitter.on(event, fn);
    return this;
};

Dword.prototype.once = function(event, fn) {
    this._Emitter.once(event, fn);
    return this;
};

Dword.prototype.emit = function() {
    this._Emitter.emit.apply(this._Emitter, arguments);
    return this;
};

Dword.prototype.isChanged = function() {
    const value = this._Ace.getValue(this._Separator);
    const isEqual = value === this._Value;
    
    return !isEqual;
};

Dword.prototype.setValue = function(value) {
    this._Ace.setValue(value);
    return this;
};

Dword.prototype.setValueFirst = function(name, value) {
    const Ace = this._Ace;
    const dword = this;
    
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
    
    setTimeout(() => {
        this._Separator = getLineSeparator(value);
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
    if (typeof value !== 'string')
        throw Error('value should be string!');
    
    if (~value.indexOf('\r\n'))
        return '\r\n';
    
    return '\n';
}

Dword.prototype.setOption = function(name, value) {
    const {_Ace} = this;
    const preventOverwrite = () => {
        this._Config.options[name] = value;
    };
    
    preventOverwrite();
    
    switch(name) {
    default:
        _Ace.setOption(name, value);
        break;
    case 'fontSize':
        _Ace.display.wrapper.style.fontSize = value + 'px';
        break;
    }
    
    return this;
};

Dword.prototype.setKeyMap = setKeyMap;
Dword.prototype.setOptions = function(options) {
    Object.keys(options).forEach((name) => {
        const value = options[name];
        
        this.setOption(name, value);
    });
    
    return this;
};

Dword.prototype.setMode = function(mode, callback) {
    const isJSON = mode === 'json';
    
    const fn = (mode) => {
        this._Ace.setOption('mode', mode);
        exec(callback);
    };
    
    if (isJSON)
        mode = 'javascript';
    else if (!mode)
        mode = null;
    
    const is = CodeMirror.modes[mode];
    
    if (is || !mode) {
        fn(mode);
        return this;
    }
    
    CodeMirror.requireMode(mode, () => {
        fn(mode);
    });
    
    return this;
};

Dword.prototype.setModeForPath = function(path) {
    const {findModeByFileName} = CodeMirror;
    const name = path.split('/').pop();
    
    this._addExt(name, (name) => {
        const dword = this;
        const info = findModeByFileName(name) || {};
        const {mode} = info;
        const htmlMode = findModeByFileName('.html').mode;
        const isHTML = mode === htmlMode;
        
        dword.setOption('matchTags', isHTML);
        
        if (isHTML)
            this._setEmmet();
        
        dword.setMode(mode, () => {
            const reg = /^(json|javascript)$/;
            const isLint = reg.test(mode);
            const isJS = /.js$/.test(name);
            
            if (!isLint)
                return dword.setOption('lint', false);
            
            if (!isJS)
                return dword.setOption('lint', true);
            
            this._setJsHintConfig((jshint) => {
                dword.setOption('lint', jshint);
            });
        });
    });
    
    return this;
};

Dword.prototype.selectAll = function() {
    this._Ace.execCommand('selectAll');
    return this;
};

Dword.prototype.copyToClipboard = function() {
    const msg = 'Could not copy, use &ltCtrl&gt + &ltС&gt insted!';
    
    if (!this._clipboard('copy'))
        smalltalk.alert(this._TITLE, msg);
};

Dword.prototype.cutToClipboard = function() {
    const msg = 'Could not cut, use &ltCtrl&gt + &ltX&gt insted!';
    
    if (!this._clipboard('cut'))
        return smalltalk.alert(this._TITLE, msg);
    
    this.remove('right');
};

Dword.prototype.pasteFromClipboard = function() {
    const msg = 'Could not paste, use &ltCtrl&gt + &ltV&gt insted!';
    
    if (!this._clipboard('paste'))
        smalltalk.alert(this._TITLE, msg);
};

Dword.prototype._clipboard = _clipboard;

Dword.prototype.sha          = function(callback) {
    const url = this._PREFIX + this._DIR + 'jsSHA/src/sha.js';
    
    load.js(url, () => {
        const value = this.getValue();
        let hash;
        
        const error = exec.try(() => {
            const shaObj = new window.jsSHA('SHA-1', 'TEXT');
            shaObj.update(value);
            hash = shaObj.getHash('HEX');
        });
        
        callback(error, hash);
    });
    
    return this;
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
    const value = this.getValue();
    
    this._loadOptions((error, config) => {
        const isDiff = config.diff;
        const isZip = config.zip;
        const doDiff = this._doDiff.bind(this);
        
        exec.if(!isDiff, (patch) => {
            let query = '';
            const patchLength = patch && patch.length || 0;
            const length = this._Value.length;
            const isLessMaxLength = length < this._MAX_FILE_SIZE;
            const isLessLength = isLessMaxLength && patchLength < length;
            const isStr = typeof patch === 'string';
            const isPatch = patch && isStr && isLessLength;
            
            this._Value = value;
            
            exec.if(!isZip || isPatch, (equal, data) => {
                const result  = data || this._Value;
                
                if (isPatch)
                    return this._patch(this._FileName, patch);
                
                this._write(this._FileName + query, result);
            }, (func) => {
                zipio(value, (error, data) => {
                    if (error)
                        console.error(error);
                    
                    query = '?unzip';
                    func(null, data);
                });
            });
            
        }, exec.with(doDiff, this._FileName));
    });
    
    return this;
};

Dword.prototype._loadOptions = function(callback) {
    const url = this._PREFIX + '/options.json';
    
    if (this._Options)
        return callback(null, this._Options);
    
    load.json(url, (error, data) => {
        this._Options = data;
        callback(error, data);
    });
};
    
Dword.prototype._patchHttp = function(path, patch) {
    const onSave = this._onSave.bind(this);
    restafary.patch(path, patch, onSave);
};

Dword.prototype._writeHttp = function(path, result) {
    const onSave = this._onSave.bind(this);
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
    const value = this.getValue();
    
    this._diff(value, (patch) => {
        this._story.checkHash(path, (error, equal) => {
            if (!equal)
                patch = '';
            
            callback(patch);
        });
    });
};

Dword.prototype._diff = function(newValue, callback) {
    const {
        _story,
        _FileName,
    } = this;
    
    this._Value = _story.getData(_FileName);
    const patch = daffy.createPatch(this._Value, newValue);
    
    callback(patch);
};

Dword.prototype._setEmmet = function() {
    var dir = this._DIR + 'codemirror-emmet/dist/';
    var extensions = this._Config.extensions;
    var isEmmet = extensions.emmet;
    
    if (isEmmet)
        load.js(this._PREFIX + join([
            dir + 'emmet.min.js'
        ]));
};

Dword.prototype._setJsHintConfig = function(callback) {
    const JSHINT_PATH = this._PREFIX + '/jshint.json';
    
    if (this._JSHintConfig)
        callback(this._JSHintConfig);
       
    return load.json(JSHINT_PATH, (error, json) => {
        if (!error)
            return this._JSHintConfig = json;
        
        smalltalk.alert(this._TITLE, error);
        
        callback(this._JSHintConfig);
    });
};

Dword.prototype._addExt = function(name, fn) {
    if (this._Ext)
        return add(null, this._Ext);
    
    load.json(this._PREFIX + '/json/ext.json', (error, data) => {
        this._Ext = data;
        add(error, this._Ext);
    });
    
    function add(error, exts) {
        if (error)
            return console.error(Error('Could not load ext.json!'));
        
        Object.keys(exts).some((ext) => {
            const arr = exts[ext];
            const is = ~arr.indexOf(name);
            
            if (is)
                name += '.' + ext;
            
            return is;
        });
        
        fn(name);
    }
};

function getHost() {
    const l = location;
    const href = l.origin || l.protocol + '//' + l.host;
    
    return href;
}

Dword.prototype._initSocket = function(error) {
    const dword = this;
    const href = getHost();
    const FIVE_SECONDS = 5000;
    const patch = (name, data) => {
        socket.emit('patch', name, data);
    };
    
    if (error)
        return smalltalk.alert(this._TITLE, error);
    
    const socket = io.connect(href + this._PREFIX, {
        'max reconnection attempts' : Math.pow(2, 32),
        'reconnection limit'        : FIVE_SECONDS,
        path                        : this._SOCKET_PATH + '/socket.io'
    });
    
    socket.on('reject', () => {
        this.emit('reject');
    });
    
    this._socket = socket;
    
    socket.on('connect', () => {
        this._patch = patch;
    });
    
    socket.on('message', (msg) => {
        dword._onSave(null, msg);
    });
    
    socket.on('file', (name, data) => {
        if (dword._Ace)
            return this._initValue(name, data);
        
        this._FileName    = name;
        this._Value       = data;
    });
    
    socket.on('patch', (name, data, hash) => {
        if (name !== this._FileName)
            return;
        
        this._loadDiff((error) => {
            if (error)
                return console.error(error);
            
            if (hash !== this._story.getHash(name))
                return;
            
            const cursor = dword.getCursor();
            const value = daffy.applyPatch(dword.getValue(), data);
            
            dword.setValue(value);
            
            dword.sha((error, hash) => {
                this._story.setData(name, value)
                    .setHash(name, hash);
                
                dword.moveCursorTo(cursor.row, cursor.column);
            });
        });
    });
    
    socket.on('disconnect', () => {
        this._patch = this._patchHttp;
    });
    
    socket.on('err', (error) => {
        smalltalk.alert(this._TITLE, error);
    });
};

Dword.prototype._initValue = function(name, data) {
    return this.setModeForPath(name)
        .setValueFirst(name, data)
        .moveCursorTo(0, 0);
};

Dword.prototype._readWithFlag = function(flag) {
    const dword = this;
    const path = this._FileName + '?' + flag;
    
    restafary.read(path, (error, data) => {
        if (error)
            return smalltalk.alert(dword._TITLE, error);
        
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
    const dataTransfer = event.dataTransfer;
    const effectAllowed = dataTransfer.effectAllowed;
    
    if (/move|linkMove/.test(effectAllowed))
        dataTransfer.dropEffect = 'move';
    else
        dataTransfer.dropEffect = 'copy';
    
    event.preventDefault();
};

Dword.prototype._onDrop = function(event) {
    const dword = this;
    const onLoad = (event) => {
        const data = event.target.result;
        dword.setValue(data);
    };
    
    event.preventDefault();
    
    const files = event.dataTransfer.files;
    
    [...files].forEach((file) => {
        const reader = new FileReader();
        reader.addEventListener('load', onLoad);
        reader.readAsBinaryString(file);
    });
};

function getModulePath(name, lib, ext) {
    ext = ext || '.js';
    
    let libdir = '/';
    const dir = '/modules/';
    
    if (lib)
        libdir  = '/' + lib + '/';
    
    return dir + name + libdir + name + ext;
}

Dword.prototype._loadStyles = function(callback) {
    const dir = this._DIR + 'codemirror/';
    const addon = dir + 'addon/';
    const lint = addon + 'lint/';
    const theme = this._Config.options.theme;
    const urls = [
        addon   + 'dialog/dialog',
        addon   + 'search/matchesonscrollbar',
        lint    + 'lint',
        '/css/dword',
    ];
    
    if (theme && theme !== 'default')
        urls.unshift(dir + 'theme/' + theme);
    
    const addCss = (a) => `${a}.css`;
    const urlCSS = this._PREFIX + join(urls.map(addCss))
    
    load(urlCSS, callback);
};

Dword.prototype._loadFiles = function(callback) {
    const obj = {
        loadRemote  : getModulePath('loadremote', 'lib'),
        Emitify     : getModulePath('emitify', 'dist', '.min.js'),
        join        : '/join/join.js'
    };
    
    const scripts = Object.keys(obj)
        .filter(notGlobal)
        .map(addPrefix(obj, this._PREFIX));
    
    exec.if(!scripts.length, callback, loadParallel(scripts));
};
 
Dword.prototype._loadFilesAll = function(callback) {
    const DIR = this._DIR;
    const PREFIX = this._PREFIX;
    const initSocket = this._initSocket.bind(this);
    
    exec.series([
        (callback) => {
            const options = {
                prefix: PREFIX
            };
            
            loadRemote('codemirror', options, callback);
        },
        
        (callback) => {
            CodeMirror.modeURL = PREFIX + DIR + 'codemirror/mode/%N/%N.js';
            callback();
        },
         
        (callback) => {
            const js = PREFIX + '/restafary.js';
            const dir = DIR + 'codemirror/';
            const client = 'client/codemirror/';
            const addon = dir + 'addon/';
            const lint = addon + 'lint/';
            
            const urlJS = PREFIX + join([
                dir     + 'mode/meta',
                
                lint    + 'lint',
                lint    + 'javascript-lint',
                lint    + 'json-lint',
                
                client  + 'show-trailing',
                client  + 'use-soft-tabs',
                
                DIR     + 'jshint/dist/jshint',
                DIR     + 'cm-searchbox/lib/searchbox',
                DIR     + 'cm-show-invisibles/dist/show-invisibles',
                getKeyMapPath(dir, this._Config),
                dir     + 'keymap/vim',
            ].filter(Boolean)
                .concat([
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
                ].map((name) => {
                    return addon + name;
                })
                ).map((name) => {
                    return name + '.js';
                }));
             
            load.parallel([urlJS, js], callback);
        },
        
        (callback) => {
            loadRemote('socket', {
                name : 'io',
                prefix: this._SOCKET_PATH
            }, initSocket);
            
            callback();
        },
        
        () => {
            restafary.prefix(PREFIX + '/api/v1/fs');
            callback();
        }
    ]);
};
 
function getKeyMapPath(dir, config) {
    const keyMap = config && config.options && config.options.keyMap;
    
    if (keyMap && keyMap !== 'default')
        return dir + 'keymap/' + keyMap;
    
    return '';
}

