(function () {
    'use strict';

    var path = require('path');
    var util = require('util');

    var packageJson = require('./package.json');
    var packageMsg = util.format("\n%s: %s\nVersion %s Copyright %s\n\n", packageJson.name, packageJson.description, packageJson.version, packageJson.copyright);
    var epilogMsg = util.format("For more information see %s/README.md\n\nReport issues at %s", packageJson.repository.url, packageJson.bugs.url)
  
    // https://github.com/chevex/yargs
    var optimist = require('yargs')
        .usage(packageMsg + 'Usage: node server [--host=(host)] [--user=(user)] [--password=(password)] [--debug] [--responses] [--listen=8008] [--proxy=my.proxy:8888]')
        .example("node server", "Listens on port 8008 with minimal logging. Requires user to enter Couchbase host, user and password.\n")
        .example("node server -h localhost -u admin", "Listens on port 8008 with minimal logging. Defaults to Couchbase on 'localhost' as user 'admin'. Requires user to enter Couchbase password.\n")
        .example("node server -u admin -p demo01 -l 8080", "Listens on port 8080 with minimal logging. Defaults to Couchbase user 'admin' with password 'demo01'. Requires user to enter Couchbase host name.\n")
        .example("node server --proxy=my.proxy:8888", "Listens on port 8008 and uses the designated network proxy.\n")
        .option('?', {
            alias : 'help',
            describe: 'Display the usage.'
        })
        .version(packageJson.version, 'v', "Show version number.").alias('v', 'version')
        .option('h', {
            alias : 'host',
            describe: 'Set Couchbase host.'
        })
        .option('u', {
            alias : 'user',
            describe: 'Set Couchbase user.'
        })
        .option('p', {
            alias : 'password',
            describe: 'Set Couchbase password.'
        })
        .option('s', {
            alias : 'pagesize',
            describe: 'Set the initial document viewer page size.   [min 1, max 500]',
            default: 10
        })
        .option('l', {
            alias : 'listen',
            describe: 'Set the HTTP listen port.',
            default: process.env.port || 8008
        })
        .option('x', {
            alias : 'proxy',
            describe: 'Enable a request proxy server and port.'
        })
        .option('d', {
            alias : 'debug',
            describe: 'Enable debug level log messages.'
        })
        .option('r', {
            alias : 'responses',
            describe: 'Log responses from server API requests.'
        })
        .epilog(epilogMsg);
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

    logger.info("Run as 'node server -?' for command-line options.");
    logger.debug('config - debug: ' + argv.debug);
    logger.debug('config - responses: ' + argv.responses);
    logger.debug('config - listen: ' + argv.listen);
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