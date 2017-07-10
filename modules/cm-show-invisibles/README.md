# CodeMirror Show Invisibles

Addon for [CodeMirror](http://codemirror.net "CodeMirror") that helps to show invisibles.

![show-invisibles](https://raw.githubusercontent.com/coderaiser/cm-show-invisibles/master/img/show-invisibles.png "CodeMirror Show Invisibles")

## Install

```
bower i cm-show-invisibles --save # or
npm i cm-show-invisibles --save
```

## How to use?

```js
const cm = CodeMirror(document.body, {
    showInvisibles: true,
    maxInvisibles: 16 // optional
});
```

## License

MIT
