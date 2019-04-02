/* global CodeMirror, exec, join, loadRemote */

'use strict';

require('../css/dword.css');

const restafary = require('restafary/legacy/client');
const wraptile = require('wraptile/legacy');
const currify = require('currify/legacy');
const {promisify} = require('es6-promisify');
const {createPatch} = require('daffy');
const smalltalk = require('smalltalk');
const jssha = require('jssha');
const Emitify = require('emitify/legacy');

const Story = require('./story');
const setKeyMap = require('./set-key-map');
const showMessage = require('./show-message');

window.exec = window.exec || require('execon');
window.load = window.load || require('load.js');
const {load} = window;

const loadJSON = promisify(load.json);

const _clipboard = require('./_clipboard');
const save = require('./save');
const _initSocket = require('./_init-socket');

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
    
    this._maxSize = options.maxSize || 512000;
    this._PREFIX = options.prefix || '/dword';
    this._prefixSocket = options.prefixSocket || '/dword';
    this._socketPath = options.socketPath || '';
    
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
            const {options} = this._Config;
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
                
                highlightSelectionMatches: true,
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
        'Ctrl-E': callIfKey(dword.evaluate),
        'Ctrl-/': 'toggleComment',
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
        column: ch,
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

Dword.prototype.emit = function(...args) {
    this._Emitter.emit(...args);
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
    
    dword.setValue(value);
    
    // fix of linenumbers overlap
    dword.refresh();
    
    /*
     * getCursor returns another
     * information so set
     * cursor manually
     */
    Ace.setCursor(1, 0);
    Ace.clearHistory();
    
    this._FileName = name;
    this._Value = value;
    
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

Dword.prototype.sha = function() {
    const value = this.getValue();
    const shaObj = new jssha('SHA-1', 'TEXT');
    shaObj.update(value);
    
    return shaObj.getHash('HEX');
};

Dword.prototype.save = save;

Dword.prototype._loadOptions = async function() {
    const url = this._PREFIX + '/options.json';
    
    if (this._Options)
        return this._Options;
    
    const data = await loadJSON(url);
    
    this._Options = data;
    
    return data;
};

Dword.prototype._patchHttp = function(path, patch) {
    const onSave = this._onSave.bind(this);
    restafary.patch(path, patch, onSave);
};

Dword.prototype._writeHttp = function(path, result) {
    const onSave = this._onSave.bind(this);
    restafary.write(path, result, onSave);
};

Dword.prototype._onSave = require('./_on-save');
Dword.prototype._doDiff = async function(path) {
    const value = this.getValue();
    
    const patch = this._diff(value);
    const equal = await this._story.checkHash(path);
    
    return equal ? patch : '';
};

Dword.prototype._diff = function(newValue) {
    const {
        _story,
        _FileName,
    } = this;
    
    this._Value = _story.getData(_FileName) || this._Value;
    return createPatch(this._Value, newValue);
};

Dword.prototype._setEmmet = function() {
    const dir = this._DIR + 'codemirror-emmet/dist/';
    const {extensions} = this._Config;
    const isEmmet = extensions.emmet;
    
    if (!isEmmet)
        return;
    
    load.js(this._PREFIX + join([
        dir + 'emmet.min.js',
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

Dword.prototype._initSocket = _initSocket;
Dword.prototype._initValue = function(name, data) {
    return this.setModeForPath(name)
        .setValueFirst(name, data)
        .moveCursorTo(0, 0);
};

/**
 * In Mac OS Chrome dropEffect = 'none'
 * so drop do not firing up when try
 * to upload file from download bar
 */
Dword.prototype._onDragOver = function(event) {
    const {dataTransfer} = event;
    const {effectAllowed} = dataTransfer;
    
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
    
    const {files} = event.dataTransfer;
    
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
        libdir = '/' + lib + '/';
    
    return dir + name + libdir + name + ext;
}

Dword.prototype._loadStyles = function(callback) {
    const dir = this._DIR + 'codemirror/';
    const addon = dir + 'addon/';
    const lint = addon + 'lint/';
    const {theme} = this._Config.options;
    const urls = [
        addon + 'dialog/dialog',
        addon + 'search/matchesonscrollbar',
        lint + 'lint',
        '/css/dword',
    ];
    
    if (theme && theme !== 'default')
        urls.unshift(dir + 'theme/' + theme);
    
    const addCss = (a) => `${a}.css`;
    const urlCSS = this._PREFIX + join(urls.map(addCss));
    
    load(urlCSS, callback);
};

Dword.prototype._loadFiles = function(callback) {
    const obj = {
        loadRemote  : getModulePath('loadremote', 'lib'),
        join        : '/join/join.js',
    };
    
    const scripts = Object.keys(obj)
        .filter(notGlobal)
        .map(addPrefix(obj, this._PREFIX));
    
    exec.if(!scripts.length, callback, loadParallel(scripts));
};

Dword.prototype._loadFilesAll = function(callback) {
    const DIR = this._DIR;
    const prefix = this._PREFIX;
    
    exec.series([
        (callback) => {
            loadRemote('codemirror', {prefix}, callback);
        },
        
        (callback) => {
            CodeMirror.modeURL = prefix + DIR + 'codemirror/mode/%N/%N.js';
            callback();
        },
        
        (callback) => {
            const dir = DIR + 'codemirror/';
            const client = 'client/codemirror/';
            const addon = dir + 'addon/';
            const lint = addon + 'lint/';
            
            const urlJS = prefix + join([
                dir + 'mode/meta',
                
                lint + 'lint',
                lint + 'javascript-lint',
                lint + 'json-lint',
                
                client + 'show-trailing',
                client + 'use-soft-tabs',
                
                DIR + 'jshint/dist/jshint',
                DIR + 'cm-searchbox/lib/searchbox',
                DIR + 'cm-show-invisibles/dist/show-invisibles',
                getKeyMapPath(dir, this._Config),
                dir + 'keymap/vim',
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
                    'edit/matchtags',
                ].map((name) => {
                    return addon + name;
                })
                ).map((name) => {
                    return name + '.js';
                }));
            
            load(urlJS, callback);
        },
        
        (callback) => {
            restafary.prefix(prefix + '/api/v1/fs');
            callback();
        },
        
        (callback) => {
            loadRemote('socket', {
                name : 'io',
                prefix: this._socketPath,
            }, callback);
        },
        
        () => {
            this._initSocket();
            callback();
        },
    ]);
};

function getKeyMapPath(dir, config) {
    const keyMap = config && config.options && config.options.keyMap;
    
    if (keyMap && keyMap !== 'default')
        return dir + 'keymap/' + keyMap;
    
    return '';
}

