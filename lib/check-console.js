require('console.json');
var check = require('check-types');
var verify = check.verify;
var spawn = require('child_process').spawn;
var exists = require('fs').existsSync;
var join = require('path').join;
var dirname = require('path').dirname;
var q = require('q');


function checkConsole(options) {
    var outdata="";
    var errordata="";
    var defer = q.defer();
    verify.object(options, 'missing options object');

    var url = options.url;
    verify.string(url, 'missing url');
    var phantomjs = options.phantomjs || 'phantomjs';
    verify.unemptyString(phantomjs, 'missing phantomjs path');

    if (!check.webUrl(url)) {
        if (!exists(url)) {
            //assuming http:// for url
            url = 'http://' + url;
        }
    }

    var runner = 'runner.js';
    var phantomRunnerFilename = join(dirname(module.filename), runner);

    var phantomArguments = [phantomRunnerFilename, url];
    if (options.verbose) {
        //running phantomjs in verbose mode
        phantomArguments.push('--verbose');
    }
    if (check.number(options.timeout)) {
        verify.positiveNumber(options.timeout, 'invalid timeout ' + options.timeout);
        phantomArguments.push('--timeout');
        phantomArguments.push(options.timeout * 1000);
    }

    var phantomProc;
    
    try {
        phantomProc = spawn(phantomjs, phantomArguments);

    } catch (err) {
        process.nextTick(function () {
            onPhantomError(err);
        });
        errordata = "PhantomJs error occured";
        return defer.promise;
    } 

    phantomProc.stdout.on('data', function (data) {
        outdata += data;
        
    });

    phantomProc.stderr.on('data', function (data) {
        errordata += data;
    });

    phantomProc.on('exit', function onPhantomJsFinished(code) {
        if (errordata == "") {
        defer.resolve(outdata);
    } else {
        defer.resolve(errordata);
    }
    });

    phantomProc.on('error', onPhantomError);

    function onPhantomError(error) {
        defer.reject(error);
    }

    return defer.promise;
}

module.exports = checkConsole;
