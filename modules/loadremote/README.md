# Load Remote

Library for loading modules from cdn or local file system.

## Install

With npm:

```
npm i load-remote --save
```

Or with bower:

```
bower i load-remote --save
```

## How to use?

You should create files `modules.json` similar to this:

```json
[{
    "name": "socket",
    "version": "1.3.5",
    "local": "/socket.io/socket.io.js",
    "remote": "//cdn.socket.io/socket.io-{{ version }}.js"
}]
```

And `options.js`:

```json
{
    "online": true
}
```

Then load [execon](https://github.com/coderaiser/execon "Execon") and `lib/load-remote.js`
and run this code:

```js
loadRemote('socket', {  /* name of module in modules.json */
    name : 'io',    {   /* name of variable in window object */
    prefix: prefix,     /* prefix for loading modules.json and options.json (could be empty) */
    noPrefix: true      /* do not add prefix to socket local url */
}, callback);
```

## License

MIT
