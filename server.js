(function () {
    'use strict';

    var path = require('path');
    var util = require('util');

    var log4js = require('log4js');
    var logger = log4js.getLogger('cb-bread');

    var commandLineArguments = require('./app/commandLineArguments');
    var argv = commandLineArguments.parseProcessArguments();

    if (argv.debug) {
        logger.setLevel('DEBUG');
    }
    else {
        logger.setLevel('INFO');
    }

    if (argv.proxy) {
        var array = argv.proxy.split(':');
        if (array.length === 2) {
            var host = array[0];
            var port = array[1];
            require('./request-proxy.js')(host, port, logger);
        }
    }

    process.on('uncaughtException', function (err) {
        console.trace("Uncaught Exception");
        logger.error("process.on uncaughtException\n" + util.inspect(err) + "\n=== Stack trace ===\n" + err.stack);
    });

    logger.info("Run as 'node server -?' for command-line options.");
    logger.debug('config - responses: ' + argv.responses);
    logger.debug('config - listen: ' + argv.listen);
    logger.debug('config - proxy: ' + argv.proxy);

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

    // http://expressjs.com/guide/error-handling.html
    app.use(function(err, req, res, next){
        logger.error("app.use error\n" + util.inspect(err) + "\n=== Stack trace ===\n" + err.stack);
        res.status(500).send("Server error. Are your credentials correct?");
    });

    // launch api
    var api = require('./api');
    api.initialize(app, argv, logger);

    app.listen(argv.listen);
    logger.info('http://localhost:' + argv.listen + '/');
    process.title = 'cb-bread';
})();