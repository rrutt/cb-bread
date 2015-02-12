(function () {
    'use strict';

    var util = require('util');

    var path = require('path');
    var argv = require('optimist').usage('Usage: $0 [--port] [--debug] [--proxy]')
        .default('port', process.env.port || 8008)
        .default('debug', true)
        .default('proxy', null)
        .argv;

    var log4js = require('log4js');
    var logger = log4js.getLogger('cb-bread');
    if (argv['debug'] === true) {
        logger.setLevel('DEBUG');
    }
    else {
        logger.setLevel('INFO');
    }

    process.on('uncaughtException', function (err) {
        console.trace("Uncaught Exception");
        logger.error("uncaughtException\n" + util.inspect(err) + "\n=== Stack trace ===\n" + err.stack);
    });

    logger.debug('config - port: ' + argv['port']);
    logger.debug('config - debug: ' + argv['debug']);
    logger.debug('config - proxy: ' + argv['proxy']);

    if (argv['proxy']) {
        var array = argv['proxy'].split(':');
        if (array.length === 2) {
            var host = array[0];
            var port = array[1];
            require('./request-proxy.js')(host, port, logger);
        }
    }

    var express = require('express');
    var app = express();

    // log
    app.use(function (req, res, next) {
        var requestTimeInMs = Date.now();
        res.on('finish', function () {
            var durationInMs = Date.now() - requestTimeInMs;
            logger.debug('[' + req.method + '] ' + durationInMs + 'ms: ' + req.url);
        });
        next();
    });
    // url encoding
    var bodyParser = require('body-parser');
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());
    // gzip
    var compression = require('compression');
    app.use(compression());
    // redirect all html requests to `index.html`
    app.use(function (req, res, next) {
        if (req.path.split('/')[1] === 'api') {
            // api request
            next();
        }
        else if (path.extname(req.path).length > 0) {
            // normal static file request
            next();
        }
        else {
            // should force return `index.html` for angular.js
            req.url = '/index.html';
            next();
        }
    });
    // static file serve
    app.use(express.static(__dirname + '/app'));

    // launch api
    var api = require('./api');
    api.initialize(app, logger);

    app.listen(argv['port']);
    logger.info('http://localhost:' + argv['port'] + '/');
    process.title = 'cb-bread';
})();