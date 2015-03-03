var exec, load;

(function(global) {
    'use strict';
    
    if (typeof module !== 'undefined' && module.exports)
        module.exports      = new LoadRemote();
    else
        global.loadRemote   = new LoadRemote();
        
    function LoadRemote() {
        var Prefix      = '/',
            loadRemote  = function(name, options, callback) {
                var o   = options;
                
                if (!callback)
                    callback = options;
                
                if (o.name && global[o.name])
                    callback();
                else
                    exec.parallel([loadModules, loadOptions], function(error, modules, config) {
                        var remoteTmpls, local, remote,
                            online, module, isArray, version,
                            
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
                                alert('Error: could not load module!');
                            
                            if (!config)
                                alert('Error: could not load config!');
                        } else {
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
                                return o.noPrefix ? url : Prefix + url;
                            });
                            
                            remote  = remoteTmpls.map(function(tmpl) {
                                return tmpl.replace(/{{\sversion\s}}/g, version);
                            });
                            
                            exec.if(online, funcON, funcOFF);
                        }
                    });
                };
            
            loadRemote.setPrefix      = function(prefix) {
                Prefix = prefix;
                
                return loadRemote;
            };
            
            loadRemote.load         = loadRemote;
            
            function loadModules(callback) {
                var url = Prefix + '/json/modules.json';
                
                load.json(url, callback);
            }
            
            function loadOptions(callback) {
                var url = Prefix + '/options.json';
                
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
