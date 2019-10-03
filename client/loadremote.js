'use strict';

const load = require('load.js');
const tryToCatch = require('try-to-catch');
const once = require('once');

const loadModules = once(async (prefix) => {
    const url = prefix + '/modules.json';
    return await load.json(url);
});

const loadOptions = once(async (prefix) => {
    const url = prefix + '/options.json';
    return await load.json(url);
});

const on = async (remote) => {
    const [error] = await tryToCatch(load.parallel, remote);
    
    if (error)
        await off();
};

const off = async function(local) {
    await load.parallel(local);
};

module.exports = async (name, options = {}) => {
    const o = options;
    
    const {
        prefix = '',
    } = o;
    
    if (o.name && global[o.name])
        return;
    
    const promises = [
        loadModules(prefix),
        loadOptions(prefix),
    ];
    
    const [error, [modules, config]] = await tryToCatch(Promise.all.bind(Promise), promises);
    
    let remoteTmpls;
    let local;
    
    if (error)
        return alert(`Error: could not load module or config: ${error.message}`);
    
    const online = config.online && navigator.onLine;
    const module = binom(name, modules);
    const isArray = Array.isArray(module.local);
    const {version} = module;
    
    if (isArray) {
        remoteTmpls = module.remote;
        local = module.local;
    } else {
        remoteTmpls = [module.remote];
        local = [module.local];
    }
    
    local = local.map((url) => {
        return prefix + url;
    });
    
    const remote = remoteTmpls.map((tmpl) => {
        return tmpl.replace(/{{\sversion\s}}/g, version);
    });
    
    if (!online)
        return await off(local);
    
    await on(remote);
};

function binom(name, array) {
    let ret;
    
    if (typeof name !== 'string')
        throw Error('name should be string!');
    
    if (!Array.isArray(array))
        throw Error('array should be array!');
    
    array.some((item) => {
        const is = item.name === name;
        
        if (is)
            ret = item;
        
        return is;
    });
    
    return ret;
}

