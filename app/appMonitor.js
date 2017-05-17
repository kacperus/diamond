var request = require('request');
var timers = require('timers');

var environments = [];
var appMetadata = {
};

var probes = [];
var timer;

exports.setEnvironments = function(envs) {
    console.info("configured envs:", envs);
    environments = envs;
};

exports.registerApp = function(name, urls, extractor) {

    var meta = {
        name: name,
        envs: {}
    };

    Object.keys(urls).forEach(function(env) {

        probes.push(function(){
            request(urls[env], function (error, response, body) {
                if (error) {
                    console.error(error);
                    meta.envs[env] = {
                        error: true
                    }
                }
                else {
                    var ver = extractor(body);
                    if (ver) {
                        console.info(env + ", " + name + ", v=" + ver);
                        meta.envs[env] = {
                            version: ver,
                            error: false
                        };
                    }
                    else {
                        console.info("Failed to perse version from", body);
                        meta.envs[env] = null;
                    }
                }
            });
        });

    });

    appMetadata[name] = meta;
};

function fetchVersions() {
    console.info('fetching new versions');
    probes.forEach(function(probe){
        probe();
    });
}

exports.start = function() {
    if (!timer) {
        fetchVersions();
        timer = timers.setInterval(fetchVersions, 3 * 60 * 1000);
    }
};

exports.stop = function() {
    if (timer) {
        timer.clearInterval();
        timer = null;
    }
};

exports.getSnapshot = function() {
    var result = [];

    Object.keys(appMetadata).forEach(function(name){
        var app = appMetadata[name];
        var vInfo = [];
        var firstVersion = '';

        environments.forEach(function(env){
            var meta = {
                version: '?',
                status: 'unknown'
            };
            if (app.envs[env]) {
                meta.error = app.envs[env].error;
                meta.version = app.envs[env].version;
                meta.status = firstVersion ? (firstVersion == meta.version ? 'ok' : 'obsolate') : 'ok';
                if (!firstVersion) {
                    firstVersion = meta.version;
                }
            }
            vInfo.push(meta);
        });

        var allSame = true;
        var prevV = '';
        vInfo.forEach(function(v){
            if (prevV && prevV != v.version) {
                allSame = false;
            }
            prevV = v.version;
        });

        result.push({
            name: name,
            status: allSame,
            versions: vInfo
        });
    });
    return result;
};

exports.getEnvironmetns = function() {
    return environments;
};