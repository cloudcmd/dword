var exec, load;

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports      = new LoadRemote();
    else
        global.loadRemote   = new LoadRemote();
        
    function LoadRemote() {
        var once        = memo(amemo),
            loadRemote  = function(name, options, callback) {
                var o       = options,
                    prefix  = o.prefix || '/',
                    funcs   = [
                        loadModules,
                        loadOptions
                    ].map(function(fn) {
                        return setPrefix(prefix, fn);
                    }).map(function(fn) {
                        return once(fn);
                    });
                
                if (!callback) {
                    callback    = options;
                    o           = {};
                }
                
                if (o.name && global[o.name])
                    return callback();
                
                exec.parallel(funcs, function(error, modules, config) {
                    var remoteTmpls, local, remote,
                        online, module, isArray, version,
                        name,
                        
                        funcON      = function() {
                            load.parallel(remote, function(error) {
                                if (error)
                                    funcOFF();
                                else
                                    callback();
                            });
                        },
                        
                        funcOFF     = function() {
                            load.parallel(local, callback);
                        };
                    
                    if (error) {
                        if (!module)
                            name = 'module';
                        
                        if (!config)
                            name = 'config';
                        
                        alert('Error: could not load !');
                        
                        return;
                    }
                    
                    online      = config.online && navigator.onLine,
                    module      = binom(name, modules),
                    
                    isArray     = Array.isArray(module.local),
                    version     = module.version;
                    
                    if (isArray) {
                        remoteTmpls = module.remote;
                        local       = module.local;
                    } else {
                       remoteTmpls  = [module.remote];
                       local        = [module.local];
                    }
                    
                    local   = local.map(function(url) {
                        return o.noPrefix ? url :prefix + url;
                    });
                    
                    remote  = remoteTmpls.map(function(tmpl) {
                        return tmpl.replace(/{{\sversion\s}}/g, version);
                    });
                    
                    exec.if(online, funcON, funcOFF);
                });
            };
            
        loadRemote.load         = loadRemote;
        
        function setPrefix(prefix, fn) {
            return fn.bind(null, prefix);
        }
        
        function amemo(fn) {
            var result;
            
            return function(callback) {
                if (result)
                    callback(null, result);
                else
                    fn(function(error, data) {
                        if (data)
                            result = data;
                        
                        callback(error, result);
                    });
            };
        }
        
        function memo(fn) {
            var result;
            
            return function() {
                if (!result)
                    result = fn.apply(null, arguments);
                
                return result;
            };
        }
        
        function loadModules(prefix, callback) {
            var url = prefix + '/modules.json';
            
            load.json(url, callback);
        }
        
        function loadOptions(prefix, callback) {
            var url = prefix + '/options.json';
            
            load.json(url, callback);
        }
        
        function binom(name, array) {
            var ret;
            
            if (typeof name !== 'string')
                throw(Error('name should be string!'));
            
            if (!Array.isArray(array))
                throw(Error('array should be array!'));
            
            array.some(function(item) {
                var is = item.name === name;
                
                if (is)
                    ret = item;
                
                return is;
            });
            
            return ret;
        }
        
        return loadRemote;
    }
    
})(this);
