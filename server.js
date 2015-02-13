(function () {
    'use strict';

    var util = require('util');

    var path = require('path');

    // http://stackoverflow.com/questions/15889826/trying-to-use-optimist-api-help-to-print-usage
    var optimist = require('optimist')
        .usage('Usage: $0 [--host=(host)] [--user=(user)] [--password=(password)] [--debug] [--responses] [--listen=8008] [--proxy=server:nnnn]')
        .describe('?', 'Display the usage.')
        .alias('?', 'help')
        .describe('h', 'Set Couchbase host.')
        .alias('h', 'host')
        .describe('u', 'Set Couchbase user.')
        .alias('u', 'user')
        .describe('p', 'Set Couchbase password.')
        .alias('p', 'password')
        .describe('d', 'Enable debug level log messages.')
        .alias('d', 'debug')
        .describe('r', 'Log responses from server api requests.')
        .alias('r', 'responses')
        .describe('l', 'Set the HTTP listen port.')
        .default('l', process.env.port || 8008)
        .alias('l', 'listen')
        .describe('x', 'Enable a request proxy server and port number.')
        .default('x', null)
        .alias('x', 'proxy');
    var argv = optimist.argv;
    if (argv.help) {
        optimist.showHelp();
        process.exit(0);
    }

    var log4js = require('log4js');
    var logger = log4js.getLogger('cb-bread');
    if (argv.debug) {
        logger.setLevel('DEBUG');
    }
    else {
        logger.setLevel('INFO');
    }

    process.on('uncaughtException', function (err) {
        console.trace("Uncaught Exception");
        logger.error("process.on uncaughtException\n" + util.inspect(err) + "\n=== Stack trace ===\n" + err.stack);
    });

    logger.debug('config - debug: ' + argv.debug);
    logger.debug('config - port: ' + argv.listen);
    logger.debug('config - proxy: ' + argv.proxy);

    if (argv.proxy) {
        var array = argv.proxy.split(':');
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