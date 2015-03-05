Dword [![License][LicenseIMGURL]][LicenseURL] [![NPM version][NPMIMGURL]][NPMURL] [![Dependency Status][DependencyStatusIMGURL]][DependencyStatusURL]
=======
[NPMIMGURL]:                https://img.shields.io/npm/v/dword.svg?style=flat
[BuildStatusIMGURL]:        https://img.shields.io/travis/coderaiser/dword/master.svg?style=flat
[DependencyStatusIMGURL]:   https://img.shields.io/gemnasium/coderaiser/dword.svg?style=flat
[LicenseIMGURL]:            https://img.shields.io/badge/license-MIT-317BF9.svg?style=flat
[NPM_INFO_IMG]:             https://nodei.co/npm/dword.png
[NPMURL]:                   https://npmjs.org/package/dword "npm"
[DependencyStatusURL]:      https://gemnasium.com/coderaiser/dword "Dependency Status"
[LicenseURL]:               https://tldrlegal.com/license/mit-license "MIT License"

Web editor based on [CodeMirror](http://codemirror.net).
Fork of [edward](https://github.com/cloudcmd/edward "Edward").

![dword](https://raw.githubusercontent.com/coderaiser/dword/master/img/dword.png "dword")

## Features
- Syntax highlighting based on extension of file for over 90 languages.
- Built-in `emmet` (for html files)
- Drag n drop (drag file from desktop to editor).
- Built-in `jshint` (with options in `.jshintrc` file)
- Built-in `beautifier` (with options in `json/beautify.json`, could be overriden in `~/.beautify.json`)
- Configurable options (could be edited in `json/edit.json`)

## Install
Install [bower](http://bower.io "Bower").
And then run command:

```
npm i dword -g
```

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
| `Ctrl + l`            | go to line
| `Ctrl + b`            | beautify js, css or html
| `Ctrl + m`            | minify js, css or html

## API
dword could be used as middleware for [express](http://expressjs.com "Express").
For this purpuse API could be used.

### Server

#### dword(options)
Middleware of `dword`. Options could be omitted.

```js
var express = require('express'),
    app     = express();

app.use(dword({
    minify  : true,  /* default */
    online  : true,  /* default */
    diff    : true,  /* default */
    zip     : true   /* default */
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
dword('[data-name="js-edit"]', function(el) {
    console.log('dword is ready');
});
```
For more information you could always look around into `assets` and `bin` directory.

## License

MIT
