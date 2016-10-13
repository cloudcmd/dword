Dword [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL]
=======
[NPMIMGURL]:                https://img.shields.io/npm/v/dword.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/cloudcmd/dword/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/cloudcmd/dword.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPM_INFO_IMG]:             https://nodei.co/npm/dword.png?downloads=true&&stars&&downloadRank "npm install dword"
[NPMURL]:                   https://npmjs.org/package/dword "npm"
[DependencyStatusURL]:      https://gemnasium.com/cloudcmd/dword "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

[beautifile]:               https://github.com/coderaiser/node-beautifile "Beautifile"
[beautify.json]:            https://github.com/coderaiser/node-beautifile/tree/master/json/beautify.json "beautify.json"

[edit.json]:                https://github.com/cloudcmd/dword/tree/master/json/edit.json "edit.json"

Web editor based on [CodeMirror](http://codemirror.net).
Fork of [edward](https://github.com/cloudcmd/edward "Edward").

![dword](https://raw.githubusercontent.com/cloudcmd/dword/master/img/dword.png "dword")

## Features
- Syntax highlighting based on extension of file for over 90 languages.
- Built-in `emmet` (for html files)
- Drag n drop (drag file from desktop to editor).
- Built-in `jshint` (with options in `.jshintrc` file, could be overriden by `~/.jshintrc`)
- Built-in [beautifier][beautifile] (with options in [json/beautify.json][beautify.json], could be overriden by `~/.beautify.json`)
- Configurable options ([json/edit.json][edit.json] could be overriden by `~/.dword.json`)

## Install

```
npm i dword -g
```

![NPM_INFO][NPM_INFO_IMG]

## Command line parameters

Usage: `dword [filename]`

|Parameter              |Operation
|:----------------------|:--------------------------------------------
| `-h, --help`          | display help and exit
| `-v, --version`       | output version information and exit

## Hot keys
|Key                    |Operation
|:----------------------|:--------------------------------------------
| `Ctrl + s`            | save
| `Ctrl + f`            | find
| `Ctrl + h`            | replace
| `Ctrl + g`            | go to line
| `Ctrl + b`            | beautify js, css or html
| `Ctrl + m`            | minify js, css or html
| `Ctrl + e`            | evaluate (JavaScript only supported)

## API
dword could be used as middleware for [express](http://expressjs.com "Express").
For this purpuse API could be used.

### Server

#### dword(options)
Middleware of `dword`. Options could be omitted.

```js
var dword   = require('dword'),
    express = require('express'),
    app     = express();

app.use(dword({
    minify  : true,  /* default */
    online  : true,  /* default */
    diff    : true,  /* default */
    zip     : true,  /* default */
    authCheck: function(socket, success) { /* optional */
    }
}));

app.listen(31337);
```

#### dword.listen(socket)
Could be used with [socket.io](http://socket.io "Socket.io") to handle editor events with.

```js
var io      = require('socket.io'),
    socket  = io.listen(server);

dword.listen(socket);
```

### Client
Dword uses [codemirror](http://codemirror.net/ "CodeMirror") on client side, so API is similar.
All you need is put minimal `html`, `css`, and `js` into your page.

Minimal html:

```html
<div class="edit" data-name="js-edit"></div>
<script src="/dword/dword.js"></script>
```

Minimal css:

```css
html, body, .edit {
    height: 100%;
    margin: 0;
}
```

Minimal js:
```js
dword('[data-name="js-edit"]', function(editor) {
    editor.setValue('hello dword');
    console.log('dword is ready');
});
```
For more information you could always look around into `assets` and `bin` directory.

## Related

- [Edward](https://github.com/cloudcmd/edward "Edwdard") - web editor based on [Ace](https://ace.c9.io "Ace").
- [Deepword](https://github.com/cloudcmd/deepword "Deepword") - web editor based on [Monaco](https://microsoft.github.io/monaco-editor/ "Monaco").

## License

MIT
