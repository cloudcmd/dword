var Emitify =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/* unknown exports provided */
/* all exports used */
/*!************************!*\
  !*** ./lib/emitify.js ***!
  \************************/
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = Emitify;

function Emitify() {
    if (!(this instanceof Emitify)) return new Emitify();

    this._all = {};
}

Emitify.prototype.on = function (event, callback) {
    var funcs = this._all[event];

    check(event, callback);

    if (funcs) funcs.push(callback);else this._all[event] = [callback];

    return this;
};

Emitify.prototype.addListener = Emitify.prototype.on;

Emitify.prototype.once = function (event, callback) {
    var self = this;

    check(event, callback);

    self.on(event, function fn() {
        callback.apply(null, arguments);
        self.off(event, fn);
    });

    return this;
};

Emitify.prototype.off = function (event, callback) {
    var events = this._all[event] || [];
    var index = events.indexOf(callback);

    check(event, callback);

    while (~index) {
        events.splice(index, 1);
        index = events.indexOf(callback);
    }

    return this;
};

Emitify.prototype.removeListener = Emitify.prototype.off;

Emitify.prototype.emit = function (event) {
    var args = [].slice.call(arguments, 1);
    var funcs = this._all[event];

    checkEvent(event);

    if (!funcs && event === 'error') throw args[0];

    if (!funcs) return this;

    funcs.forEach(function (fn) {
        fn.apply(null, args);
    });

    return this;
};

Emitify.prototype.removeAllListeners = function (event) {
    checkEvent(event);

    this._all[event] = [];

    return this;
};

function checkEvent(event) {
    if (typeof event !== 'string') throw Error('event should be string!');
}

function checkFn(callback) {
    if (typeof callback !== 'function') throw Error('callback should be function!');
}

function check(event, callback) {
    checkEvent(event);
    checkFn(callback);
}

/***/ })
/******/ ]);
//# sourceMappingURL=emitify.js.map