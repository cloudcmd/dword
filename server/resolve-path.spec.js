'use strict';

const fs = require('fs');
const path = require('path');
const test = require('tape');
const resolvePath = require('./resolve-path');

const {stat} = fs;

test('resolve-path: args', (t) => {
    t.throws(resolvePath, /name should be string!/, 'should throw when name not string');
    t.end();
});

test('resolve-path: module installed in inner directory', (t) => {
    const expect = path.resolve(__dirname, '..', 'node_modules/monaco');
    
    mock();
    resolvePath('monaco').then((name) => {
        t.equal(name, expect, 'should return path in inner directory');
        t.end();
        unmock();
    });
});

test('resolve-path: module installed in outer directory', (t) => {
    const expect = path.resolve(__dirname, '../../', 'monaco');
    
    mockFirstError();
    resolvePath('monaco').then((name) => {
        t.equal(name, expect, 'should return path in outer directory');
        t.end();
        unmock();
    });
});

test('resolve-path: module not installed', (t) => {
    mock(Error());
    resolvePath('monaco').catch(() => {
        t.pass('should reject when module not found');
        unmock();
        t.end();
    });
});

function mockFirstError() {
    let onceError;
    
    fs.stat = (name, fn) => {
        if (onceError) {
            fn();
        } else {
            onceError = true;
            fn(Error('some error'));
        }
    }
}

function mock(...args) {
    fs.stat = (name, fn) => {
        fn(...args);
    }
}

function unmock() {
    fs.stat = stat;
}

